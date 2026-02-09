# 📱 Bolajon Med Klinikasi - PWA

Professional Progressive Web App (PWA) - Offline ishlash, push notifications, va app kabi tajriba.

---

## ✨ PWA Features

### ✅ Asosiy Xususiyatlar

1. **Offline Ishlash**
   - Service Worker bilan to'liq offline qo'llab-quvvatlash
   - 3 xil caching strategiyasi:
     - Cache First: Static fayllar va rasmlar
     - Network First: HTML sahifalar
     - Stale While Revalidate: CSS va JS

2. **Install Qilish**
   - Desktop va mobile'da o'rnatish mumkin
   - Standalone mode - brauzer UI'siz
   - Home screen'ga qo'shish

3. **Auto Update**
   - Yangi versiya avtomatik tekshiriladi (har 60 soniyada)
   - Update notification ko'rsatiladi
   - Bir click bilan yangilash

4. **Offline Page**
   - Internet yo'q bo'lganda chiroyli offline sahifa
   - Qayta urinish tugmasi

5. **Connection Status**
   - Online/Offline detection
   - Real-time status notification

6. **Push Notifications** (tayyor, lekin hali ishlatilmayapti)
   - Backend integratsiya kerak
   - Navbat eslatmalari uchun

7. **Background Sync** (tayyor, lekin hali ishlatilmayapti)
   - Offline'da yozilgan ma'lumotlarni sync qilish

---

## 🚀 Qanday Ishlatish

### 1. Fayllar

```
website/
├── index.html          # Asosiy sahifa (PWA enabled)
├── admin.html          # Admin panel (PWA enabled)
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker (v2.0)
├── styles.css         # Asosiy CSS
├── script.js          # Asosiy JS
├── admin-styles.css   # Admin CSS
├── admin-script.js    # Admin JS
└── image.jpg          # Logo/Icon
```

### 2. Local Test

```bash
# Simple HTTP server
python -m http.server 8000

# Yoki Node.js
npx serve .

# Yoki PHP
php -S localhost:8000
```

Keyin oching: http://localhost:8000

### 3. Production Deploy

**Nginx:**
```nginx
server {
    listen 80;
    server_name bolajon.biznesjon.uz;
    root /var/www/bolajon/website;
    index index.html;

    # PWA files
    location /manifest.json {
        add_header Cache-Control "public, max-age=604800";
    }

    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache (.htaccess):**
```apache
# PWA Service Worker
<Files "sw.js">
    Header set Cache-Control "no-cache"
    Header set Service-Worker-Allowed "/"
</Files>

# Manifest
<Files "manifest.json">
    Header set Cache-Control "public, max-age=604800"
</Files>

# Static files
<FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

---

## 🔧 Konfiguratsiya

### manifest.json

```json
{
  "name": "Bolajon Med Klinikasi",
  "short_name": "Bolajon Med",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff"
}
```

