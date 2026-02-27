# Bolajon Klinik — Optimization Rejasi

Loyihani 0.3s gacha tezlashtirish uchun barcha topilgan muammolar va yechimlar.

## Belgilar
- 🔴 Critical — birinchi navbatda
- 🟠 High — keyin
- 🟡 Medium — oxirida
- ✅ Bajarildi
- ⬜ Bajarilmadi

---

## 1. BACKEND OPTIMIZATION (17 ta)

### N+1 Query Muammolari (eng katta tasir)

| # | Muammo | Fayl:qator | Yechim | Holat |
|---|--------|-----------|--------|-------|
| 1 | 🔴 Bed query loop ichida (20 extra query) | `ambulator-inpatient.routes.js:82-88` | `Bed.find({ room_id: { $in: roomIds } })` batch query | ⬜ |
| 2 | 🔴 Bed+PatientNurse loop (2 query/admission) | `patient.routes.js:248-260` | `.populate('bed')` yoki batch lookup | ⬜ |
| 3 | 🔴 countDocuments loop (10 extra query) | `queue.routes.js:123-143` | Aggregation pipeline `$group` bilan | ⬜ |
| 4 | 🔴 Bonus+Penalty count loop (100 query/50 payroll) | `payroll.routes.js:548-561` | `$group + $sum` aggregation | ⬜ |

### Sequential → Parallel

| # | Muammo | Fayl:qator | Yechim | Holat |
|---|--------|-----------|--------|-------|
| 5 | 🟠 invoices, prescriptions, labResults ketma-ket | `patient.routes.js:291-334` | `Promise.all([...])` bilan parallel | ⬜ |
| 6 | 🟠 patient, room, nurses ketma-ket loop ichida | `ambulator-inpatient.routes.js:549-576` | `.populate()` yoki batch | ⬜ |

### Query Optimization

| # | Muammo | Fayl:qator | Yechim | Holat |
|---|--------|-----------|--------|-------|
| 7 | 🟡 `.lean()` yo'q MedicalRecord query | `patient.routes.js:407-411` | `.lean()` qo'shish | ⬜ |
| 8 | 🟡 Index yo'q | `ServiceCategory.js`, `Settings.js` model | Index qo'shish | ⬜ |

### Config/Infra

| # | Muammo | Fayl | Yechim | Holat |
|---|--------|------|--------|-------|
| 9 | 🟡 Redis reconnectStrategy: false | `config/redis.js:24` | Exponential backoff qo'shish | ⬜ |
| 10 | 🟡 Duplicate rateLimiter | `rateLimit.js` + `rateLimiter.js` | Bitta faylga birlashtirish | ⬜ |
| 11 | 🟠 Rate limit 1000 req (juda yuqori) | `.env` | Login: 5, API: 100 qilish | ⬜ |
| 12 | 🟠 CORS_ORIGIN localhost | `.env` | Production domain qo'yish | ⬜ |

### Katta Fayllar (split kerak)

| # | Fayl | Qatorlar | Yechim | Holat |
|---|------|----------|--------|-------|
| 13 | 🟡 `laboratory.routes.js` | 1426 | labTests, reagents, labOrders ga split | ⬜ |
| 14 | 🟡 `billing.routes.js` | 1079 | invoices, payments ga split | ⬜ |
| 15 | 🟡 `payroll.routes.js` | 1044 | payrollMonthly, bonusRewards ga split | ⬜ |
| 16 | 🟡 `reports.routes.js` | 1012 | reportFinance, reportStaff ga split | ⬜ |

### PM2

| # | Muammo | Yechim | Holat |
|---|--------|--------|-------|
| 17 | 🟠 ecosystem.config.js yo'q | PM2 cluster mode + auto-restart config yaratish | ⬜ |

---

## 2. FRONTEND OPTIMIZATION (18 ta)

### Bundle Size (eng katta tasir)

| # | Muammo | Fayl | Yechim | Holat |
|---|--------|------|--------|-------|
| 18 | 🔴 CashierAdvanced 2943 qator / 98KB | `CashierAdvanced.jsx` | 3-4 subcomponent ga ajratish | ⬜ |
| 19 | 🔴 xlsx 300KB+ bundle | `package.json` | `import('xlsx')` dynamic import | ⬜ |
| 20 | 🟠 html2pdf.js 40KB+ | `package.json` | `import('html2pdf.js')` dynamic import | ⬜ |
| 21 | 🟠 chart.js alohida chunk emas | `vite.config.js` manualChunks | chart-vendor chunk qo'shish | ⬜ |
| 22 | 🟡 chunkSizeWarningLimit 1000KB | `vite.config.js:33` | 300KB ga tushirish | ⬜ |
| 23 | 🟡 qrcode + qrcode.react duplikat | `package.json` | Bittasini olib tashlash | ⬜ |

### React Performance

