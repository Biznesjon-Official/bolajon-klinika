const express = require('express');
const router = express.Router();
const db = require('../config/database');
const QRCode = require('qrcode');

// Navbatga qo'shish
router.post('/', async (req, res) => {
    try {
        const { bemor_id, shifokor_id } = req.body;

        // Bugungi navbat raqamini olish
        const [navbatlar] = await db.execute(
            `SELECT MAX(navbat_raqami) as max_raqam FROM navbat 
             WHERE DATE(yaratilgan_vaqt) = CURDATE() AND shifokor_id = ?`,
            [shifokor_id]
        );

        const navbatRaqami = (navbatlar[0].max_raqam || 0) + 1;
        const qrData = `NAVBAT-${shifokor_id}-${navbatRaqami}-${Date.now()}`;
        const qrKod = await QRCode.toDataURL(qrData);

        const [result] = await db.execute(
            'INSERT INTO navbat (bemor_id, shifokor_id, navbat_raqami, qr_kod) VALUES (?, ?, ?, ?)',
            [bemor_id, shifokor_id, navbatRaqami, qrKod]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Navbatga qo\'shildi',
            navbatRaqami,
            qrKod,
            navbatId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Shifokor navbatini ko'rish
router.get('/shifokor/:shifokor_id', async (req, res) => {
    try {
        const [navbatlar] = await db.execute(
            `SELECT n.*, b.ism, b.familiya, b.telefon 
             FROM navbat n
             JOIN bemorlar b ON n.bemor_id = b.id
             WHERE n.shifokor_id = ? AND DATE(n.yaratilgan_vaqt) = CURDATE()
             ORDER BY n.navbat_raqami`,
            [req.params.shifokor_id]
        );

        res.json({ success: true, data: navbatlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Navbat holatini o'zgartirish
router.put('/:id/holat', async (req, res) => {
    try {
        const { holati } = req.body;
        
        await db.execute(
            'UPDATE navbat SET holati = ?, qabul_vaqti = NOW() WHERE id = ?',
            [holati, req.params.id]
        );

        res.json({ success: true, message: 'Holat yangilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Kutish zalidagi odamlar soni
router.get('/kutish-zali/soni', async (req, res) => {
    try {
        const [result] = await db.execute(
            `SELECT COUNT(*) as soni FROM navbat 
             WHERE holati = 'kutmoqda' AND DATE(yaratilgan_vaqt) = CURDATE()`
        );

        res.json({ success: true, soni: result[0].soni });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
