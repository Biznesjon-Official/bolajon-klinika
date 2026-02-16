# Hamshira Paneli Debug Qo'llanma

## Muammo
Hamshira panelida Dashboard va Muolajalar qismlarida malumotlar ko'rinmayapti.

## Qo'shilgan Debug Loglar

### Frontend (Nurse.jsx)
- `loadData()` funksiyasiga batafsil loglar qo'shildi
- API response'larni to'liq ko'rsatadi
- Xatolarni batafsil chiqaradi

### Frontend (nurseService.js)
- Har bir API chaqiruvida URL va parametrlarni ko'rsatadi
- Response va xatolarni logga yozadi

### Backend (nurse.routes.js)
- `/stats` endpoint'ida:
  - Timestamp va user ma'lumotlari
  - Database query natijalari
  - Response data
  
- `/treatments` endpoint'ida:
  - Timestamp va user ma'lumotlari
  - Query parametrlari
  - Database'dan topilgan Tasks va TreatmentSchedules soni
  - Response data

## Test Qilish

### 1. Backend serverni ishga tushiring
```bash
cd Bolajon_klinik/backend
npm start
```

Backend console'da quyidagilarni kuzating:
- Server qaysi portda ishga tushdi (5001 bo'lishi kerak)
- MongoDB'ga ulanish muvaffaqiyatli bo'ldimi

### 2. Frontend'ni ishga tushiring
```bash
cd Bolajon_klinik/frontend
npm run dev
```

### 3. Hamshira panelini oching
1. Brauzerda http://localhost:5173 ga o'ting
2. Hamshira hisobi bilan login qiling
3. Hamshira Paneli sahifasiga o'ting

### 4. Browser Console'ni oching
- Chrome/Edge: F12 yoki Ctrl+Shift+I
- Console tabini tanlang

### 5. Loglarni tekshiring

#### Frontend Console'da ko'rishingiz kerak:
```
=== NURSE PANEL: LOADING DATA ===
Status Filter: all
📡 nurseService.getStats() called
   URL: /nurse/stats
📡 nurseService.getTreatments() called
   URL: /nurse/treatments
   Params: {status: 'all'}
✅ getStats response: {success: true, data: {...}}
✅ getTreatments response: {success: true, data: [...]}
   Data length: X
=== NURSE TREATMENTS RESPONSE ===
...
```

#### Backend Console'da ko'rishingiz kerak:
```
=== GET NURSE STATS (ALL TREATMENTS) ===
Timestamp: 2026-02-16T...
Nurse ID: ...
User: hamshira-1
📊 Stats: {
  pending_tasks: X,
  pending_schedules: Y,
  total_pending: Z,
  ...
}
✅ Sending response: {...}

=== GET NURSE TREATMENTS (OPTIMIZED) ===
Timestamp: 2026-02-16T...
Nurse ID: ...
User: hamshira-1
Query params: {status: 'all', ...}
MongoDB query: {}
📋 Database results:
   Tasks found: X
   TreatmentSchedules found: Y
   Total: Z
✅ Sending response with Z treatments
```

## Mumkin Bo'lgan Muammolar va Yechimlar

### 1. Database'da malumot yo'q
Agar backend console'da:
```
📋 Database results:
   Tasks found: 0
   TreatmentSchedules found: 0
   Total: 0
```

**Yechim:** Database'ga test malumotlari qo'shish kerak:
1. Bemorni qabul qiling (Admission)
2. Shifokor retsept yozsin (Prescription)
3. Retsept avtomatik Task yoki TreatmentSchedule yaratadi

### 2. API xatosi
Agar frontend console'da:
```
❌ getTreatments error: ...
```

**Tekshiring:**
- Backend server ishlab turibdimi?
- API URL to'g'rimi? (http://localhost:5001/api/v1)
- Token muddati tugaganmi?

### 3. Authentication xatosi (401)
**Yechim:**
- Qaytadan login qiling
- Token yangilanishini kuting

### 4. Network xatosi
**Tekshiring:**
- Backend server 5001 portda ishlab turibdimi?
- Firewall bloklayaptimi?
- CORS sozlamalari to'g'rimi?

## Database'ni To'g'ridan-To'g'ri Tekshirish

MongoDB'da malumotlar bormi tekshirish uchun:

```bash
cd Bolajon_klinik/backend
node scripts/check-nurse-data.js
```

Bu script:
- Tasks collection'dagi malumotlarni ko'rsatadi
- TreatmentSchedules collection'dagi malumotlarni ko'rsatadi
- Agar malumot bo'lmasa, ogohlantiradi

## Xulosa

Debug loglar qo'shildi. Endi:
1. Backend va frontend console'larni kuzating
2. Qaysi qismda muammo borligini aniqlang:
   - Database'da malumot yo'qmi?
   - API xatosimi?
   - Frontend render muammosimi?
3. Yuqoridagi yechimlarni qo'llang

## Keyingi Qadamlar

Agar muammo topilsa:
1. Console loglarni screenshot qiling
2. Backend va frontend loglarini nusxa oling
3. Muammoni aniq tasvirlab bering