| # | Muammo | Fayl | Yechim | Holat |
|---|--------|------|--------|-------|
| 24 | 🔴 0 ta React.memo | barcha components | StatCard, OrdersList, PatientRow ga qo'shish | ⬜ |
| 25 | 🟠 7 ta useMemo/useCallback (kam) | barcha pages | PatientProfile, DoctorPanel, CashierAdvanced ga qo'shish | ⬜ |
| 26 | 🟡 9 ta setInterval memory leak risk | turli komponentlar | Cleanup function tekshirish | ⬜ |

### API & Network

| # | Muammo | Fayl | Yechim | Holat |
|---|--------|------|--------|-------|
| 27 | 🟠 Debounce yo'q (search/filter) | barcha search input | 300ms debounce qo'shish | ⬜ |
| 28 | 🟠 API cache yo'q | services/ | Service-level cache (stale-while-revalidate) | ⬜ |
| 29 | 🟠 Material Symbols blocking load | `index.html:30` | `display: swap` qilish | ⬜ |

### Code Quality

| # | Muammo | Fayl | Yechim | Holat |
|---|--------|------|--------|-------|
| 30 | 🔴 136 ta console.log | pages/ ichida | Vite plugin bilan prod'da strip qilish | ⬜ |
| 31 | 🟡 Prefetch faqat 3 sahifa | `App.jsx` | Patients, Queue, QueueManagement prefetch | ⬜ |

### Katta Sahifalar (split kerak)

| # | Fayl | Qatorlar | Yechim | Holat |
|---|------|----------|--------|-------|
| 32 | 🔴 `CashierAdvanced.jsx` | 2943 | InvoiceForm, ServiceSelector, StatsPanel | ⬜ |
| 33 | 🟠 `PatientProfile.jsx` | 2819 | Tab komponentlarni alohida faylga | ⬜ |
| 34 | 🟡 `PayrollManagement.jsx` | 2135 | Chart va table alohida | ⬜ |
| 35 | 🟡 `DoctorPanel.jsx` | 1742 | Queue, prescription alohida | ⬜ |

---

## 3. DEPLOY/SERVER OPTIMIZATION (8 ta)

### Nginx

| # | Muammo | Yechim | Holat |
|---|--------|--------|-------|
| 36 | 🟡 Brotli compression yo'q | Nginx brotli module qo'shish (20% kichikroq) | ⬜ |
| 37 | ✅ Gzip | Level 6, 1KB threshold — yaxshi | ✅ |
| 38 | ✅ HTTP/2 | `listen 443 ssl http2` — yaxshi | ✅ |
| 39 | ✅ Cache-Control | Static: 1 year immutable — yaxshi | ✅ |
| 40 | ✅ Security Headers | X-Frame, X-Content-Type, XSS — yaxshi | ✅ |

### Server

| # | Muammo | Yechim | Holat |
|---|--------|--------|-------|
| 41 | 🟠 PM2 cluster mode yo'q | `pm2 start -i max` (barcha CPU) | ⬜ |
| 42 | 🟡 CDN yo'q | Cloudflare yoki similar (global tezlik) | ⬜ |
| 43 | 🟡 Docker/CI-CD yo'q | Dockerfile + GitHub Actions | ⬜ |

---

## 4. ALLAQACHON YAXSHI (o'zgartirish shart emas)

| # | Nima | Holat |
|---|------|-------|
| 1 | MongoDB pool: maxPoolSize 100, minPoolSize 10 | ✅ |
| 2 | Compression middleware: gzip level 6 + Brotli | ✅ |
| 3 | Helmet security headers | ✅ |
| 4 | React.lazy() 40+ sahifada | ✅ |
| 5 | Vite manualChunks (react, axios, i18n) | ✅ |
| 6 | Winston logger (file rotation) | ✅ |
| 7 | index.html preconnect + inline critical CSS | ✅ |
| 8 | MongoDB indexes (Patient, Queue, Invoice, LabOrder) | ✅ |
| 9 | Token refresh queue pattern | ✅ |
| 10 | Nginx gzip + HTTP/2 + cache headers | ✅ |

---

## Bajarish tartibi (prioritet bo'yicha)

### 1-bosqich: Eng katta tasir (1-2 kun)
- [ ] #1-4 — N+1 query'larni tuzatish
- [ ] #5-6 — Sequential → parallel
- [ ] #30 — console.log tozalash
- [ ] #19 — xlsx dynamic import

### 2-bosqich: Frontend (2-3 kun)
- [ ] #18, #32 — CashierAdvanced split
- [ ] #24 — React.memo qo'shish
- [ ] #27 — Debounce search/filter
- [ ] #21 — chart.js alohida chunk
- [ ] #29 — Material Symbols swap

### 3-bosqich: Infra (1 kun)
- [ ] #11-12 — Rate limit + CORS production
- [ ] #17, #41 — PM2 ecosystem + cluster mode
- [ ] #28 — API cache layer

### 4-bosqich: Refactor (3-5 kun)
- [ ] #13-16 — Backend katta fayllar split
- [ ] #33-35 — Frontend katta sahifalar split
- [ ] #25-26 — useMemo/useCallback + setInterval cleanup

---

**Jami: 43 ta punkt (33 ta bajarilmagan, 10 ta allaqachon yaxshi)**
