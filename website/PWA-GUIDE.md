# PWA (Progressive Web App) O'rnatish Qo'llanmasi

## PWA nima?

Progressive Web App (PWA) - bu oddiy veb-sayt kabi ishlaydi, lekin mobil ilova kabi o'rnatilishi va ishlatilishi mumkin bo'lgan zamonaviy veb-ilova texnologiyasi.

## Afzalliklari

✅ **Offline ishlash** - Internet aloqasi bo'lmasa ham asosiy funksiyalar ishlaydi
✅ **Tez yuklash** - Kesh tizimi orqali sahifalar tezroq ochiladi
✅ **Push bildirishnomalar** - Muhim xabarlarni olish
✅ **Kam joy egallaydi** - Oddiy mobil ilovaga nisbatan kamroq xotira
✅ **Avtomatik yangilanish** - Har safar yangi versiya avtomatik yuklanadi
✅ **Xavfsiz** - HTTPS orqali ishlaydi

## O'rnatish

### Android (Chrome)

1. Bolajon Med saytiga kiring
2. O'ng yuqoridagi **Menu** tugmasiga bosing (⋮)
3. **"Add to Home screen"** yoki **"Install app"** ni tanlang
4. **"Install"** tugmasini bosing
5. Ilova uy ekranida paydo bo'ladi

### iPhone/iPad (Safari)

1. Bolajon Med saytiga Safari brauzerida kiring
2. Pastdagi **Share** tugmasiga bosing (⬆️)
3. **"Add to Home Screen"** ni toping va bosing
4. **"Add"** tugmasini bosing
5. Ilova uy ekranida paydo bo'ladi

### Desktop (Chrome, Edge, Brave)

1. Bolajon Med saytiga kiring
2. Address bar'da **Install** icon'ga bosing
3. Yoki Menu → **"Install Bolajon Med"**
4. **"Install"** tugmasini bosing
5. Ilova desktop'da ochiladi

## Xususiyatlar

### 1. Offline Rejim
- Internet aloqasi bo'lmasa ham asosiy sahifalar ochiladi
- Kesh qilingan ma'lumotlar ko'rsatiladi
- Aloqa qayta tiklanganida avtomatik sinxronlanadi

### 2. Tez Yuklash
- Birinchi yuklashdan keyin sahifalar tezroq ochiladi
- Rasmlar va fayllar keshda saqlanadi
- Network First strategiya API so'rovlar uchun

### 3. Avtomatik Yangilanish
- Yangi versiya chiqsa avtomatik yuklanadi
- Foydalanuvchiga bildirishnoma ko'rsatiladi
- Bir marta yangilash tugmasini bosish kifoya

### 4. Push Bildirishnomalar (Kelajakda)
- Navbat kelganda xabar
- Tahlil natijasi tayyor bo'lganda
- Muhim yangiliklar

## Texnik Ma'lumotlar

### Service Worker
- **Versiya**: v2.1
- **Strategiya**: 
  - Static files: Cache First
  - API requests: Network First
  - Images: Cache First
  - HTML pages: Network First

### Cache
- **Static Cache**: HTML, CSS, JS, Images
- **Dynamic Cache**: API responses
- **Image Cache**: Rasmlar va media fayllar

### Manifest
- **Name**: Bolajon Med Klinikasi
- **Short Name**: Bolajon Med
- **Theme Color**: #10b981 (Emerald)
- **Display**: Standalone
- **Orientation**: Portrait

## Muammolarni Hal Qilish

### Ilova o'rnatilmayapti
1. Brauzer versiyasini tekshiring (Chrome 80+, Safari 11.3+)
2. HTTPS orqali kirilganligini tekshiring
3. Manifest.json faylini tekshiring
4. Service Worker ro'yxatdan o'tganligini tekshiring

### Offline rejim ishlamayapti
1. Service Worker faolligini tekshiring (DevTools → Application → Service Workers)
2. Cache'ni tozalang va qayta yuklang
3. Brauzer konsolida xatolarni tekshiring

### Yangilanish ishlamayapti
1. Service Worker'ni unregister qiling
2. Cache'ni tozalang
3. Sahifani qayta yuklang (Ctrl+Shift+R)

## Dasturchilar Uchun

### Service Worker Ro'yxatdan O'tkazish

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('SW registered:', registration);
  });
}
```

### Install Prompt

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button
});

// Trigger install
deferredPrompt.prompt();
const { outcome } = await deferredPrompt.userChoice;
```

### Cache Strategiyalari

**Cache First** - Static fayllar uchun:
```javascript
const cached = await cache.match(request);
return cached || fetch(request);
```

**Network First** - API uchun:
```javascript
try {
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
} catch {
  return cache.match(request);
}