# Hamshira Chaqirish - Vizual Indikator

## Qilingan o'zgarishlar:

### 1. WebSocket Real-time Xabarnoma
- Backend'da bemor hamshirani chaqirganda WebSocket orqali frontend'ga xabar yuboriladi
- Frontend real-time ravishda qo'ng'iroqni qabul qiladi

### 2. Ko'rpada Vizual Indikator
- Bemor chaqirganda o'sha bemorning ko'rpasida qo'ng'iroq ikonasi paydo bo'ladi
- Animatsiya:
  - 🔔 Qo'ng'iroq ikonasi tebranadi (ring-bell animation)
  - 🔴 Qizil pulsatsiya (pulse-glow animation)
  - ⬆️ Sakrash animatsiyasi (bounce-attention)
  - Ko'rpa kartasi qizil rangga o'zgaradi

### 3. CSS Animatsiyalar
```css
- ring-bell: Qo'ng'iroq tebranishi
- pulse-glow: Pulsatsiya effekti
- bounce-attention: Sakrash animatsiyasi
- nurse-call-active: Ko'rpa kartasi uchun
- nurse-call-bell: Qo'ng'iroq ikonasi uchun
```

### 4. Toast Xabarnoma
- Ekranning yuqori qismida qizil xabar paydo bo'ladi
- 10 soniya davomida ko'rinadi
- Bemor ismi, xona va ko'rpa raqami ko'rsatiladi

### 5. Avtomatik O'chirish
- 30 soniyadan keyin qo'ng'iroq avtomatik o'chadi
- Hamshira bemorga borgan deb hisoblanadi

## Texnik Detalllar:

### Backend (bot.routes.js):
```javascript
// WebSocket orqali frontend'ga yuborish
if (global.io) {
  global.io.emit('nurse-call', {
    patientId,
    patientName,
    roomNumber,
    bedNumber,
    department,
    timestamp: new Date()
  });
}
```

### Frontend (Inpatient.jsx):
```javascript
// WebSocket ulanishi
const socket = io('http://localhost:5001');

socket.on('nurse-call', (data) => {
  // Qo'ng'iroqni map'ga qo'shish
  setNurseCallsMap(prev => {
    const newMap = new Map(prev);
    newMap.set(data.patientId, data);
    return newMap;
  });
  
  // 30 soniyadan keyin o'chirish
  setTimeout(() => {
    setNurseCallsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(data.patientId);
      return newMap;
    });
  }, 30000);
});
```

### BedTreatmentWrapper:
```jsx
<div className={`relative ${isNurseCalling ? 'nurse-call-active' : ''}`}>
  {isNurseCalling && (
    <div className="absolute -top-2 -right-2 z-10">
      <span className="material-symbols-outlined nurse-call-bell">
        notifications_active
      </span>
    </div>
  )}
  {children}
</div>
```

## Foydalanish:

1. **Bemor botda:**
   - "🔔 Hamshirani chaqirish" tugmasini bosadi

2. **Frontend'da:**
   - O'sha bemorning ko'rpasida qo'ng'iroq ikonasi paydo bo'ladi
   - Ko'rpa kartasi qizil rangga o'zgaradi va animatsiya boshlanadi
   - Toast xabarnoma ko'rinadi

3. **Hamshira:**
   - Vizual indikatorni ko'radi
   - Bemorga boradi
   - 30 soniyadan keyin avtomatik o'chadi

## Xususiyatlar:
- ✅ Real-time WebSocket xabarnoma
- ✅ Diqqat jalb qiluvchi animatsiya
- ✅ Qo'ng'iroq ikonasi
- ✅ Qizil pulsatsiya
- ✅ Toast xabarnoma
- ✅ Avtomatik o'chirish (30 soniya)
- ✅ Bemor ismi, xona va ko'rpa ma'lumotlari
