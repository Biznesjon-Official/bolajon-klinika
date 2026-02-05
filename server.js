const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from website directory
app.use(express.static(path.join(__dirname, 'website')));

// API Routes
app.use('/api/bemorlar', require('./routes/bemorlar'));
app.use('/api/navbat', require('./routes/navbat'));
app.use('/api/tolovlar', require('./routes/tolovlar'));
app.use('/api/statsionar', require('./routes/statsionar'));
app.use('/api/xodimlar', require('./routes/xodimlar'));
app.use('/api/tahlillar', require('./routes/tahlillar'));
app.use('/api/muolajalar', require('./routes/muolajalar'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Klinika tizimi ishlayapti' });
});

// Telegram bot va cron scheduler
if (process.env.TELEGRAM_BOT_TOKEN) {
    require('./bot/index');
    require('./cron/scheduler');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server ${PORT} portda ishga tushdi`);
    console.log(`🌐 Website: http://localhost:${PORT}/`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`🔌 API: http://localhost:${PORT}/api/`);
});

module.exports = app;
