# ⚡ Tez Ma'lumotnoma - Muolajalar Modali

## 🎯 Asosiy Xususiyatlar

### 1️⃣ Tez Yakunlash (1 bosish)
```
Koyka → Modal → [⚡ Tez yakunlash] → Dori tanlash → Tayyor!
```
**Vaqt**: ~10 soniya

### 2️⃣ Izoh Bilan Yakunlash (3 bosish)
```
Koyka → Modal → [✏️ Izoh bilan] → Shablon tanlash → [✓ Tasdiqlash] → Dori tanlash → Tayyor!
```
**Vaqt**: ~15 soniya

### 3️⃣ Maxsus Izoh Bilan (4+ bosish)
```
Koyka → Modal → [✏️ Izoh bilan] → Izoh yozish → [✓ Tasdiqlash] → Dori tanlash → Tayyor!
```
**Vaqt**: ~20-30 soniya

## 📊 Muolaja Turlari

| Tur | Rang | Ikon | Prioritet |
|-----|------|------|-----------|
| 🚨 Shoshilinch | Qizil gradient | emergency | 1 (eng yuqori) |
| 💊 Oddiy | Ko'k gradient | medication | 2 |
| 📅 Surunkali | Binafsha gradient | calendar_month | 3 |
| ✅ Bajarilgan | Yashil | check_circle | 4 (pastda) |

## 🎨 Tez Izoh Shablonlari

1. **✅ Muvaffaqiyatli bajarildi**
   - "Muolaja muvaffaqiyatli bajarildi. Bemor yaxshi holatda."

2. **💊 Dori qabul qilindi**
   - "Dori to'liq dozada qabul qilindi. Nojo'ya ta'sir kuzatilmadi."

3. **⚠️ Qisman bajarildi**
   - "Muolaja qisman bajarildi. Bemor to'liq dozani qabul qila olmadi."

4. **🔄 Takrorlash kerak**
   - "Muolaja bajarildi, keyingi seansda takrorlash tavsiya etiladi."

## 🔢 Progress Bar

```
Bajarilish: X/Y                                    Z%
[████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]
```

- **X**: Bajarilgan muolajalar soni
- **Y**: Jami muolajalar soni
- **Z**: Bajarilish foizi (X/Y × 100)

## 🎯 Tugmalar

### Asosiy Tugmalar
| Tugma | Rang | Funksiya |
|-------|------|----------|
| ⚡ Tez yakunlash | Yashil gradient | Tezkor yakunlash |
| ✏️ Izoh bilan | Oq + yashil border | Izoh bilan yakunlash |
| ▼ Ko'proq | Oq + kulrang border | Batafsil ma'lumot |

### Yakunlash Formasidagi Tugmalar
| Tugma | Rang | Funksiya |
|-------|------|----------|
| ← Bekor qilish | Kulrang | Formani yopish |
| ✓ Tasdiqlash | Yashil gradient | Yakunlashni tasdiqlash |

## 📱 Keyboard Shortcuts (Keyinchalik)

| Tugma | Funksiya |
|-------|----------|
| `Esc` | Modalni yopish |
| `Enter` | Tez yakunlash |
| `Tab` | Keyingi element |
| `Shift+Tab` | Oldingi element |
| `1-4` | Tez shablon tanlash |

## 🎨 Rang Kodlari (Hex)

### Shoshilinch
- Background: `#fef2f2` → `#fff7ed`
- Border: `#fecaca`
- Icon: `#dc2626`
- Button: `#ef4444` → `#f97316`

### Oddiy
- Background: `#eff6ff` → `#ecfeff`
- Border: `#bfdbfe`
- Icon: `#2563eb`
- Button: `#3b82f6` → `#06b6d4`

### Surunkali
- Background: `#faf5ff` → `#fdf2f8`
- Border: `#e9d5ff`
- Icon: `#9333ea`
- Button: `#a855f7` → `#ec4899`

### Bajarilgan
- Background: `#f0fdf4`
- Border: `#bbf7d0`
- Icon: `#16a34a`

