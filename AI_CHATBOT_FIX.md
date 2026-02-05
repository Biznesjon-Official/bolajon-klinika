# 🤖 AI Chatbot Deploy Muammosi - Yechim

## ❌ Muammo

AI chatbot localhost'da ishlaydi, lekin deploy qilinganda ishlamaydi:
```
Kechirasiz, AI chatbot xizmati hozircha ishlamayapti. 
Iltimos, keyinroq urinib ko'ring yoki administrator bilan bog'laning.
```

## ✅ Sabab

Frontend kodida API URL hardcoded qilib `http://localhost:5001` ga yozilgan edi. Production'da bu ishlamaydi.

## 🔧 Yechim

### 1. Frontend kodi o'zgartirildi

**Oldingi kod (noto'g'ri):**
```javascript
const response = await fetch('http://localhost:5001/api/v1/ai-chatbot/chat', {
  // ...
});
```

**Yangi kod (to'g'ri):**
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const response = await fetch(`${apiUrl}/ai-chatbot/chat`, {
  // ...
});
```

### 2. Environment Variables sozlash

**Frontend `.env.production`:**
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

**Backend `.env`:**
```env
CORS_ORIGIN=https://yourdomain.com
```

## 📋 Deploy Qilish Qadamlari

### 1. Frontend

```bash
cd frontend

# .env.production faylini tahrirlash
nano .env.production
# VITE_API_URL ni o'zingizning backend URL'ingiz bilan almashtiring

# Build qilish
npm run build

# Deploy qilish (Vercel/Netlify/boshqa)
vercel --prod
# yoki
netlify deploy --prod --dir=dist
```

### 2. Backend

```bash
cd backend

# .env faylini tahrirlash
nano .env
# CORS_ORIGIN ga frontend URL'ingizni qo'shing

# Server restart qilish
pm2 restart clinic-backend
```

### 3. Tekshirish

Browser console'ni oching (F12) va AI chatbot'ga xabar yuboring. Agar xatolik bo'lsa, console'da ko'rinadi.

**To'g'ri ishlasa:**
```
POST https://api.yourdomain.com/api/v1/ai-chatbot/chat 200 OK
```

**Xatolik bo'lsa:**
```
POST https://api.yourdomain.com/api/v1/ai-chatbot/chat net::ERR_CONNECTION_REFUSED
```

## 🆘 Agar Ishlamasa

1. **CORS xatoligi:**
   - Backend `.env` da `CORS_ORIGIN` to'g'ri sozlanganini tekshiring
   - Backend serverni restart qiling: `pm2 restart clinic-backend`

2. **Network xatoligi:**
   - Backend server ishlab turganini tekshiring: `pm2 status`
   - Backend logs'ni ko'ring: `pm2 logs clinic-backend`

3. **404 Not Found:**
   - API URL to'g'ri yozilganini tekshiring
   - `/api/v1` qo'shilganini tekshiring

## 📝 Checklist

- [x] Frontend kodi o'zgartirildi (environment variable ishlatiladi)
- [x] `.env.production` fayli yaratildi
- [x] `.env.example` fayllar yangilandi
- [x] DEPLOYMENT.md qo'llanma yaratildi
- [ ] Frontend rebuild qilish kerak: `npm run build`
- [ ] Backend `.env` da CORS_ORIGIN sozlash kerak
- [ ] Deploy qilish kerak

## 🎉 Natija

Endi AI chatbot ham localhost'da, ham production'da ishlaydi!

---

**Batafsil qo'llanma:** `DEPLOYMENT.md` faylini o'qing
