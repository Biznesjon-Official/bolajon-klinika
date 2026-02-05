# Koyka To'lovlarini Hisoblash Qoidalari

## Kunlarni Hisoblash Formulasi

```javascript
if (hoursDiff < 12) {
  totalDays = 0;
} else if (hoursDiff <= 24) {
  totalDays = 1;
} else {
  totalDays = 1 + Math.ceil((hoursDiff - 24) / 24);
}
```

## Misollar

| Yotgan vaqt | Soatlar | Kunlar | Tushuntirish |
|-------------|---------|--------|--------------|
| 10 soat | 10 | 0 kun | 12 soatdan kam |
| 12 soat | 12 | 1 kun | 12-24 soat oralig'i |
| 18 soat | 18 | 1 kun | 12-24 soat oralig'i |
| 24 soat | 24 | 1 kun | 12-24 soat oralig'i |
| 25 soat | 25 | 2 kun | 24 soatdan oshdi |
| 30 soat | 30 | 2 kun | 24-48 soat oralig'i |
| 48 soat | 48 | 2 kun | 24-48 soat oralig'i |
| 49 soat | 49 | 3 kun | 48 soatdan oshdi |
| 72 soat | 72 | 3 kun | 48-72 soat oralig'i |
| 73 soat | 73 | 4 kun | 72 soatdan oshdi |

## To'lovni Hisoblash

```
Jami to'lov = Kunlar soni × Koyka sutkalik narxi
```

### Misol 1: 30 soat yotgan bemor

- **Yotgan vaqt**: 30 soat
- **Kunlar**: 2 kun
- **Koyka narxi**: 300,000 so'm/kun
- **Jami to'lov**: 2 × 300,000 = **600,000 so'm**

### Misol 2: 10 soat yotgan bemor

- **Yotgan vaqt**: 10 soat
- **Kunlar**: 0 kun
- **Koyka narxi**: 300,000 so'm/kun
- **Jami to'lov**: 0 × 300,000 = **0 so'm** (to'lovsiz)

### Misol 3: 73 soat yotgan bemor

- **Yotgan vaqt**: 73 soat (3 kun 1 soat)
- **Kunlar**: 4 kun
- **Koyka narxi**: 250,000 so'm/kun
- **Jami to'lov**: 4 × 250,000 = **1,000,000 so'm**

## Jarayon

### 1. Bemorni Yotqizish (Admission)

```http
POST /api/v1/ambulator-inpatient/admissions
{
  "patient_id": "65abc...",
  "room_id": "65def...",
  "bed_number": 3,
  "diagnosis": "Shamollash"
}
```

**Natija**:
- Koyka band qilinadi
- Koyka narxi saqlanadi
- Yotqizilgan vaqt yoziladi

### 2. Bemorni Chiqarish (Discharge)

```http
POST /api/v1/ambulator-inpatient/admissions/:id/discharge
```

**Avtomatik hisoblash**:
1. Yotgan vaqtni hisoblash (soatlarda)
2. Kunlarni hisoblash (qoida bo'yicha)
3. To'lovni hisoblash (kunlar × narx)
4. Invoice yaratish
5. Bemorning qarziga qo'shish
6. Koykani bo'shatish

**Javob**:
```json
{
  "success": true,
  "message": "Bemor muvaffaqiyatli chiqarildi",
  "data": {
    "admission_id": "65abc...",
    "total_days": 2,
    "total_bed_charges": 600000,
    "invoice_id": "65xyz...",
    "hours_stayed": "30.50"
  }
}
```

## Invoice Tafsilotlari

```json
{
  "invoice_number": "INV-202602000123",
  "patient_id": "65abc...",
  "admission_id": "65def...",
  "items": [
    {
      "description": "Koyka to'lovi - Xona 209, Koyka 3",
      "quantity": 2,
      "unit_price": 300000,
      "total": 600000
    }
  ],
  "total_amount": 600000,
  "paid_amount": 0,
  "payment_status": "unpaid"
}
```

## Bemorning Qarzi

Discharge qilingandan keyin:
```javascript
patient.total_debt += totalBedCharges
```

Bemor profil va kassa qismida ko'rinadi.

## Koyka Narxlarini Boshqarish

### Xona Yaratish

```http
POST /api/v1/inpatient/rooms
{
  "room_number": "209",
  "floor_number": 2,
  "bed_count": 4,
  "bed_prices": [200000, 250000, 300000, 350000]
}
```

### Koyka Narxini Yangilash

```http
PUT /api/v1/inpatient/beds/:bedId/price
{
  "daily_price": 350000
}
```

## Muhim Eslatmalar

1. **12 soat qoidasi**: 12 soatdan kam yotsa to'lov yo'q
2. **24 soat chegarasi**: 24 soatdan oshsa 2-kun hisoblanadi
3. **Har 24 soat**: Har qo'shimcha 24 soat uchun 1 kun qo'shiladi
4. **Avtomatik hisoblash**: Discharge qilinganda avtomatik hisoblanadi
5. **Invoice yaratish**: Faqat to'lov bo'lsa invoice yaratiladi
6. **Qarzga qo'shish**: Avtomatik bemorning qarziga qo'shiladi

## Xulosa

Tizim endi to'liq avtomatik ravishda:
- ✅ Koyka narxlarini saqlaydi
- ✅ Yotgan vaqtni hisoblaydi
- ✅ Kunlarni to'g'ri hisoblaydi (24 soat qoidasi)
- ✅ To'lovni hisoblaydi
- ✅ Invoice yaratadi
- ✅ Bemorning qarziga qo'shadi
- ✅ Kassa va qarzlar qismida ko'rsatadi