## 📐 O'lchamlar (px)

| Element | O'lcham |
|---------|---------|
| Modal width | 768 |
| Modal height | 90vh max |
| Modal padding | 24 |
| Modal border-radius | 24 |
| Card padding | 16 |
| Card border-radius | 16 |
| Button height | 48 |
| Button padding | 16 24 |
| Button border-radius | 12 |
| Icon size (katta) | 48 |
| Icon size (o'rta) | 32 |
| Icon size (kichik) | 24 |

## 🎬 Animatsiya Vaqtlari (ms)

| Animatsiya | Vaqt | Easing |
|------------|------|--------|
| Modal ochilish | 400 | cubic-bezier(0.16, 1, 0.3, 1) |
| Fade in | 300 | ease-out |
| Slide up | 400 | cubic-bezier(0.16, 1, 0.3, 1) |
| Button hover | 200 | ease-out |
| Progress bar | 500 | ease-out |

## 🔤 Font O'lchamlari

| Element | O'lcham | Og'irlik |
|---------|---------|----------|
| Modal title | 24px | 700 |
| Section title | 14px | 700 |
| Card title | 18px | 700 |
| Body text | 14px | 400 |
| Small text | 12px | 400 |
| Button text | 14px | 600 |

## 📊 Statistika

### Vaqt Tejash
- Oldingi: ~37.5s/muolaja
- Yangi: ~12.5s/muolaja
- **Tejash: 66.7%**

### Bosish Soni
- Oldingi: 3-4 bosish
- Yangi: 1-2 bosish
- **Tejash: 50-66%**

### Kunlik Tejash (20 muolaja)
- Oldingi: 12.5 daqiqa
- Yangi: 4.2 daqiqa
- **Tejash: 8.3 daqiqa**

## 🎯 Foydalanish Stsenariylari

### Stsenariy 1: Oddiy Muolaja
```
1. Koykaga bos
2. "Tez yakunlash" tugmasini bos
3. "Foydalanmadim" tugmasini bos
4. Tayyor!
```
**Vaqt**: 5-8 soniya

### Stsenariy 2: Dori Bilan Muolaja
```
1. Koykaga bos
2. "Tez yakunlash" tugmasini bos
3. Dorilarni tanla
4. Miqdorni kiriting
5. "Tasdiqlash" tugmasini bos
6. Tayyor!
```
**Vaqt**: 15-20 soniya

### Stsenariy 3: Maxsus Izoh Bilan
```
1. Koykaga bos
2. "Izoh bilan" tugmasini bos
3. Tez shablon tanla yoki izoh yoz
4. "Tasdiqlash" tugmasini bos
5. Dorilarni tanla (agar kerak bo'lsa)
6. Tayyor!
```
**Vaqt**: 20-30 soniya

## 🐛 Muammolarni Hal Qilish

### Modal ochilmayapti?
- ✅ Koykada muolajalar borligini tekshiring
- ✅ Hamshiraga biriktirilganligini tekshiring
- ✅ Browser console'ni tekshiring

### Ranglar ko'rinmayapti?
- ✅ Hard refresh qiling: `Ctrl + Shift + R`
- ✅ Cache tozalang
- ✅ Dark mode'ni tekshiring

### Animatsiyalar ishlamayapti?
- ✅ Browser yangiligini tekshiring
- ✅ Hardware acceleration yoqilganligini tekshiring
- ✅ Performance settings'ni tekshiring

### Tugmalar ishlamayapti?
- ✅ JavaScript yoqilganligini tekshiring
- ✅ Console error'larni tekshiring
- ✅ Network connection'ni tekshiring

## 📞 Yordam

Agar muammo bo'lsa:
1. Browser console'ni oching (`F12`)
2. Error'larni screenshot qiling
3. Qaysi tugma ishlamayotganini ayting
4. Qaysi brauzer ishlatayotganingizni ayting

---

**Versiya**: 2.0
**Sana**: 2026-02-05
**Status**: ✅ Tayyor
