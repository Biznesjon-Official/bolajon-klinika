const express = require('express');
const router = express.Router();
const db = require('../config/database');
const QRCode = require('qrcode');

// Yangi bemor qo'shish
router.post('/', async (req, res) => {
    try {
        const { passport_seriya, passport_raqam, jshshir, ism, familiya, otasining_ismi, 
                tug_sana, jinsi, telefon, manzil, telegram_username } = req.body;

        // QR kod yaratish
        const bemorId = `BEM${Date.now()}`;
        const qrKod = await QRCode.toDataURL(bemorId);

        const [result] = await db.execute(
            `INSERT INTO bemorlar (passport_seriya, passport_raqam, jshshir, ism, familiya, 
             otasining_ismi, tug_sana, jinsi, telefon, manzil, telegram_username, qr_kod) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [passport_seriya, passport_raqam, jshshir, ism, familiya, otasining_ismi, 
             tug_sana, jinsi, telefon, manzil, telegram_username, qrKod]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Bemor muvaffaqiyatli qo\'shildi',
            bemorId: result.insertId,
            qrKod 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemorlar ro'yxati
router.get('/', async (req, res) => {
    try {
        const [bemorlar] = await db.execute('SELECT * FROM bemorlar ORDER BY id DESC');
        res.json({ success: true, data: bemorlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemor ma'lumotlarini olish
router.get('/:id', async (req, res) => {
    try {
        const [bemor] = await db.execute('SELECT * FROM bemorlar WHERE id = ?', [req.params.id]);
        
        if (bemor.length === 0) {
            return res.status(404).json({ success: false, message: 'Bemor topilmadi' });
        }

        // Kasallik tarixi
        const [kasalliklar] = await db.execute(
            'SELECT * FROM kasallik_tarixi WHERE bemor_id = ? ORDER BY sana DESC',
            [req.params.id]
        );

        // To'lovlar tarixi
        const [tolovlar] = await db.execute(
            'SELECT * FROM tolovlar WHERE bemor_id = ? ORDER BY sana DESC',
            [req.params.id]
        );

        res.json({ 
            success: true, 
            data: {
                bemor: bemor[0],
                kasalliklar,
                tolovlar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemor ma'lumotlarini yangilash
router.put('/:id', async (req, res) => {
    try {
        const { ism, familiya, telefon, manzil, telegram_username } = req.body;
        
        await db.execute(
            'UPDATE bemorlar SET ism=?, familiya=?, telefon=?, manzil=?, telegram_username=? WHERE id=?',
            [ism, familiya, telefon, manzil, telegram_username, req.params.id]
        );

        res.json({ success: true, message: 'Ma\'lumotlar yangilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Kasallik tarixini qo'shish
router.post('/:id/kasallik', async (req, res) => {
    try {
        const { tashxis, shikoyat, shifokor_id } = req.body;
        
        await db.execute(
            'INSERT INTO kasallik_tarixi (bemor_id, tashxis, shikoyat, shifokor_id) VALUES (?, ?, ?, ?)',
            [req.params.id, tashxis, shikoyat, shifokor_id]
        );

        res.status(201).json({ success: true, message: 'Kasallik tarixi qo\'shildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
