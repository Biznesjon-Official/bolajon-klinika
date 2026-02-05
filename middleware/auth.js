const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token topilmadi' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.xodim = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token yaroqsiz' });
    }
};

const roleCheck = (lavozimlar) => {
    return (req, res, next) => {
        if (!lavozimlar.includes(req.xodim.lavozim)) {
            return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
        }
        next();
    };
};

module.exports = { authMiddleware, roleCheck };
