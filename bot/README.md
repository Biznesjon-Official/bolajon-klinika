# Klinika Telegram Bot

Klinika boshqaruv tizimi uchun Telegram bot.

## Xususiyatlar

### Bemorlar uchun:
- 📊 Navbat ma'lumotlarini ko'rish
- 💊 Retseptlarni ko'rish
- 🔬 Tahlil natijalarini ko'rish
- 💰 Qarzlarni ko'rish
- ⚙️ Profil sozlamalari
- 🔔 **Avtomatik xabarnomalar**:
  - Navbatga chaqirilganda
  - Yangi retsept yozilganda
  - Tahlil natijasi tayyor bo'lganda

### Deep Linking:
- Saytdan to'g'ridan-to'g'ri botga ulanish
- Avtomatik bemor identifikatsiyasi
- Xabarnomalarni avtomatik yoqish

## O'rnatish

### 1. Bot yaratish

1. Telegram'da [@BotFather](https://t.me/BotFather) ga o'ting
2. `/newbot` komandasi yuboring
3. Bot nomini kiriting (masalan: "Klinika Bot")
4. Bot username'ini kiriting (masalan: "my_clinic_bot")
5. Token'ni saqlang

### 2. Paketlarni o'rnatish

```bash
cd bot
npm install
```

### 3. Database migratsiyasi

```bash
cd ../backend
psql -U postgres -d your_database -f database/add-telegram-integration.sql
```

### 4. Konfiguratsiya

`.env` fayl yarating va quyidagilarni kiriting:

```env
BOT_TOKEN=your_bot_token_here
BOT_USERNAME=your_bot_username
API_URL=http://localhost:5000/api/v1
ADMIN_IDS=your_telegram_id
```

**MUHIM:** `BOT_USERNAME` ni frontend konfiguratsiyasida ham o'zgartiring:
- `frontend/src/layouts/PatientLayout.jsx` faylida `botUsername` o'zgaruvchisini o'zgartiring

### 5. Ishga tushirish

```bash
# Development
npm run dev

# Production
npm start
```

## Foydalanish

### Bemorlar uchun:

**Usul 1: Saytdan ulanish (tavsiya etiladi)**
1. Bemor paneliga kiring
2. "Telegram Bot" tugmasini bosing
3. Bot avtomatik ochiladi va ulanadi

**Usul 2: Qo'lda ulanish**
1. Telegram'da botni toping
2. `/start` komandasi yuboring
3. Telefon raqamingizni yuboring
4. Menyudan kerakli bo'limni tanlang

## Xabarnomalar

Bot quyidagi holatlarda avtomatik xabarnoma yuboradi:

### 1. Navbatga chaqirilganda
```
🔔 Sizni qabulga chaqirishmoqda!

👨‍⚕️ Shifokor: Dr. Aliyev
🚪 Xona: 101

Iltimos, qabulga kiring.
```

### 2. Yangi retsept yozilganda
```
💊 Yangi retsept yozildi!

👨‍⚕️ Shifokor: Dr. Aliyev
📋 Tashxis: Gripp

Batafsil ma'lumot uchun botdan "💊 Retseptlar" bo'limiga o'ting.
```

### 3. Tahlil natijasi tayyor bo'lganda
```
🔬 Tahlil natijasi tayyor!

📋 Tahlil: Qon tahlili

Natijani ko'rish uchun botdan "🔬 Tahlillar" bo'limiga o'ting.
```

## Komandalar

- `/start` - Botni ishga tushirish
- Menyu tugmalari:
  - 📊 Navbat
  - 💊 Retseptlar
  - 🔬 Tahlillar
  - 💰 Qarzlar
  - ⚙️ Sozlamalar

## Texnologiyalar

- Node.js 18+
- node-telegram-bot-api
- Axios
- PostgreSQL (backend orqali)

## Muammolarni hal qilish

### Bot javob bermayapti:
- Bot token to'g'ri ekanligini tekshiring
- Backend server ishlab turganligini tekshiring
- Internet aloqasini tekshiring

### Xabarnomalar kelmayapti:
- Bemor botga ulangan bo'lishi kerak
- Bemor xabarnomalarni yoqgan bo'lishi kerak
- Database'da `telegram_chat_id` saqlanganligini tekshiring

### Deep linking ishlamayapti:
- `BOT_USERNAME` to'g'ri ekanligini tekshiring
- Frontend va bot konfiguratsiyasida bir xil username ishlatilganligini tekshiring
- Bemor ID to'g'ri uzatilayotganligini tekshiring

### Telefon raqam tanilmayapti:
- Telefon raqam to'g'ri formatda ekanligini tekshiring (+998XXXXXXXXX)
- Database'da bemor telefon raqami to'g'ri saqlanganligini tekshiring

## Litsenziya

MIT
