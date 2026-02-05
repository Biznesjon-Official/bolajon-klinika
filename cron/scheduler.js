const cron = require('node-cron');
const db = require('../config/database');
const { qarzdorlikEslatmasi } = require('../bot/index');

// Har kuni soat 9:00 da qarzdorlik eslatmasi
cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Qarzdorlik eslatmasi yuborilmoqda...');
    await qarzdorlikEslatmasi();
});

// Har 12 soatda statsionar to'lovlarni yangilash
cron.schedule('0 */12 * * *', async () => {
    console.log('💰 Statsionar to\'lovlar yangilanmoqda...');

    try {
        const [bemorlar] = await db.execute(`
            SELECT st.*, k.kunlik_narx 
            FROM statsionar_tarixi st
            JOIN koykalar k ON st.koyka_id = k.id
            WHERE st.chiqish_vaqti IS NULL 
            AND TIMESTAMPDIFF(HOUR, st.kirish_vaqti, NOW()) >= 12
        `);

        for (const bemor of bemorlar) {
            const kunlar = Math.ceil((new Date() - new Date(bemor.kirish_vaqti)) / (1000 * 60 * 60 * 24));
            const yangiSumma = kunlar * bemor.kunlik_narx;

            await db.execute(
                'UPDATE statsionar_tarixi SET kunlar_soni = ?, umumiy_summa = ? WHERE id = ?',
                [kunlar, yangiSumma, bemor.id]
            );

            if (!bemor.tolandi) {
                await db.execute(
                    'UPDATE koykalar SET holati = ? WHERE id = ?',
                    ['tolanmagan', bemor.koyka_id]
                );
            }
        }

        console.log(`✅ ${bemorlar.length} ta statsionar to'lov yangilandi`);
    } catch (error) {
        console.error('Statsionar yangilash xatosi:', error);
    }
});

// Har 30 daqiqada muolaja eslatmasi (ixtiyoriy - real SMS/Telegram uchun)
cron.schedule('*/30 * * * *', async () => {
    try {
        const [muolajalar] = await db.execute(`
            SELECT m.*, b.telegram_username, b.telefon
            FROM muolajalar m
            JOIN bemorlar b ON m.bemor_id = b.id
            WHERE m.vaqti BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
            AND m.bajarildi = FALSE
        `);

        if (muolajalar.length > 0) {
            console.log(`⚕️ ${muolajalar.length} ta muolaja eslatmasi yuborilishi kerak`);
            // SMS yoki Telegram orqali eslatma yuborish
        }
    } catch (error) {
        console.error('Muolaja eslatma xatosi:', error);
    }
});

console.log('⏰ Cron scheduler ishga tushdi');

module.exports = cron;