**Muhim maydonlar:**
- `name`: To'liq nom (install dialogda ko'rinadi)
- `short_name`: Qisqa nom (home screen'da)
- `start_url`: Ilova ochilganda qaysi sahifa
- `display`: standalone (app kabi), fullscreen, minimal-ui, browser
- `theme_color`: Address bar rangi
- `icons`: Turli o'lchamdagi icon'lar (192x192, 512x512)

### Service Worker Versiyalash

`sw.js` faylida:
```javascript
const CACHE_NAME = 'bolajon-med-v2.0';
```

Har safar o'zgarish qilganingizda versiyani oshiring:
```javascript
const CACHE_NAME = 'bolajon-med-v2.1'; // v2.0 → v2.1
```

Bu eski cache'ni o'chiradi va yangi fayllarni cache'laydi.

---

## 📱 Install Qilish

### Chrome (Desktop)

1. Saytni oching
2. Address bar'da "Install" icon'ga bosing (o'ng tomonda)
3. Yoki Menu (⋮) → "Install Bolajon Med..."

### Chrome (Mobile)

1. Saytni oching
2. Menu (⋮) → "Add to Home screen"
3. Yoki "Install app" banner'ga bosing

### Safari (iOS)

1. Saytni oching
2. Share tugmasiga bosing
3. "Add to Home Screen" tanlang

---

## 🧪 Test Qilish

### 1. Lighthouse Test

Chrome DevTools → Lighthouse → PWA

**Kerakli ball:** 90+/100

**Tekshiriladi:**
- ✅ Installable
- ✅ Service Worker
- ✅ HTTPS (yoki localhost)
- ✅ Manifest
- ✅ Icons
- ✅ Offline page

### 2. Manual Test

**Offline Test:**
1. Saytni oching
2. DevTools → Network → Offline
3. Sahifani yangilang
4. Offline page ko'rinishi kerak

**Cache Test:**
1. Saytni oching
2. DevTools → Application → Cache Storage
3. 3 ta cache ko'rinishi kerak:
   - bolajon-static-v2.0
   - bolajon-dynamic-v2.0
   - bolajon-images-v2.0

**Service Worker Test:**
1. DevTools → Application → Service Workers
2. Status: "activated and is running"
3. Update on reload: unchecked

### 3. Mobile Test

**Android:**
1. Chrome'da oching
2. "Add to Home screen"
3. Home screen'da icon paydo bo'ladi
4. Icon'ga bosing - app kabi ochiladi

**iOS:**
1. Safari'da oching
2. Share → "Add to Home Screen"
3. Home screen'da icon paydo bo'ladi
4. Icon'ga bosing - app kabi ochiladi

---

## 🐛 Troubleshooting

### Service Worker Ishlamayapti

**Muammo:** SW register bo'lmayapti

**Yechim:**
1. HTTPS yoki localhost'da ekanligini tekshiring
2. Console'da xatolarni ko'ring
3. sw.js faylining yo'li to'g'ri ekanligini tekshiring
4. Cache'ni tozalang: DevTools → Application → Clear storage

### Install Tugmasi Ko'rinmayapti

**Muammo:** "Install" icon address bar'da yo'q

**Yechim:**
1. Manifest.json to'g'ri ekanligini tekshiring
2. Icon'lar mavjud ekanligini tekshiring
3. Service Worker register bo'lganligini tekshiring
4. Ilova allaqachon o'rnatilgan bo'lishi mumkin
5. DevTools → Application → Manifest → Installability

### Offline Ishlamayapti

**Muammo:** Offline'da sahifa ochilmayapti

**Yechim:**
1. Service Worker activated ekanligini tekshiring
2. Cache'da fayllar bor ekanligini tekshiring
3. sw.js'da fetch event handler'ni tekshiring
4. Console'da xatolarni ko'ring

### Update Ishlamayapti

**Muammo:** Yangi versiya yuklanmayapti

**Yechim:**
1. sw.js'da versiyani o'zgartiring (v2.0 → v2.1)
2. Hard refresh: Ctrl+Shift+R
3. DevTools → Application → Service Workers → Unregister
4. Sahifani yangilang

---

## 📊 Performance

### Caching Strategiyalari

**1. Cache First (Static)**
- Fayllar: HTML, CSS, JS, images
- Tezlik: Juda tez (cache'dan)
- Yangilanish: Faqat versiya o'zgarganda

**2. Network First (Dynamic)**
- Fayllar: API so'rovlar, dynamic content
- Tezlik: O'rtacha (network'dan)
- Yangilanish: Har safar

**3. Stale While Revalidate**
- Fayllar: CSS, JS (tez-tez o'zgarmaydigan)
- Tezlik: Tez (cache'dan) + background update
- Yangilanish: Background'da

### Cache Size

```javascript
// DevTools → Application → Cache Storage
bolajon-static-v2.0:  ~500 KB  (HTML, CSS, JS)
bolajon-dynamic-v2.0: ~1 MB    (API responses)
bolajon-images-v2.0:  ~2 MB    (Images)
Total:                ~3.5 MB
```

---

## 🔮 Kelajak Rejalar

### 1. Push Notifications

```javascript
// Backend'dan notification yuborish
POST /api/notifications/send
{
  "title": "Navbat eslatmasi",
  "body": "Ertaga soat 10:00 da navbatingiz bor",
  "url": "/appointments"
}
```

### 2. Background Sync

```javascript
// Offline'da yozilgan ma'lumotlarni sync qilish
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-appointments');
});
```

### 3. Web Share API

```javascript
// Sahifani ulashish
if (navigator.share) {
  navigator.share({
    title: 'Bolajon Med',
    text: 'Sifatli tibbiy xizmatlar',
    url: 'https://bolajon.biznesjon.uz'
  });
}
```

### 4. Geolocation

```javascript
// Klinika manzilini ko'rsatish
navigator.geolocation.getCurrentPosition((position) => {
  // Show map with clinic location
});
```

---

## 📝 Changelog

### v2.0 (2026-02-09)
- ✅ Advanced Service Worker
- ✅ 3 xil caching strategiyasi
- ✅ Offline page
- ✅ Auto update detection
- ✅ Install instructions modal
- ✅ Online/Offline status
- ✅ Push notification ready
- ✅ Background sync ready
- ✅ Shortcuts (4 ta)
- ✅ Admin panel PWA support

### v1.0 (Oldingi)
- Basic Service Worker
- Simple caching
- Install button

---

## 🎯 Xulosa

Bolajon Med Klinikasi endi to'liq professional PWA!

**Afzalliklari:**
- ✅ Offline ishlaydi
- ✅ App kabi tajriba
- ✅ Tez yuklash (cache)
- ✅ Auto update
- ✅ Mobile friendly
- ✅ SEO optimized

**Test qiling:**
1. http://localhost:8000 da oching
2. "Ilovani yuklab olish" tugmasiga bosing
3. O'rnating va test qiling

**Production:**
1. website/ papkasini server'ga upload qiling
2. HTTPS sozlang
3. Nginx/Apache konfiguratsiya qiling
4. Test qiling

Tayyor! 🚀
