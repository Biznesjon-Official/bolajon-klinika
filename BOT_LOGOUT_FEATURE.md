# Bot Akkauntdan Chiqish Funksiyasi

## Qilingan o'zgarishlar:

### 1. "Chiqish" tugmasi qo'shildi
- Bemor menyusiga "🚪 Chiqish" tugmasi qo'shildi
- Xodim menyusiga ham "🚪 Chiqish" tugmasi qo'shildi

### 2. Akkauntdan chiqish funksiyasi
- Tugma bosilganda sessiya o'chiriladi
- Foydalanuvchiga xayr xabari yuboriladi
- Klaviatura o'chiriladi
- Qayta kirish uchun kod kiritish kerak

### 3. Xabar formati
```
👋 Xayr, [Ism Familiya]!

✅ Siz akkauntdan chiqdingiz.

🔐 Qayta kirish uchun kodingizni kiriting yoki /start buyrug'ini yuboring.
```

## Foydalanish:

### Bemor uchun:
1. Botda "🚪 Chiqish" tugmasini bosing
2. Akkauntdan chiqasiz
3. Qayta kirish uchun 8-xonali kodni kiriting

### Xodim uchun:
1. Botda "🚪 Chiqish" tugmasini bosing
2. Akkauntdan chiqasiz
3. Qayta kirish uchun LI + 8-xonali kodni kiriting

## Xususiyatlar:
- ✅ Sessiya to'liq o'chiriladi
- ✅ Klaviatura o'chiriladi
- ✅ Xayr xabari yuboriladi
- ✅ Qayta kirish uchun kod kiritish kerak
- ✅ Bemor va xodim uchun ishlaydi
- ✅ Console'da log saqlanadi

## Menyu tuzilishi:

### Bemor menyusi:
```
📊 Navbat          💊 Retseptlar
🔬 Tahlillar       💰 Qarzlar
📨 Xabarlar        🔔 Hamshirani chaqirish
⚙️ Sozlamalar      🚪 Chiqish
```

### Xodim menyusi:
```
📨 Xabarlar
🚪 Chiqish
```

## Texnik detalllar:
- Sessiya `userSessions` Map'dan o'chiriladi
- Chat ID kalit sifatida ishlatiladi
- Logout console'da loglanadi
- Xatoliklar handle qilinadi
