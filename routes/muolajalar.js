const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Yangi muolaja rejasi qo'shish
router.post('/', async (req, res) => {
    try {
        const { bemor_id, muolaja_turi, dori_nomi, dozasi, vaqti, hamshira_id, izoh } = req.body;

        const [result] = await db.execute(
            `INSERT INTO muolajalar (bemor_id, muolaja_turi, dori_nomi, dozasi, vaqti, hamshira_id, izoh)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [bemor_id, muolaja_turi, dori_nomi, dozasi, vaqti, hamshira_id, izoh]
        );

        res.status(201).json({
            success: true,
            message: 'Muolaja qo\'shildi',
            muolajaId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemor muolajalar jadvali
router.get('/bemor/:bemor_id', async (req, res) => {
    try {
        const [muolajalar] = await db.execute(`
            SELECT m.*, h.ism as hamshira_ismi, h.familiya as hamshira_familiya
            FROM muolajalar m
            LEFT JOIN xodimlar h ON m.hamshira_id = h.id
            WHERE m.bemor_id = ?
            ORDER BY m.vaqti DESC
        `, [req.params.bemor_id]);

        res.json({ success: true, data: muolajalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bugungi muolajalar
router.get('/bugun', async (req, res) => {
    try {
        const [muolajalar] = await db.execute(`
            SELECT m.*, 
                   b.ism, b.familiya,
                   h.ism as hamshira_ismi
            FROM muolajalar m
            JOIN bemorlar b ON m.bemor_id = b.id
            LEFT JOIN xodimlar h ON m.hamshira_id = h.id
            WHERE DATE(m.vaqti) = CURDATE()
            AND m.bajarildi = FALSE
            ORDER BY m.vaqti
        `);

        res.json({ success: true, data: muolajalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Muolaja bajarildi belgisi
router.put('/:id/tasdiqlash', async (req, res) => {
    try {
        const { hamshira_id } = req.body;

        await db.execute(
            'UPDATE muolajalar SET bajarildi = TRUE, hamshira_id = ? WHERE id = ?',
            [hamshira_id, req.params.id]
        );

        res.json({ success: true, message: 'Muolaja bajarildi deb belgilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Kelgusi 30 daqiqadagi muolajalar (Alert uchun)
router.get('/alert', async (req, res) => {
    try {
        const [muolajalar] = await db.execute(`
            SELECT m.*, 
                   b.ism, b.familiya,
                   s.palata_raqami, s.koyka_raqami, s.qavat
            FROM muolajalar m
            JOIN bemorlar b ON m.bemor_id = b.id
            LEFT JOIN statsionar_tarixi st ON st.bemor_id = b.id AND st.chiqish_vaqti IS NULL
            LEFT JOIN koykalar s ON st.koyka_id = s.id
            WHERE m.vaqti BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
            AND m.bajarildi = FALSE
            ORDER BY m.vaqti
        `);

        res.json({ success: true, data: muolajalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Muolaja vaqtini o'zgartirish
router.put('/:id/vaqt', async (req, res) => {
    try {
        const { yangi_vaqt } = req.body;

        await db.execute(
            'UPDATE muolajalar SET vaqti = ? WHERE id = ?',
            [yangi_vaqt, req.params.id]
        );

        res.json({ success: true, message: 'Vaqt o\'zgartirildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Muolajani o'chirish
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM muolajalar WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Muolaja o\'chirildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hamshira kunlik muolajalar ro'yxati
router.get('/hamshira/:hamshira_id', async (req, res) => {
    try {
        const [muolajalar] = await db.execute(`
            SELECT m.*, b.ism, b.familiya
            FROM muolajalar m
            JOIN bemorlar b ON m.bemor_id = b.id
            WHERE m.hamshira_id = ?
            AND DATE(m.vaqti) = CURDATE()
            ORDER BY m.vaqti
        `, [req.params.hamshira_id]);

        res.json({ success: true, data: muolajalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
