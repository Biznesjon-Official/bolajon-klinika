# Laboratoriya Komponentlari

Bu papkada laboratoriya sahifasi uchun ajratilgan komponentlar joylashgan.

## Struktura

```
laboratory/
├── OrdersList.jsx          - Buyurtmalar jadvali (desktop va mobile)
├── TestsCatalog.jsx        - Xizmatlar katalogi (CRUD operatsiyalari)
├── NewOrderModal.jsx       - Yangi buyurtma yaratish modali
├── ResultModal.jsx         - Natija kiritish modali (soddalashtirilgan)
└── README.md              - Bu fayl
```

## Komponentlar

### OrdersList.jsx
Laboratoriya buyurtmalarini ko'rsatadi:
- Desktop uchun jadval ko'rinishi
- Mobile uchun karta ko'rinishi
- Status o'zgartirish
- Natija kiritish
- PDF yuklab olish
- Tasdiqlash (admin uchun)

**Props:**
- `orders` - Buyurtmalar ro'yxati
- `onEnterResult` - Natija kiritish callback
- `onRefresh` - Ma'lumotlarni yangilash callback
- `isAdmin`, `isLaborant`, `isDoctor`, `isReception` - Rol tekshiruvlari
- `getStatusColor`, `getStatusText` - Status uchun yordamchi funksiyalar
- `t` - Tarjima funksiyasi

### TestsCatalog.jsx
Laboratoriya xizmatlarini boshqaradi:
- Xizmatlar ro'yxati
- Yangi xizmat qo'shish
- Xizmatni tahrirlash
- Xizmatni o'chirish
- PDF yuklash (parametrlar uchun)
- Qo'lda parametrlar kiritish

**Props:**
- `tests` - Xizmatlar ro'yxati
- `onRefresh` - Ma'lumotlarni yangilash callback
- `t` - Tarjima funksiyasi

### NewOrderModal.jsx
Yangi laboratoriya buyurtmasi yaratish:
- Bemor tanlash
- Shifokor tanlash (ixtiyoriy)
- Xizmat tanlash
- Muhimlik darajasi (normal, urgent, stat)
- Izoh qo'shish

**Props:**
- `isOpen` - Modal ochiq/yopiq holati
- `onClose` - Modalni yopish callback
- `patients` - Bemorlar ro'yxati
- `doctors` - Shifokorlar ro'yxati
- `tests` - Xizmatlar ro'yxati
- `onSuccess` - Muvaffaqiyatli yaratilgandan keyin callback
- `t` - Tarjima funksiyasi

### ResultModal.jsx
Laboratoriya natijalarini kiritish (soddalashtirilgan versiya):
- Xizmat parametrlarini avtomatik yuklash
- Jadval ko'rinishida natija kiritish
- Faqat xizmat yaratishda qo'shilgan parametrlar
- Oddiy va tushunarli interfeys

**Props:**
- `isOpen` - Modal ochiq/yopiq holati
- `onClose` - Modalni yopish callback
- `order` - Buyurtma ma'lumotlari
- `onSuccess` - Muvaffaqiyatli saqlangandan keyin callback
- `t` - Tarjima funksiyasi

## O'zgarishlar

### Eski versiya
- Barcha komponentlar bitta `Laboratory.jsx` faylida (2500+ qator)
- Kodni o'qish va tushunish qiyin
- Qayta ishlatish imkoni yo'q
- Katta fayl hajmi

### Yangi versiya
- Har bir komponent alohida faylda
- Tushunarli va modulli struktura
- Qayta ishlatish oson
- Kichik va boshqariladigan fayllar
- Soddalashtirilgan ResultModal (faqat PDF parametrlar)

## Foydalanish

```jsx
import OrdersList from '../components/laboratory/OrdersList';
import TestsCatalog from '../components/laboratory/TestsCatalog';
import NewOrderModal from '../components/laboratory/NewOrderModal';
import ResultModal from '../components/laboratory/ResultModal';

// Laboratory.jsx da
<OrdersList 
  orders={orders}
  onEnterResult={handleEnterResult}
  onRefresh={loadData}
  isAdmin={isAdmin}
  isLaborant={isLaborant}
  getStatusColor={getStatusColor}
  getStatusText={getStatusText}
  t={t}
/>
```

## Kelajakda qo'shilishi mumkin

1. Hardcoded jadvallarni (Biokimyo, Qon tahlili, va boshqalar) alohida komponentlarga ajratish
2. Umumiy jadval komponenti yaratish
3. Form validatsiyasini yaxshilash
4. Loading holatlarini yaxshilash
5. Error handling ni yaxshilash
