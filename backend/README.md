# Clinic Management System - Backend (MongoDB)

## 🎯 Texnologiyalar

- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT

## 📁 Tuzilma

```
backend/
├── src/
│   ├── config/          # Konfiguratsiya fayllari
│   │   ├── mongodb.js   # MongoDB ulanish
│   │   └── redis.js     # Redis cache (optional)
│   ├── models/          # Mongoose modellari
│   │   ├── Patient.js
│   │   ├── Staff.js
│   │   ├── Queue.js
│   │   ├── Invoice.js
│   │   ├── Service.js
│   │   └── ...
│   ├── routes/          # API route'lar
│   │   ├── auth.routes.js
│   │   ├── patient.routes.js
│   │   ├── queue.routes.js
│   │   ├── billing.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── ambulator.routes.js
│   │   └── ambulator-inpatient.routes.js
│   ├── middleware/      # Middleware'lar
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── services/        # Business logic
│   │   └── telegram.service.js
│   ├── utils/           # Yordamchi funksiyalar
│   └── server.js        # Asosiy server fayli
└── .env                 # Environment variables
```

## 🚀 O'rnatish

1. Dependencies o'rnatish:
```bash
npm install
```

2. `.env` faylini sozlash:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinic_db
PORT=5000
JWT_SECRET=your-secret-key
```

3. Serverni ishga tushirish:
```bash
npm start
```

## 📊 MongoDB Collections

- **patients** - Bemorlar
- **staff** - Xodimlar
- **queues** - Navbatlar
- **billing** - Hisob-fakturalar
- **billing_items** - Faktura elementlari
- **transactions** - To'lovlar
- **services** - Xizmatlar
- **servicecategories** - Xizmat kategoriyalari
- **ambulatorrooms** - Ambulatoriya xonalari
- **admissions** - Yotqizishlar

## 🔐 Default Login

- **Username:** admin
- **Password:** admin123

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token

### Patients
- `GET /api/v1/patients` - Barcha bemorlar
- `GET /api/v1/patients/:id` - Bemor ma'lumotlari
- `POST /api/v1/patients` - Yangi bemor
- `PUT /api/v1/patients/:id` - Bemorni yangilash
- `DELETE /api/v1/patients/:id` - Bemorni o'chirish

### Queue
- `GET /api/v1/queue` - Navbatlar ro'yxati
- `POST /api/v1/queue` - Navbatga qo'shish
- `PUT /api/v1/queue/:id/call` - Navbatni chaqirish
- `PUT /api/v1/queue/:id/complete` - Navbatni yakunlash

### Billing
- `GET /api/v1/billing/stats` - Statistika
- `GET /api/v1/billing/services` - Xizmatlar
- `POST /api/v1/billing/invoices` - Faktura yaratish
- `GET /api/v1/billing/invoices` - Fakturalar ro'yxati
- `POST /api/v1/billing/invoices/:id/payment` - To'lov qo'shish

### Dashboard
- `GET /api/v1/dashboard/stats` - Dashboard statistikasi
- `GET /api/v1/dashboard/alerts` - Ogohlantirishlar

## 🛠️ Development

```bash
npm run dev  # Development mode with nodemon
```

## 📚 API Documentation

Server ishga tushgandan keyin:
http://localhost:5000/api-docs
