const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PWA Headers - Service Worker uchun
app.use((req, res, next) => {
    // Service Worker fayllar uchun to'g'ri MIME type
    if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    
    // Manifest uchun
    if (req.url.endsWith('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json');
    }
    
    // Service Worker cache control
    if (req.url.includes('sw.js') || req.url.includes('service-worker.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Service-Worker-Allowed', '/');
    }
    
    next();
});

// Serve static files from website directory
app.use(express.static(path.join(__dirname, 'website')));

// Serve frontend build (production)
const frontendBuildPath = path.join(__dirname, 'frontend', 'dist');
app.use('/app', express.static(frontendBuildPath));

// API Routes - Proxy to backend
const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Landing page server ishlayapti' });
});

// Telegram bot va cron scheduler (agar kerak bo'lsa)
if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
        require('./bot/index');
        require('./cron/scheduler');
    } catch (error) {
        console.log('⚠️  Bot/Cron not available:', error.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Landing Page Server ${PORT} portda ishga tushdi`);
    console.log(`🌐 Website: http://localhost:${PORT}/`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`📱 App: http://localhost:${PORT}/app/`);
    console.log(`🔌 Backend API: ${API_BASE}`);
});

module.exports = app;
