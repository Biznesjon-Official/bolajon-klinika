# Backend Scripts

Bu papkada utility va test scriptlar joylashgan.

## Kategoriyalar

### Database Management
- `clean-duplicate-services.js` - Dublikat xizmatlarni tozalash
- `create-default-services.js` - Default xizmatlar yaratish
- `create-sample-services.js` - Test xizmatlar yaratish
- `list-collections.js` - MongoDB collectionlarni ko'rish
- `list-all-users.js` - Barcha foydalanuvchilarni ko'rish

### Staff Management
- `create-reception-staff.js` - Qabulxona xodimi yaratish
- `create-reception-user.js` - Qabulxona foydalanuvchisi yaratish
- `create-test-staff-with-schedule.js` - Test xodim va jadval yaratish
- `check-staffs-collection.js` - Xodimlar collectionni tekshirish
- `check-staff-schedules.js` - Xodim jadvallarini tekshirish
- `recreate-reception.js` - Qabulxonani qayta yaratish
- `update-reception-password.js` - Qabulxona parolini yangilash

### Attendance & Penalties
- `check-reception-attendance.js` - Qabulxona davomatini tekshirish
- `check-today-attendance.js` - Bugungi davomatni tekshirish
- `delete-reception-attendance.js` - Qabulxona davomatini o'chirish
- `delete-laborant-attendance.js` - Laborant davomatini o'chirish
- `delete-today-attendance.js` - Bugungi davomatni o'chirish
- `check-penalties.js` - Jarimalarni tekshirish
- `check-my-penalties.js` - Mening jarimalarimni tekshirish
- `create-test-late-penalty.js` - Kechikish jarimasi yaratish
- `create-test-early-leave-penalty.js` - Erta ketish jarimasi yaratish
- `delete-all-penalties.js` - Barcha jarimalarni o'chirish

### Salary Management
- `add-reception-salary.js` - Qabulxona maoshini qo'shish
- `check-laborant-salary.js` - Laborant maoshini tekshirish
- `fix-laborant-salary.js` - Laborant maoshini tuzatish
- `set-admin-salary.js` - Admin maoshini o'rnatish

### Room & Bed Management
- `delete-rooms-101-102.js` - 101 va 102 xonalarni o'chirish
- `fix-bed-status.js` - Koyka statusini tuzatish
- `get-room-ids.js` - Xona ID'larini olish

### Services & Billing
- `check-services.js` - Xizmatlarni tekshirish
- `fix-services-via-api.js` - Xizmatlarni API orqali tuzatish
- `update-service-categories.js` - Xizmat kategoriyalarini yangilash

### Lab & Treatment
- `update-lab-tests.js` - Lab testlarni yangilash
- `delete-jahingir-treatments.js` - Jahingir muolajalarini o'chirish

### Patient Management
- `set-patient-last-visit.js` - Bemorning oxirgi tashrifini o'rnatish
- `check-reception-staff.js` - Qabulxona xodimlarini tekshirish
- `check-current-user-role.js` - Joriy foydalanuvchi rolini tekshirish

### Testing & API
- `test-api-call.js` - API chaqiruvni test qilish
- `test-login-direct.js` - To'g'ridan-to'g'ri loginni test qilish
- `test-lab-order-api.js` - Lab buyurtma API'ni test qilish
- `test-reception-lab-order.js` - Qabulxona lab buyurtmasini test qilish
- `test-reception-role.js` - Qabulxona rolini test qilish
- `test-my-bonuses-endpoint.js` - Bonuslar endpoint'ini test qilish
- `test-penalties-api.js` - Jarimalar API'ni test qilish
- `test-penalty-flow.js` - Jarima oqimini test qilish
- `test-revisit-discount.js` - Qayta tashrif chegirmasini test qilish
- `test-hard-edge-cases.js` - Qiyin edge case'larni test qilish
- `test-hard-stress.js` - Stress testni o'tkazish

## Ishlatish

Scriptlarni ishga tushirish:
```bash
node backend/scripts/script-name.js
```

Yoki backend papkasidan:
```bash
cd backend
node scripts/script-name.js
```
