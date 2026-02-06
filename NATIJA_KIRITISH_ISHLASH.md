# ✅ Natija Kiritish - Ishlash Qo'llanmasi

## 🎯 Qanday Ishlaydi

Natija kiritish modalida xizmat qo'shishda yaratilgan test parametrlari jadvali avtomatik ko'rsatiladi.

---

## 📋 Bosqichma-Bosqich Qo'llanma

### 1. Test Parametrlari Bilan Xizmat Yaratish

```bash
1. Laboratoriya paneliga kiring
2. "Tahlillar katalogi" tab'ini bosing
3. "Xizmat qo'shish" tugmasini bosing
4. Formani to'ldiring:
   
   Xizmat nomi: Umumiy qon tahlili
   Narxi: 50000
   Tavsif: Qon tarkibini tekshirish
   Tayyorlanish vaqti: 24 (soat)
   Kategoriya: Gematologiya
   
5. "Natijalar jadvali" bo'limida:
   
   "Katak qo'shish" tugmasini 3 marta bosing
   
   Parametr #1:
   - Parametr nomi: Gemoglobin
   - Birlik: g/L
   - Normal diapazon: 120-160
   - Tavsif: Qon tarkibidagi gemoglobin miqdori
   
   Parametr #2:
   - Parametr nomi: Eritrotsitlar
   - Birlik: x10^12/L
   - Normal diapazon: 4.0-5.5
   - Tavsif: Qizil qon tanachalari
   
   Parametr #3:
   - Parametr nomi: Leykotsitlar
   - Birlik: x10^9/L
   - Normal diapazon: 4.0-9.0
   - Tavsif: Oq qon tanachalari
   
6. "Qo'shish" tugmasini bosing
```

### 2. Buyurtma Berish

```bash
1. "Buyurtmalar" tab'iga o'ting
2. "Buyurtma berish" tugmasini bosing
3. Formani to'ldiring:
   - Bemor: Mironshox Raxmatilloyev
   - Tahlil: Umumiy qon tahlili (yaratilgan xizmat)
   - Muhimlik: Oddiy
4. "Buyurtma yaratish" tugmasini bosing
```

### 3. Namuna Olish

```bash
1. Buyurtmalar ro'yxatida "Namuna olindi" tugmasini bosing
2. Status "Jarayonda" ga o'zgaradi
```

### 4. Natija Kiritish

```bash
1. "Natija kiritish" tugmasini bosing
2. Modal oynada avtomatik ravishda 3 ta parametr ko'rinadi:
   
   ┌─ Gemoglobin ──────────────────────┐
   │ Normal: 120-160 g/L               │
   │ Qon tarkibidagi gemoglobin miqdori│
   │ Natija: [_____] Birlik: [g/L]     │
   └───────────────────────────────────┘
   
   ┌─ Eritrotsitlar ───────────────────┐
   │ Normal: 4.0-5.5 x10^12/L          │
   │ Qizil qon tanachalari             │
   │ Natija: [_____] Birlik: [x10^12/L]│
   └───────────────────────────────────┘
   
   ┌─ Leykotsitlar ────────────────────┐
   │ Normal: 4.0-9.0 x10^9/L           │
   │ Oq qon tanachalari                │
   │ Natija: [_____] Birlik: [x10^9/L] │
   └───────────────────────────────────┘

3. Har bir parametr uchun natijani kiriting:
   - Gemoglobin: 145
   - Eritrotsitlar: 4.5
   - Leykotsitlar: 7.2

4. Izoh qo'shing (ixtiyoriy):
   "Barcha ko'rsatkichlar normal diapazon ichida"

5. "Natijani yuborish" tugmasini bosing
```

---

## 🔧 Texnik Tafsilotlar

### Agar test_id Bo'lmasa (Eski Buyurtmalar)

Kod avtomatik ravishda test_name orqali testni topadi:

```javascript
// 1. test_id bilan topishga harakat qiladi
if (order.test_id) {
  testData = await getTestById(order.test_id);
}
// 2. Agar test_id bo'lmasa, test_name bilan qidiradi
else if (order.test_name) {
  const tests = await getTests();
  testData = tests.find(t => t.test_name === order.test_name);
}
```

