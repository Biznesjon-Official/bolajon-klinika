# Muolaja Jadvali - Foydalanish Qo'llanmasi

## Umumiy ma'lumot

Ushbu yangilanish oddiy retseptlar uchun avtomatik kunlik muolaja jadvalini yaratish va hamshiralarni tayinlash imkoniyatini qo'shadi.

## Asosiy xususiyatlar

### 1. Avtomatik jadval yaratish

Shifokor oddiy retsept yozganda, tizim avtomatik ravishda kunlik muolaja jadvalini yaratadi:

- **Kuniga necha marta**: `frequency_per_day` yoki `schedule_times` asosida
- **Qaysi vaqtlarda**: `schedule_times` massivida aniq vaqtlar (masalan: ["08:00", "14:00", "20:00"])
- **Necha kun davomida**: `duration_days` parametri asosida

### 2. Hamshira tayinlash

Muolaja jadvaliga hamshira avtomatik yoki qo'lda tayinlanadi:

- **Avtomatik**: Retsept yaratilganda bemorga biriktirilgan hamshira
- **Qo'lda**: Alohida muolajaga yoki bir nechta muolajaga birdan

## Backend API

### 1. Retsept yaratish (POST /api/v1/prescriptions)

```json
{
  "patient_id": "bemor_id",
  "diagnosis": "Tashxis",
  "prescription_type": "REGULAR",
  "nurse_id": "hamshira_id",  // ixtiyoriy
  "medications": [
    {
      "medication_name": "Paracetamol",
      "dosage": "500mg",
      "frequency_per_day": 3,  // kuniga 3 marta
      "schedule_times": ["08:00", "14:00", "20:00"],  // aniq vaqtlar
      "duration_days": 5,  // 5 kun davomida
      "instructions": "Ovqatdan keyin"
    }
  ]
}
```

**Natija**: 
- Retsept yaratiladi
- 5 kun uchun har kuni 3 ta muolaja (jami 15 ta) avtomatik jadvalga qo'shiladi
- Agar `schedule_times` berilmasa, `frequency_per_day` asosida standart vaqtlar hisoblanadi

### 2. Bemorning kunlik jadvali (GET /api/v1/treatments/patient/:patientId/schedule)

**Query parametrlar**:
- `date` (ixtiyoriy): YYYY-MM-DD formatida (masalan: 2026-02-04)

**Javob**:
```json
{
  "success": true,
  "data": {
    "date": "2026-02-04T00:00:00.000Z",
    "total_treatments": 3,
    "schedule": [
      {
        "time": "08:00",
        "treatments": [
          {
            "id": "treatment_id",
            "medication_name": "Paracetamol",
            "dosage": "500mg",
            "instructions": "Ovqatdan keyin",
            "status": "pending",
            "nurse": {
              "id": "nurse_id",
              "first_name": "Malika",
              "last_name": "Karimova",
              "phone": "+998901234567"
            },
            "prescription": {
              "id": "prescription_id",
              "prescription_number": "RX202602000001",
              "diagnosis": "Shamollash"
            }
          }
        ]
      },
      {
        "time": "14:00",
        "treatments": [...]
      },
      {
        "time": "20:00",
        "treatments": [...]
      }
    ]
  }
}
```

### 3. Hamshira tayinlash (PUT /api/v1/treatments/:id/assign-nurse)

```json
{
  "nurse_id": "hamshira_id"
}
```

### 4. Bir nechta muolajaga hamshira tayinlash (PUT /api/v1/treatments/bulk-assign-nurse)

```json
{
  "treatment_ids": ["id1", "id2", "id3"],
  "nurse_id": "hamshira_id"
}
```

### 5. Muolajani bajarish (PUT /api/v1/treatments/:id/complete)

```json
{
  "notes": "Muolaja muvaffaqiyatli bajarildi"
}
```

## Frontend

### Bemor profilida yangi tab

Bemor profil sahifasida yangi **"Muolaja jadvali"** tab qo'shildi:

