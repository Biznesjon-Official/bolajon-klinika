const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Barcha koykalar ro'yxati (grafik xarita uchun)
router.get('/koykalar', async (req, res) => {
    try {
        const [koykalar] = await db.execute(`
            SELECT k.*, 
                   CASE WHEN st.id IS NOT NULL THEN b.ism ELSE NULL END as bemor_ismi,
                   CASE WHEN st.id IS NOT NULL THEN b.familiya ELSE NULL END as bemor_familiya,
                   st.kirish_vaqti,
                   st.kunlar_soni
            FROM koykalar k
            LEFT JOIN statsionar_tarixi st ON k.id = st.koyka_id AND st.chiqish_vaqti IS NULL
            LEFT JOIN bemorlar b ON st.bemor_id = b.id
            ORDER BY k.qavat, k.palata_raqami, k.koyka_raqami
        `);

        res.json({ success: true, data: koykalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Qavat bo'yicha koykalar
router.get('/koykalar/:qavat', async (req, res) => {
    try {
        const [koykalar] = await db.execute(`
            SELECT k.*, 
                   CASE WHEN st.id IS NOT NULL THEN b.ism ELSE NULL END as bemor_ismi,
                   CASE WHEN st.id IS NOT NULL THEN b.familiya ELSE NULL END as bemor_familiya
            FROM koykalar k
            LEFT JOIN statsionar_tarixi st ON k.id = st.koyka_id AND st.chiqish_vaqti IS NULL
            LEFT JOIN bemorlar b ON st.bemor_id = b.id
            WHERE k.qavat = ?
            ORDER BY k.palata_raqami, k.koyka_raqami
        `, [req.params.qavat]);

        res.json({ success: true, data: koykalar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemorni koykaga yotqizish
router.post('/yotqizish', async (req, res) => {
    try {
        const { bemor_id, koyka_id } = req.body;

        // Koyka bo'shligini tekshirish
        const [koyka] = await db.execute(
            'SELECT holati FROM koykalar WHERE id = ?',
            [koyka_id]
        );

        if (koyka.length === 0) {
            return res.status(404).json({ success: false, message: 'Koyka topilmadi' });
        }

        if (koyka[0].holati !== 'bosh') {
            return res.status(400).json({ success: false, message: 'Koyka band' });
        }

        // Bemorni yotqizish
        await db.execute(
            'INSERT INTO statsionar_tarixi (bemor_id, koyka_id, kirish_vaqti) VALUES (?, ?, NOW())',
            [bemor_id, koyka_id]
        );

        // Koyka holatini yangilash
        await db.execute(
            'UPDATE koykalar SET holati = ? WHERE id = ?',
            ['band', koyka_id]
        );

        res.status(201).json({
            success: true,
            message: 'Bemor muvaffaqiyatli yotqizildi'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bemorni koykadan chiqarish
router.put('/chiqarish/:id', async (req, res) => {
    try {
        const statsionarId = req.params.id;

        // Statsionar ma'lumotlarini olish
        const [statsionar] = await db.execute(
            'SELECT * FROM statsionar_tarixi WHERE id = ?',
            [statsionarId]
        );

        if (statsionar.length === 0) {
            return res.status(404).json({ success: false, message: 'Yozuv topilmadi' });
        }

        const { bemor_id, koyka_id, kirish_vaqti } = statsionar[0];

        // Kunlar sonini hisoblash
        const kirish = new Date(kirish_vaqti);
        const chiqish = new Date();
        const farq = chiqish - kirish;
        const kunlarSoni = Math.ceil(farq / (1000 * 60 * 60 * 24));

        // Kunlik narxni olish
        const [koyka] = await db.execute(
            'SELECT kunlik_narx FROM koykalar WHERE id = ?',
            [koyka_id]
        );

        const umumiySumma = kunlarSoni * koyka[0].kunlik_narx;

        // Chiqish vaqtini va summani yangilash
        await db.execute(
            'UPDATE statsionar_tarixi SET chiqish_vaqti = NOW(), kunlar_soni = ?, umumiy_summa = ? WHERE id = ?',
            [kunlarSoni, umumiySumma, statsionarId]
        );

        // Koyka holatini bo'sh qilish
        await db.execute(
            'UPDATE koykalar SET holati = ? WHERE id = ?',
            ['bosh', koyka_id]
        );

        res.json({
            success: true,
            message: 'Bemor chiqarildi',
            kunlar: kunlarSoni,
            summa: umumiySumma
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 12 soatdan oshgan koykalarni yangilash (cron job uchun)
router.post('/yangilash-tolovlar', async (req, res) => {
    try {
        // 12 soatdan oshgan statsionar bemorlar
        const [bemorlar] = await db.execute(`
            SELECT st.*, k.kunlik_narx 
            FROM statsionar_tarixi st
            JOIN koykalar k ON st.koyka_id = k.id
            WHERE st.chiqish_vaqti IS NULL 
            AND TIMESTAMPDIFF(HOUR, st.kirish_vaqti, NOW()) >= 12
        `);

        let yangilandi = 0;
        for (const bemor of bemorlar) {
            const kunlar = Math.ceil((new Date() - new Date(bemor.kirish_vaqti)) / (1000 * 60 * 60 * 24));
            const yangiSumma = kunlar * bemor.kunlik_narx;

            await db.execute(
                'UPDATE statsionar_tarixi SET kunlar_soni = ?, umumiy_summa = ? WHERE id = ?',
                [kunlar, yangiSumma, bemor.id]
            );

            // Agar to'lanmagan bo'lsa, koyka holatini yangilash
            if (!bemor.tolandi) {
                await db.execute(
                    'UPDATE koykalar SET holati = ? WHERE id = ?',
                    ['tolanmagan', bemor.koyka_id]
                );
            }

            yangilandi++;
        }

        res.json({
            success: true,
            message: `${yangilandi} ta koyka to'lovi yangilandi`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dori shkafi - qavat bo'yicha
router.get('/dori-shkafi/:qavat', async (req, res) => {
    try {
        const [dorilar] = await db.execute(`
            SELECT dori_nomi, SUM(CASE WHEN amal_turi = 'kirim' THEN miqdor ELSE -miqdor END) as qoldiq, olchov_birligi
            FROM dori_shkafi
            WHERE qavat = ?
            GROUP BY dori_nomi, olchov_birligi
            HAVING qoldiq > 0
        `, [req.params.qavat]);

        res.json({ success: true, data: dorilar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dori qo'shish/chiqarish
router.post('/dori-shkafi', async (req, res) => {
    try {
        const { dori_nomi, qavat, miqdor, olchov_birligi, amal_turi, bemor_id, xodim_id, izoh } = req.body;

        await db.execute(
            `INSERT INTO dori_shkafi (dori_nomi, qavat, miqdor, olchov_birligi, amal_turi, bemor_id, xodim_id, izoh)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [dori_nomi, qavat, miqdor, olchov_birligi, amal_turi, bemor_id, xodim_id, izoh]
        );

        res.status(201).json({
            success: true,
            message: `Dori ${amal_turi === 'kirim' ? 'qo\'shildi' : 'chiqarildi'}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dori tarixini ko'rish
router.get('/dori-shkafi/:qavat/tarix', async (req, res) => {
    try {
        const [tarix] = await db.execute(`
            SELECT d.*, b.ism as bemor_ismi, x.ism as xodim_ismi
            FROM dori_shkafi d
            LEFT JOIN bemorlar b ON d.bemor_id = b.id
            LEFT JOIN xodimlar x ON d.xodim_id = x.id
            WHERE d.qavat = ?
            ORDER BY d.sana DESC
            LIMIT 100
        `, [req.params.qavat]);

        res.json({ success: true, data: tarix });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Signal tizimi - yangi signal
router.post('/signal', async (req, res) => {
    try {
        const { bemor_id, koyka_id, xabar } = req.body;

        await db.execute(
            'INSERT INTO signallar (bemor_id, koyka_id, xabar) VALUES (?, ?, ?)',
            [bemor_id, koyka_id, xabar]
        );

        res.status(201).json({
            success: true,
            message: 'Signal yuborildi'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Aktiv signallar
router.get('/signallar', async (req, res) => {
    try {
        const [signallar] = await db.execute(`
            SELECT s.*, b.ism, b.familiya, k.palata_raqami, k.koyka_raqami, k.qavat
            FROM signallar s
            JOIN bemorlar b ON s.bemor_id = b.id
            LEFT JOIN koykalar k ON s.koyka_id = k.id
            WHERE s.holati IN ('yangi', 'korildi')
            ORDER BY s.yaratilgan_vaqt DESC
        `);

        res.json({ success: true, data: signallar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Signal holatini yangilash
router.put('/signal/:id', async (req, res) => {
    try {
        const { holati, xodim_id } = req.body;

        await db.execute(
            'UPDATE signallar SET holati = ?, xodim_id = ?, javob_vaqti = NOW() WHERE id = ?',
            [holati, xodim_id, req.params.id]
        );

        res.json({ success: true, message: 'Signal holati yangilandi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