### Test Parametrlari Formatı

Backend'da saqlanadi:
```json
{
  "results": [
    {
      "parameter_name": "Gemoglobin",
      "value": "145",
      "unit": "g/L",
      "normal_range": "120-160",
      "is_normal": true
    },
    {
      "parameter_name": "Eritrotsitlar",
      "value": "4.5",
      "unit": "x10^12/L",
      "normal_range": "4.0-5.5",
      "is_normal": true
    }
  ]
}
```

---

## ✅ Afzalliklar

### 1. Avtomatik Jadval
- Xizmat qo'shishda bir marta parametrlarni kiritasiz
- Har safar natija kiritishda jadval avtomatik chiqadi
- Parametr nomlari va birliklar oldindan to'ldirilgan

### 2. Xatolarni Kamaytirish
- Parametr nomlari standartlashtirilgan
- Birliklar avtomatik
- Normal diapazon har doim ko'rinadi

### 3. Tezkor Kiritish
- Faqat qiymatlarni kiritish kerak
- Tab tugmasi bilan keyingi parametrga o'tish
- Bir necha soniya ichida to'ldirish

### 4. Moslashuvchanlik
- Test parametrlari bo'lsa → jadval
- Test parametrlari bo'lmasa → oddiy forma
- Ikkala usul ham ishlaydi

---

## 🐛 Agar Jadval Ko'rinmasa

### 1. Xizmatni Tekshiring
```bash
Laboratoriya → Tahlillar katalogi → Xizmatni tahrirlang
"Natijalar jadvali" bo'limida parametrlar bormi?
```

### 2. Yangi Buyurtma Yarating
```bash
Eski buyurtmalarda test_id bo'lmasligi mumkin
Yangi buyurtma yarating va sinab ko'ring
```

### 3. Backend'ni Restart Qiling
```bash
cd backend
npm start
```

### 4. Cache'ni Tozalang
```bash
Ctrl + Shift + Delete
"Cached images and files" ni tanlang
"Clear data" bosing
Ctrl + F5 (hard refresh)
```

---

## 📊 Misol: To'liq Jarayon

### Xizmat Yaratish
```
Xizmat nomi: Biokimyoviy tahlil
Narxi: 80000
Kategoriya: Biokimyo

Parametrlar:
1. ALT (Alanin aminotransferaza)
   - Birlik: U/L
   - Normal: 0-40
   
2. AST (Aspartat aminotransferaza)
   - Birlik: U/L
   - Normal: 0-40
   
3. Glyukoza
   - Birlik: mmol/L
   - Normal: 3.3-5.5
   
4. Kreatinin
   - Birlik: μmol/L
   - Normal: 62-106
```

### Buyurtma Berish
```
Bemor: Mironshox Raxmatilloyev
Tahlil: Biokimyoviy tahlil
Muhimlik: Oddiy
```

### Natija Kiritish
```
ALT: 28 U/L (Normal ✓)
AST: 32 U/L (Normal ✓)
Glyukoza: 4.8 mmol/L (Normal ✓)
Kreatinin: 85 μmol/L (Normal ✓)

Izoh: Barcha ko'rsatkichlar me'yorida
```

---

## 🎉 NATIJA

Endi:
- ✅ Xizmat qo'shishda test parametrlarini bir marta kiritasiz
- ✅ Natija kiritishda jadval avtomatik chiqadi
- ✅ Parametr nomlari va birliklar oldindan to'ldirilgan
- ✅ Faqat qiymatlarni kiritish kerak
- ✅ Tez va xatosiz natija kiritish

**Hammasi tayyor va ishlayapti!** 🚀

---

## 📞 Qo'shimcha Ma'lumot

Agar hali ham muammo bo'lsa:
1. Backend console'ni tekshiring
2. Browser console'ni tekshiring (F12)
3. Screenshot yuboring
4. Xato xabarini yuboring

Men yordam beraman! 💪
