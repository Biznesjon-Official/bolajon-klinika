const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Barcha xodimlar ro'yxati
router.get('/', async (req, res) => {
    try {
        const [xodimlar] = await db.execute(
            'SELECT id, ism, familiya, lavozim, telefon, login, maosh, foiz_stavka, aktiv FROM xodimlar WHERE aktiv = TRUE'
        );
        res.json({ success: true, data: xodimlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Yangi xodim qo'shish
router.post('/', async (req, res) => {
    try {
        const { ism, familiya, lavozim, telefon, login, parol, maosh, foiz_stavka } = req.body;

        // Parolni xeshlash
        const parolHash = await bcrypt.hash(parol, 10);

        const [result] = await db.execute(
            `INSERT INTO xodimlar (ism, familiya, lavozim, telefon, login, parol_hash, maosh, foiz_stavka)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ism, familiya, lavozim, telefon, login, parolHash, maosh, foiz_stavka]
        );

        res.status(201).json({
            success: true,
            message: 'Xodim qo\'shildi',
            xodimId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xodim ma'lumotlarini yangilash
router.put('/:id', async (req, res) => {
    try {
        const { ism, familiya, telefon, maosh, foiz_stavka } = req.body;

        await db.execute(
            'UPDATE xodimlar SET ism=?, familiya=?, telefon=?, maosh=?, foiz_stavka=? WHERE id=?',
            [ism, familiya, telefon, maosh, foiz_stavka, req.params.id]
        );

        res.json({ success: true, message: 'Ma\'lumotlar yangilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xodimni o'chirish (aktiv=false)
router.delete('/:id', async (req, res) => {
    try {
        await db.execute(
            'UPDATE xodimlar SET aktiv = FALSE WHERE id = ?',
            [req.params.id]
        );

        res.json({ success: true, message: 'Xodim o\'chirildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xodim login (JWT token)
router.post('/login', async (req, res) => {
    try {
        const { login, parol } = req.body;

        // Xodimni topish
        const [xodimlar] = await db.execute(
            'SELECT * FROM xodimlar WHERE login = ? AND aktiv = TRUE',
            [login]
        );

        if (xodimlar.length === 0) {
            return res.status(401).json({ success: false, message: 'Login yoki parol noto\'g\'ri' });
        }

        const xodim = xodimlar[0];

        // Parolni tekshirish
        const parolTogri = await bcrypt.compare(parol, xodim.parol_hash);
        if (!parolTogri) {
            return res.status(401).json({ success: false, message: 'Login yoki parol noto\'g\'ri' });
        }

        // JWT token yaratish
        const token = jwt.sign(
            { id: xodim.id, login: xodim.login, lavozim: xodim.lavozim },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            xodim: {
                id: xodim.id,
                ism: xodim.ism,
                familiya: xodim.familiya,
                lavozim: xodim.lavozim
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xodim foizlarini hisoblash
router.get('/:id/foizlar', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Xodim ma'lumotlarini olish
        const [xodimlar] = await db.execute(
            'SELECT * FROM xodimlar WHERE id = ?',
            [req.params.id]
        );

        if (xodimlar.length === 0) {
            return res.status(404).json({ success: false, message: 'Xodim topilmadi' });
        }

        const xodim = xodimlar[0];

        // Xodim shifokor bo'lsa, uning xizmatlaridan foiz hisoblash
        if (xodim.lavozim === 'shifokor') {
            const [tolovlar] = await db.execute(`
                SELECT SUM(x.shifokor_foizi * t.summa / 100) as umumiy_foiz
                FROM tolovlar t
                JOIN xizmatlar x ON t.xizmat_id = x.id
                JOIN kasallik_tarixi k ON k.bemor_id = t.bemor_id
                WHERE k.shifokor_id = ?
                AND t.sana BETWEEN ? AND ?
            `, [req.params.id, start_date, end_date]);

            res.json({
                success: true,
                foiz: tolovlar[0].umumiy_foiz || 0,
                davr: { start_date, end_date }
            });
        } else {
            res.json({
                success: true,
                foiz: 0,
                message: 'Bu xodim uchun foiz hisoblanmaydi'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lavozim bo'yicha xodimlar
router.get('/lavozim/:lavozim', async (req, res) => {
    try {
        const [xodimlar] = await db.execute(
            'SELECT id, ism, familiya, telefon FROM xodimlar WHERE lavozim = ? AND aktiv = TRUE',
            [req.params.lavozim]
        );

        res.json({ success: true, data: xodimlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Shifokorlar ro'yxati (website uchun)
router.get('/shifokorlar/royxat', async (req, res) => {
    try {
        const [shifokorlar] = await db.execute(`
            SELECT id, ism, familiya, telefon
            FROM xodimlar 
            WHERE lavozim = 'shifokor' AND aktiv = TRUE
            ORDER BY ism
        `);

        res.json({ success: true, data: shifokorlar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
