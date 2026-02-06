# Xodimga Xabar Yuborish Test

## Bot'da xodim sifatida kirish:
1. Telegram botga o'ting: @klinika_01_bot
2. Xodim kodini kiriting: `LI49936768`
3. Bot sizni xodim sifatida taniydi va "Xabarlar" tugmasini ko'rsatadi

## Xodimga xabar yuborish (API orqali test):

```bash
curl -X POST http://localhost:5001/api/v1/bot/send-message-to-staff \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "6984e15876a1316426be1ac1",
    "subject": "Test xabar",
    "content": "Bu test xabari. Iltimos, javob bering.",
    "senderName": "Admin",
    "senderRole": "Administrator"
  }'
```

## Natija:
- Xabar database'ga saqlanadi
- Agar xodimning telegram_chat_id bo'lsa, avtomatik botga yuboriladi
- Xodim botda "Xabarlar" tugmasini bosib, barcha xabarlarni ko'rishi mumkin

## Xususiyatlar:
1. ✅ Xodim faqat "Xabarlar" tugmasini ko'radi (boshqa tugmalar yo'q)
2. ✅ Xodimga xabar yuborilganda avtomatik botga keladi
3. ✅ Xodim barcha xabarlarni ko'rishi mumkin
4. ✅ Xabarlar database'da saqlanadi

## Keyingi qadamlar:
- Frontend'da xodimga xabar yuborish interfeysi qo'shish
- Xabarlar sahifasiga xodimlar ro'yxatini qo'shish
- Xodimga xabar yuborish formasi yaratish
