const express = require('express');
const router = express.Router();
const db = require('../config/database');
const QRCode = require('qrcode');

// Yangi tahlil buyurtmasi
router.post('/', async (req, res) => {
    try {
        const { bemor_id, tahlil_turi, laborant_id } = req.body;

        // QR kod yaratish
        const qrData = `TAHLIL-${bemor_id}-${Date.now()}`;
        const qrKod = await QRCode.toDataURL(qrData);

        const [result] = await db.execute(
            'INSERT INTO tahlillar (bemor_id, tahlil_turi, qr_kod, laborant_id) VALUES (?, ?, ?, ?)',
            [bemor_id, tahlil_turi, qrKod, laborant_id]
        );

        res.status(201).json({
            success: true,
            message: 'Tahlil buyurtmasi qo\'shildi',
            tahlilId: result.insertId,
            qrKod
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemor tahillari
router.get('/bemor/:bemor_id', async (req, res) => {
    try {
        const [tahlillar] = await db.execute(`
            SELECT t.*, l.ism as laborant_ismi, l.familiya as laborant_familiya
            FROM tahlillar t
            LEFT JOIN xodimlar l ON t.laborant_id = l.id
            WHERE t.bemor_id = ?
            ORDER BY t.buyurtma_vaqti DESC
        `, [req.params.bemor_id]);

        res.json({ success: true, data: tahlillar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tahlil natijasini kiritish
router.put('/:id/natija', async (req, res) => {
    try {
        const { natija, laborant_id } = req.body;

        await db.execute(
            `UPDATE tahlillar 
             SET natija = ?, natija_vaqti = NOW(), holati = 'tayyor', laborant_id = ?
             WHERE id = ?`,
            [natija, laborant_id, req.params.id]
        );

        res.json({ success: true, message: 'Natija kiritildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tahlil QR kodini olish
router.get('/:id/qr', async (req, res) => {
    try {
        const [tahlil] = await db.execute(
            'SELECT qr_kod FROM tahlillar WHERE id = ?',
            [req.params.id]
        );

        if (tahlil.length === 0) {
            return res.status(404).json({ success: false, message: 'Tahlil topilmadi' });
        }

        res.json({ success: true, qrKod: tahlil[0].qr_kod });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Kutilayotgan tahlillar
router.get('/kutilayotgan', async (req, res) => {
    try {
        const [tahlillar] = await db.execute(`
            SELECT t.*, b.ism, b.familiya, b.telefon
            FROM tahlillar t
            JOIN bemorlar b ON t.bemor_id = b.id
            WHERE t.holati IN ('kutilmoqda', 'jarayonda')
            ORDER BY t.buyurtma_vaqti
        `);

        res.json({ success: true, data: tahlillar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tayyor tahlillar (Telegram bot uchun)
router.get('/tayyor', async (req, res) => {
    try {
        const [tahlillar] = await db.execute(`
            SELECT t.*, b.ism, b.familiya, b.telefon, b.telegram_username
            FROM tahlillar t
            JOIN bemorlar b ON t.bemor_id = b.id
            WHERE t.holati = 'tayyor'
            AND t.natija_vaqti >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            ORDER BY t.natija_vaqti DESC
        `);

        res.json({ success: true, data: tahlillar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tahlil holatini o'zgartirish
router.put('/:id/holat', async (req, res) => {
    try {
        const { holati } = req.body;

        await db.execute(
            'UPDATE tahlillar SET holati = ? WHERE id = ?',
            [holati, req.params.id]
        );

        res.json({ success: true, message: 'Holat yangilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tahlil ma'lumotlarini to'liq olish
router.get('/:id', async (req, res) => {
    try {
        const [tahlil] = await db.execute(`
            SELECT t.*, 
                   b.ism, b.familiya, b.telefon,
                   l.ism as laborant_ismi, l.familiya as laborant_familiya
            FROM tahlillar t
            JOIN bemorlar b ON t.bemor_id = b.id
            LEFT JOIN xodimlar l ON t.laborant_id = l.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (tahlil.length === 0) {
            return res.status(404).json({ success: false, message: 'Tahlil topilmadi' });
        }

        res.json({ success: true, data: tahlil[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
