/**
 * DEBOUNCE MIDDLEWARE
 * 1️⃣1️⃣ Search va filterga debounce
 * Ortiqcha so'rovlarni oldini olish
 */

const requestCache = new Map();

export const debounceRequest = (delay = 300) => {
  return (req, res, next) => {
    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    
    // Agar bir xil so'rov mavjud bo'lsa
    if (requestCache.has(key)) {
      const cached = requestCache.get(key);
      
      // Agar juda yaqinda yuborilgan bo'lsa, kutish
      if (Date.now() - cached.timestamp < delay) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait.'
        });
      }
    }
    
    // Yangi so'rovni cache ga qo'shish
    requestCache.set(key, { timestamp: Date.now() });
    
    // Eski cache larni tozalash (5 daqiqadan eski)
    setTimeout(() => {
      for (const [k, v] of requestCache.entries()) {
        if (Date.now() - v.timestamp > 300000) {
          requestCache.delete(k);
        }
      }
    }, 60000);
    
    next();
  };
};