1. **Sana tanlash**: Istalgan kun uchun jadvalni ko'rish
2. **Vaqt bo'yicha guruhlash**: Muolajalar soat bo'yicha guruhlangan
3. **Batafsil ma'lumot**:
   - Dori nomi va dozasi
   - Ko'rsatmalar
   - Hamshira ma'lumotlari (ism, telefon)
   - Status (kutilmoqda, bajarildi, o'tkazildi)
   - Retsept ma'lumotlari

### Foydalanish

1. Bemor profiliga kiring
2. **"Muolaja jadvali"** tabini tanlang
3. Kerakli sanani tanlang
4. Kunlik jadval vaqt bo'yicha ko'rsatiladi

## Misol: To'liq jarayon

### 1. Shifokor retsept yozadi

```javascript
// Frontend: DoctorPanel.jsx
const prescriptionData = {
  patient_id: "65abc123...",
  diagnosis: "Shamollash, yuqori harorat",
  prescription_type: "REGULAR",
  medications: [
    {
      medication_name: "Paracetamol",
      dosage: "500mg",
      frequency_per_day: 3,
      schedule_times: ["08:00", "14:00", "20:00"],
      duration_days: 5,
      instructions: "Ovqatdan keyin qabul qiling"
    },
    {
      medication_name: "Vitamin C",
      dosage: "1000mg",
      frequency_per_day: 2,
      schedule_times: ["09:00", "21:00"],
      duration_days: 7,
      instructions: "Suvda eritib iching"
    }
  ]
};

await prescriptionService.createPrescription(prescriptionData);
```

### 2. Backend avtomatik jadval yaratadi

- Paracetamol: 5 kun × 3 marta = 15 ta jadval
- Vitamin C: 7 kun × 2 marta = 14 ta jadval
- **Jami**: 29 ta muolaja jadvali yaratiladi

### 3. Bemor yoki hamshira jadvalni ko'radi

```javascript
// Frontend: PatientProfile.jsx
const schedule = await treatmentService.getPatientDailySchedule(patientId, "2026-02-04");

// Natija:
// 08:00 - Paracetamol 500mg
// 09:00 - Vitamin C 1000mg
// 14:00 - Paracetamol 500mg
// 20:00 - Paracetamol 500mg
// 21:00 - Vitamin C 1000mg
```

### 4. Hamshira muolajani bajaradi

```javascript
await treatmentService.completeTreatment(treatmentId, "Bemor yaxshi his qilmoqda");
```

## Muhim eslatmalar

1. **REGULAR retseptlar uchun**: Faqat oddiy retseptlar uchun jadval yaratiladi
2. **URGENT retseptlar**: Shoshilinch retseptlar uchun jadval avtomatik yaratilmaydi
3. **Hamshira tayinlash**: Agar retsept yaratilganda hamshira ko'rsatilmasa, bemorga biriktirilgan hamshira avtomatik tayinlanadi
4. **Vaqt formati**: Vaqtlar "HH:MM" formatida (24 soatlik tizim)
5. **Sana formati**: Sanalar "YYYY-MM-DD" formatida

## Kelajakda qo'shilishi mumkin bo'lgan xususiyatlar

- [ ] Muolaja eslatmalari (push notification)
- [ ] Muolaja tarixini eksport qilish
- [ ] Statistika va hisobotlar
- [ ] Muolaja jadvalini tahrirlash
- [ ] Muolajani kechiktirish yoki o'tkazish sabablari
- [ ] Hamshira ish yukini ko'rish
- [ ] Telegram bot orqali eslatmalar

## Texnik tafsilotlar

### Database Models

**TreatmentSchedule**:
- `prescription_id`: Retsept ID
- `patient_id`: Bemor ID
- `admission_id`: Yotqizish ID (ixtiyoriy)
- `nurse_id`: Hamshira ID
- `medication_name`: Dori nomi
- `dosage`: Dozasi
- `scheduled_time`: Aniq vaqt (Date)
- `scheduled_date`: Sana (Date)
- `status`: pending | completed | missed | cancelled
- `completed_at`: Bajarilgan vaqt
- `completed_by`: Bajargan hamshira ID
- `notes`: Izohlar
- `instructions`: Ko'rsatmalar

### API Endpoints

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/v1/treatments` | Barcha muolajalar (filter bilan) |
| GET | `/api/v1/treatments/patient/:id/schedule` | Bemorning kunlik jadvali |
| GET | `/api/v1/treatments/my-today` | Hamshiraning bugungi muolajalar |
| PUT | `/api/v1/treatments/:id/complete` | Muolajani bajarish |
| PUT | `/api/v1/treatments/:id/assign-nurse` | Hamshira tayinlash |
| PUT | `/api/v1/treatments/bulk-assign-nurse` | Ko'p muolajaga hamshira tayinlash |

## Xulosa

Ushbu yangilanish bilan:
- ✅ Oddiy retseptlar uchun avtomatik kunlik jadval yaratiladi
- ✅ Muolajalar soat bo'yicha guruhlangan holda ko'rsatiladi
- ✅ Hamshiralar avtomatik yoki qo'lda tayinlanadi
- ✅ Bemor va hamshira o'z jadvallarini ko'rishlari mumkin
- ✅ Muolajalar statusini kuzatish mumkin

Tizim endi to'liq avtomatlashtirilgan muolaja jadvalini qo'llab-quvvatlaydi!
