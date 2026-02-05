const express = require('express');
const router = express.Router();
const db = require('../config/database');

// To'lov qo'shish
router.post('/', async (req, res) => {
    try {
        const { bemor_id, xizmat_id, summa, tolangan_summa, tolov_turi, kassa_xodimi_id } = req.body;

        const chekRaqami = `CHK${Date.now()}`;

        const [result] = await db.execute(
            `INSERT INTO tolovlar (bemor_id, xizmat_id, summa, tolangan_summa, tolov_turi, chek_raqami, kassa_xodimi_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [bemor_id, xizmat_id, summa, tolangan_summa, tolov_turi, chekRaqami, kassa_xodimi_id]
        );

        res.status(201).json({ 
            success: true, 
            message: 'To\'lov qo\'shildi',
            chekRaqami,
            tolovId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemor qarzi
router.get('/qarz/:bemor_id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT SUM(qarz) as umumiy_qarz FROM tolovlar WHERE bemor_id = ?',
            [req.params.bemor_id]
        );

        res.json({ 
            success: true, 
            umumiyQarz: result[0].umumiy_qarz || 0 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// To'lovlar tarixi
router.get('/bemor/:bemor_id', async (req, res) => {
    try {
        const [tolovlar] = await db.execute(
            `SELECT t.*, x.nomi as xizmat_nomi 
             FROM tolovlar t
             JOIN xizmatlar x ON t.xizmat_id = x.id
             WHERE t.bemor_id = ?
             ORDER BY t.sana DESC`,
            [req.params.bemor_id]
        );

        res.json({ success: true, data: tolovlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Kunlik kassa hisoboti
router.get('/hisobot/kunlik', async (req, res) => {
    try {
        const [result] = await db.execute(
            `SELECT 
                COUNT(*) as tolovlar_soni,
                SUM(tolangan_summa) as umumiy_summa,
                SUM(qarz) as umumiy_qarz
             FROM tolovlar 
             WHERE DATE(sana) = CURDATE()`
        );

        res.json({ success: true, data: result[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xizmatlar ro'yxati
router.get('/xizmatlar', async (req, res) => {
    try {
        const [xizmatlar] = await db.execute('SELECT * FROM xizmatlar WHERE aktiv = TRUE');
        res.json({ success: true, data: xizmatlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
