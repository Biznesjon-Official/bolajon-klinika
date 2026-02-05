# 🎨 Muolajalar Modali - Vizual Yo'riqnoma

## 📱 Modal Tuzilishi

```
┌─────────────────────────────────────────────────────────┐
│  👤 [Avatar] Navro'z Ulashov                      [X]   │
│     🛏️ Xona 116, Ko'rpa 1                               │
│                                                          │
│     Bajarilish: 2/5                            40%      │
│     [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🚨 Shoshilinch                                    [1]   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🚨] Cough Syrup                                   │ │
│  │      💊 Doza: 800                                  │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ 🕐 Kuniga 2 marta, 3 kun                     │ │ │
│  │  │ ⏰ 09:00  21:00                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  [▼ Ko'proq]  [⚡ Tez yakunlash]  [✏️ Izoh bilan] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  💊 Oddiy muolajalar                               [2]   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [💊] Paracetamol                                   │ │
│  │      💊 Doza: 500mg                                │ │
│  │  [⚡ Tez yakunlash]  [✏️ Izoh bilan]              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ✅ Bajarilgan                                     [2]   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [✓] Aspirin • Doza: 100mg        ✓ Bajarildi      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Yakunlash Formi (Izoh bilan)

```
┌─────────────────────────────────────────────────────────┐
│  [✓] Muolajani yakunlash                                │
│                                                          │
│  💬 Tez izoh tanlash                                    │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ ✅ Muvaffaqiyatli │  │ 💊 Dori qabul    │            │
│  │    bajarildi     │  │    qilindi       │            │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ ⚠️ Qisman        │  │ 🔄 Takrorlash    │            │
│  │    bajarildi     │  │    kerak         │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  📝 Maxsus izoh (ixtiyoriy)                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Qo'shimcha izoh yozing...                          │ │
│  │                                                    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [← Bekor qilish]        [✓ Tasdiqlash]                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Rang Kodlari

### Shoshilinch (Urgent)
```
Background: linear-gradient(to bottom right, #fef2f2, #fff7ed)
Border: #fecaca (red-200)
Icon: #dc2626 (red-600)
Button: linear-gradient(to right, #ef4444, #f97316)
```

### Oddiy (Regular)
```
Background: linear-gradient(to bottom right, #eff6ff, #ecfeff)
Border: #bfdbfe (blue-200)
Icon: #2563eb (blue-600)
Button: linear-gradient(to right, #3b82f6, #06b6d4)
```

### Surunkali (Chronic)
```
Background: linear-gradient(to bottom right, #faf5ff, #fdf2f8)
Border: #e9d5ff (purple-200)
Icon: #9333ea (purple-600)
Button: linear-gradient(to right, #a855f7, #ec4899)
```

### Bajarilgan (Completed)
```
Background: #f0fdf4 (green-50)
Border: #bbf7d0 (green-200)
Icon: #16a34a (green-600)
Opacity: 75%
```

## 📐 O'lchamlar

### Modal
- Width: `max-w-3xl` (768px)
- Height: `max-h-[90vh]`
- Padding: `24px`
- Border radius: `24px`

### Tugmalar
- Height: `48px` (touch-friendly)
- Padding: `16px 24px`
- Border radius: `12px`
- Font size: `14px`
- Font weight: `600`

### Ikonlar
- Size: `48px` (katta kartalar)
- Size: `32px` (kichik kartalar)
- Size: `24px` (tugmalar ichida)

### Kartalar
- Padding: `16px`
- Border radius: `16px`
- Border width: `2px`
- Gap: `12px`

## 🎬 Animatsiyalar

### Modal Ochilish
```css
Duration: 400ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
Transform: translateY(30px) → translateY(0)
Scale: 0.95 → 1
Opacity: 0 → 1
```

### Tugma Hover
```css
Duration: 200ms
Easing: ease-out
Transform: scale(1) → scale(1.02)
Shadow: md → lg
```

### Progress Bar
```css
Duration: 500ms
Easing: ease-out
Width: 0% → X%
```

### Fade In
```css
Duration: 300ms
Easing: ease-out
Opacity: 0 → 1
```

## 🔤 Tipografiya

### Sarlavhalar
- H1 (Modal title): `24px`, `700`, `Inter`
- H2 (Section title): `14px`, `700`, `Inter`
- H3 (Card title): `18px`, `700`, `Inter`

### Matn
- Body: `14px`, `400`, `Inter`
- Small: `12px`, `400`, `Inter`
- Button: `14px`, `600`, `Inter`

### Ranglar
- Primary text: `#111827` (gray-900)
- Secondary text: `#6b7280` (gray-500)
- Tertiary text: `#9ca3af` (gray-400)

## 📱 Responsive

### Mobile (< 640px)
- Modal width: `95vw`
- Padding: `16px`
- Font size: `-2px`
- Button height: `44px`
- Grid: `1 column`

### Tablet (640px - 768px)
- Modal width: `90vw`
- Padding: `20px`
- Font size: `-1px`
- Button height: `46px`
- Grid: `2 columns`

### Desktop (> 768px)
- Modal width: `768px`
- Padding: `24px`
- Font size: `normal`
- Button height: `48px`
- Grid: `2 columns`

## 🎯 Interaktiv Elementlar

### Hover States
- Tugmalar: `scale(1.02)` + `shadow-lg`
- Kartalar: `shadow-lg`
- Ikonlar: `opacity(0.8)`

### Active States
- Tugmalar: `scale(0.98)`
- Kartalar: `scale(0.99)`

### Focus States
- Outline: `2px solid #10b981`
- Offset: `2px`

### Disabled States
- Opacity: `0.5`
- Cursor: `not-allowed`
- Pointer events: `none`

## 🎨 Dark Mode

### Background
- Modal: `#1f2937` (gray-800)
- Card: `#374151` (gray-700)
- Input: `#111827` (gray-900)

### Text
- Primary: `#f9fafb` (gray-50)
- Secondary: `#d1d5db` (gray-300)
- Tertiary: `#9ca3af` (gray-400)

### Borders
- Primary: `#4b5563` (gray-600)
- Secondary: `#6b7280` (gray-500)

## 📊 Spacing System

```
4px   - xs   - gap-1
8px   - sm   - gap-2
12px  - md   - gap-3
16px  - lg   - gap-4
24px  - xl   - gap-6
32px  - 2xl  - gap-8
48px  - 3xl  - gap-12
```

## 🎭 Icon Library

Material Symbols Outlined:
- `emergency` - Shoshilinch
- `medication` - Oddiy
- `calendar_month` - Surunkali
- `check_circle` - Bajarilgan
- `schedule` - Vaqt
- `alarm` - Soat
- `info` - Ma'lumot
- `bolt` - Tez
- `edit_note` - Izoh
- `close` - Yopish
- `bed` - Koyka

---

**Dizayn tizimi**: Tailwind CSS v3
**Icon kutubxonasi**: Material Symbols
**Font**: Inter
**Animatsiya**: CSS Transitions + Keyframes
