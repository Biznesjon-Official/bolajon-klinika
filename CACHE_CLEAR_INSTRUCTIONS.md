# 🔄 Cache Tozalash va O'zgarishlarni Ko'rish

## ❗ MUHIM: O'zgarishlar ko'rinmasa

Agar yangi dori tanlash funksiyasi ko'rinmasa, quyidagi usullardan birini bajaring:

### 1-usul: Hard Refresh (Eng oson)
Brauzerda quyidagi tugmalarni bosing:
- **Chrome/Edge**: `Ctrl + Shift + R` yoki `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` yoki `Ctrl + F5`

### 2-usul: Cache Tozalash Sahifasi
1. Brauzerda quyidagi manzilga o'ting:
   ```
   http://localhost:3001/clear-cache.html
   ```
2. Sahifa avtomatik cache'ni tozalaydi va login sahifasiga yo'naltiradi

### 3-usul: Developer Tools orqali
1. Brauzerda `F12` tugmasini bosing
2. "Network" tabiga o'ting
3. "Disable cache" checkboxni belgilang
4. Sahifani yangilang (`F5`)

### 4-usul: Brauzer sozlamalaridan
1. Chrome/Edge: `Ctrl + Shift + Delete`
2. "Cached images and files" ni tanlang
3. "Clear data" tugmasini bosing

## ✅ Server Holati

Frontend server qayta ishga tushirildi:
- **Port**: 3001 (3000 band bo'lgani uchun)
- **URL**: http://localhost:3001
- **Vite cache**: Tozalandi

Backend server:
- **Port**: 5001
- **Status**: Ishlayapti

## 🆕 Yangi Funksiyalar

### Dori Tanlash (MedicineInput komponenti)
Retsept yozishda har bir dori uchun:
1. **Dori qidirish**: Dropdown dan dori tanlash
2. **2-qavat dorixonasi**: Faqat 2-qavatdagi dorilar ko'rsatiladi
3. **Mavjud zaxira**: Har bir dori uchun qancha mavjud ko'rsatiladi
4. **Narx**: Har bir dorining narxi ko'rsatiladi
5. **Miqdor**: +/- tugmalari bilan miqdorni o'zgartirish
6. **Jami narx**: Avtomatik hisoblanadi

### Xususiyatlar:
- ✅ Real-time qidiruv
- ✅ Zaxira tekshiruvi (agar yetarli bo'lmasa ogohlantiradi)
- ✅ Narx ko'rsatish
- ✅ Miqdor boshqaruvi (+/- tugmalar)
- ✅ Jami narx hisoblash

## 🐛 Debug Ma'lumotlari

Agar hali ham muammo bo'lsa, brauzer console'ni tekshiring:
1. `F12` tugmasini bosing
2. "Console" tabiga o'ting
3. Quyidagi log'larni qidiring:
   - `MedicineInput - availableMedicines:` - Dorilar ro'yxati
   - `MedicineInput - floor:` - Qavat raqami (2 bo'lishi kerak)
   - `MedicineInput - floorMedicines:` - Filtrlangan dorilar

Agar `availableMedicines` bo'sh yoki `undefined` bo'lsa:
- Dorixonada dorilar mavjudligini tekshiring
- Backend serverning ishlayotganini tekshiring
- Network tabida `/api/v1/pharmacy/medicines` so'rovini tekshiring

## 📝 Keyingi Qadamlar

Agar o'zgarishlar ko'rinsangiz:
1. Retsept yozish modalini oching
2. "Dori qo'shish" tugmasini bosing
3. Yangi dori input maydonini ko'rishingiz kerak
4. Dori nomini yozib qidirishni sinab ko'ring
5. Dropdown dan dori tanlang
6. Miqdorni +/- tugmalari bilan o'zgartiring

Agar hali ham ko'rinmasa, screenshot yuboring yoki console error'larni ko'rsating.
