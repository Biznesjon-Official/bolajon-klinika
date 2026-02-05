# Treatment Timer Feature (Muolaja Vaqti Timeri)

## Xususiyat
Stasionardagi koykalar kartasining o'ng tepa burchagida, oddiy (REGULAR) retseptda yozilgan dori qabul qilish vaqtiga 30 daqiqa qolganidan boshlab timer ko'rinadi va vaqt yaqinlashganda rang o'zgaradi.

## Qanday Ishlaydi

### Timer Ko'rinish Sharti
Timer faqat quyidagi shartlar bajarilganda ko'rinadi:
1. ✅ Koykada bemor bor
2. ✅ Bemor hamshiraga biriktirilgan (`hasMyTreatments: true`)
3. ✅ Bemorga pending muolajalar mavjud
4. ✅ Muolajada `schedule_times` mavjud (masalan: ["09:00", "21:00"])
5. ✅ Keyingi muolaja vaqtiga 30 daqiqa yoki undan kam qolgan

### Rang O'zgarishi (Urgency Levels)

#### 1. Normal (Ko'k) - 30-15 daqiqa qolgan
- **Rang**: Ko'k (`bg-blue-500`)
- **Holat**: Oddiy, hali vaqt bor
- **Animatsiya**: Yo'q

#### 2. Warning (To'q sariq/Orange) - 15-5 daqiqa qolgan
- **Rang**: Orange (`bg-orange-500`)
- **Holat**: Ogohlantirish, tez orada vaqt bo'ladi
- **Animatsiya**: `animate-pulse` (pulsatsiya)

#### 3. Critical (Qizil) - 5 daqiqa yoki undan kam
- **Rang**: Qizil (`bg-red-500`)
- **Holat**: Kritik, darhol berish kerak
- **Animatsiya**: `animate-pulse` + icon `animate-bounce`

### Timer Formati
```
⏰ 14:32
   Paracetamol
```

- **Yuqori qator**: Qolgan vaqt (daqiqa:soniya)
- **Pastki qator**: Dori nomi

### Avtomatik Yangilanish
- Timer har **1 soniyada** yangilanadi
- Muolajalar ro'yxati har **30 soniyada** yangilanadi
- Vaqt o'tganda avtomatik keyingi muolajaga o'tadi

## Texnik Tafsilotlar

### Komponentlar

#### 1. TreatmentTimer.jsx
Asosiy timer komponenti:
- Muolajalar ro'yxatini qabul qiladi
- Keyingi muolajani topadi (30 daqiqa ichida)
- Har soniya yangilanadi
- Urgency level'ni hisoblaydi
- Rang va animatsiyalarni boshqaradi

#### 2. BedTreatmentWrapper.jsx
Timer'ni ko'rsatish uchun:
- Muolajalarni background'da yuklaydi (har 30 soniyada)
- TreatmentTimer'ga muolajalarni uzatadi
- Timer'ni koyka kartasining o'ng tepa burchagida ko'rsatadi

### Props

**TreatmentTimer**
```javascript
<TreatmentTimer 
  treatments={[
    {
      status: 'pending',
      medication_name: 'Paracetamol',
      schedule_times: ['09:00', '14:00', '21:00'],
      // ... other fields
    }
  ]} 
/>
```

### Algoritm

1. **Muolajalarni filter qilish**:
   - Faqat `status: 'pending'`
   - Faqat `schedule_times` mavjud bo'lganlar

2. **Keyingi vaqtni topish**:
   - Har bir muolajaning har bir `schedule_time`'ini tekshirish
   - Hozirgi vaqtdan keyingi eng yaqin vaqtni topish
   - Agar bugun o'tib ketgan bo'lsa, ertangi kunni tekshirish

3. **30 daqiqa oralig'ini tekshirish**:
   - Faqat 0-30 daqiqa oralig'idagi muolajalarni ko'rsatish
   - Agar 30 daqiqadan ko'p bo'lsa, timer ko'rinmaydi

4. **Urgency level'ni aniqlash**:
   - `<= 5 min`: Critical (qizil)
   - `<= 15 min`: Warning (orange)
   - `> 15 min`: Normal (ko'k)

## Foydalanish

### Hamshira uchun
1. Stasionar sahifasiga kiring
2. Sizga biriktirilgan bemorlar ko'k rangda ko'rinadi
3. Agar muolaja vaqti yaqinlashsa, koyka o'ng tepa burchagida timer paydo bo'ladi
4. Timer rangi:
   - **Ko'k**: Hali vaqt bor (15+ daqiqa)
   - **Orange**: Tez orada (5-15 daqiqa)
   - **Qizil**: Darhol berish kerak (0-5 daqiqa)
5. Koykaga bosing va muolajani bajaring

### Misol Stsenariy

**09:00** - Bemor Paracetamol qabul qilishi kerak

- **08:45** (15 min qolgan): Timer ko'rinadi, ko'k rang
- **08:50** (10 min qolgan): Timer orange rangga o'zgaradi, pulsatsiya boshlanadi
- **08:55** (5 min qolgan): Timer qizil rangga o'zgaradi, icon sakraydi
- **09:00** (vaqt bo'ldi): Timer qizil, kritik holat
- **09:05** (5 min o'tdi): Timer yo'qoladi (30 daqiqa oralig'idan chiqdi)

Keyingi muolaja **14:00** bo'lsa:
- **13:30** da timer yana paydo bo'ladi

## Afzalliklari

1. **Proaktiv ogohlantirish**: Hamshira vaqtni o'tkazib yubormaslik uchun oldindan biladi
2. **Vizual signal**: Rang o'zgarishi urgentlikni ko'rsatadi
3. **Avtomatik**: Hech qanday qo'shimcha harakat kerak emas
4. **Real-time**: Har soniya yangilanadi
5. **Aniq**: Daqiqa va soniya ko'rsatiladi

## Cheklovlar

- Faqat `schedule_times` mavjud bo'lgan muolajalar uchun ishlaydi
- Faqat 30 daqiqa oralig'ida ko'rinadi
- Faqat hamshiraga biriktirilgan bemorlar uchun
- Faqat pending muolajalar uchun

## Test Qilish

1. Shifokor retsept yozsin:
   - Turi: REGULAR (oddiy)
   - Jadval: Kuniga 2 marta
   - Vaqtlar: Hozirgi vaqtdan 20 daqiqa keyin va 12 soat keyin
   - Masalan: Agar hozir 10:00 bo'lsa, vaqtlar: 10:20, 22:20

2. Hamshira stasionarga kirsin

3. 10:00 da timer ko'rinmaydi (30 daqiqadan ko'p)

4. 09:50 da (20 min qolgan) timer paydo bo'ladi, ko'k rang

5. 10:05 da (15 min qolgan) timer orange rangga o'zgaradi

6. 10:15 da (5 min qolgan) timer qizil rangga o'zgaradi

7. 10:20 da muolajani bajaring

8. Timer yo'qoladi

9. 22:00 da (20 min qolgan) timer yana paydo bo'ladi keyingi muolaja uchun

## Kelajakdagi Yaxshilanishlar

- [ ] Ovozli ogohlantirish (5 daqiqa qolganda)
- [ ] Bir nechta muolajalar uchun ro'yxat
- [ ] Muolaja tarixini ko'rsatish
- [ ] Kechikkan muolajalar uchun maxsus ko'rsatkich
- [ ] Push notification (browser notification API)
