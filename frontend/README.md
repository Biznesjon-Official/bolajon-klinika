# Vitalis Klinika - Frontend

Klinika boshqaruv tizimining frontend qismi (React + Vite + Tailwind CSS)

## Texnologiyalar

- ⚛️ React 19
- ⚡ Vite (Rolldown)
- 🎨 Tailwind CSS 4
- 🔀 React Router DOM
- 📡 Axios

## O'rnatish

```bash
npm install
```

## Ishga tushirish

Development rejimda:
```bash
npm run dev
```

Build qilish:
```bash
npm run build
```

Preview:
```bash
npm run preview
```

## Struktura

```
src/
├── components/     # Qayta ishlatiladigan komponentlar
│   ├── Header.jsx
│   ├── Hero.jsx
│   ├── Services.jsx
│   ├── Doctors.jsx
│   └── Footer.jsx
├── pages/          # Sahifalar
│   └── LandingPage.jsx
├── App.jsx         # Asosiy App komponenti
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Backend bilan bog'lanish

Backend API: `http://localhost:3000/api/`

Axios konfiguratsiyasi:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});
```

## Xususiyatlar

✅ Landing page (Bosh sahifa)
✅ Responsive dizayn
✅ Dark mode qo'llab-quvvatlash
✅ Material Symbols icons
✅ Tailwind CSS bilan styling
