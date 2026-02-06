import express from 'express';

const router = express.Router();

// Simple AI chatbot responses (rule-based)
const responses = {
  greeting: [
    'Assalomu alaykum! Sizga qanday yordam bera olaman?',
    'Salom! Men sizga klinika haqida ma\'lumot bera olaman.',
    'Xush kelibsiz! Savolingiz bormi?'
  ],
  about: [
    'Men klinika AI yordamchisiman. Sizga klinika xizmatlari, ish vaqti, narxlar, tibbiy maslahatlar va boshqa ma\'lumotlar haqida yordam bera olaman.',
    'Men sun\'iy intellekt asosida ishlaydigan chatbotman. Klinika haqida savollaringizga javob beraman va oddiy tibbiy maslahatlar bera olaman.',
    'Men virtual yordamchiman. Sizga klinika xizmatlari, tibbiy ma\'lumotlar va umumiy sog\'liqni saqlash bo\'yicha yordam berish uchun yaratilganman.'
  ],
  appointment: [
    'Qabulga yozilish uchun resepsiyaga murojaat qiling yoki telefon orqali bog\'laning.',
    'Shifokor qabuliga yozilish uchun navbat tizimidan foydalaning.',
    'Qabulga oldindan yozilish uchun +998 XX XXX XX XX raqamiga qo\'ng\'iroq qiling.'
  ],
  hours: [
    'Klinikamiz dushanba-shanba kunlari soat 8:00 dan 20:00 gacha ishlaydi.',
    'Ish vaqti: 8:00 - 20:00 (dushanba-shanba)',
    'Yakshanba kunlari dam olish kuni.'
  ],
  services: [
    'Bizda terapiya, pediatriya, stomatologiya, laboratoriya va boshqa xizmatlar mavjud.',
    'Klinikamizda turli xil tibbiy xizmatlar ko\'rsatiladi: diagnostika, davolash, laboratoriya tekshiruvlari.',
    'Barcha tibbiy xizmatlar haqida batafsil ma\'lumot olish uchun resepsiyaga murojaat qiling.'
  ],
  price: [
    'Narxlar haqida aniq ma\'lumot olish uchun resepsiyaga murojaat qiling.',
    'Xizmatlar narxi turlicha. Batafsil ma\'lumot uchun +998 XX XXX XX XX raqamiga qo\'ng\'iroq qiling.',
    'Har bir xizmat narxi alohida. Aniq narxlarni resepsiyadan bilib olishingiz mumkin.'
  ],
  location: [
    'Klinikamiz manzili: [Manzil kiritilishi kerak]',
    'Bizni topish oson. Aniq manzil uchun administrator bilan bog\'laning.',
    'Klinika joylashuvi haqida ma\'lumot olish uchun resepsiyaga murojaat qiling.'
  ],
  emergency: [
    'Shoshilinch holatlarda 103 raqamiga qo\'ng\'iroq qiling!',
    'Favqulodda vaziyatlarda tez tibbiy yordam xizmatiga murojaat qiling: 103',
    'Og\'ir holatlarda darhol 103 ga qo\'ng\'iroq qiling!'
  ],
  
  // TIBBIY MASLAHATLAR - Kengaytirilgan
  cold_flu: [
    'Shamollash (sovuq tushish) uchun:\n\n1. Ko\'p suyuqlik iching (iliq suv, choy, sho\'rva)\n2. Dam oling va yetarli uxlang\n3. Retseptsiz dorilar: Paracetamol (temperatura uchun), Vitamin C\n4. Burun tomchilar (tiqilgan burun uchun)\n5. Iliq kiyining va sovuqdan saqlaning\n\nAgar 3-5 kun ichida yaxshilanmasangiz yoki temperatura 39°C dan yuqori bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Shamollash belgilari:\n- Burun oqishi\n- Yo\'tal\n- Bosh og\'rig\'i\n- Temperatura\n\nDavolash:\n1. Uyda dam oling\n2. Iliq ichimliklar (choy, limon, asal)\n3. Paracetamol yoki Ibuprofen (og\'riq va temperatura uchun)\n4. Vitamin C va multivitaminlar\n5. Namlik - xonani ventilyatsiya qiling\n\nOg\'ir holatlarda:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  headache: [
    'Bosh og\'rig\'i uchun:\n\n1. Retseptsiz dorilar: Paracetamol, Ibuprofen, Aspirin\n2. Dam oling va tinch joyda yoting\n3. Ko\'p suv iching\n4. Sovuq kompres peshonaga qo\'ying\n5. Stressdan qoching\n\nOg\'ir bosh og\'rig\'i, ko\'rish buzilishi yoki qusish bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Bosh og\'rig\'i sabablari:\n- Stress\n- Uyqusizlik\n- Dehidratsiya\n- Ko\'z toliqishi\n\nYengil davolash:\n1. Paracetamol 500mg (kerak bo\'lsa)\n2. Tinch muhitda dam oling\n3. Ko\'proq suv iching\n4. Massaj qiling (chakka va bo\'yin)\n\nOg\'ir bosh og\'rig\'i, ko\'rish buzilishi yoki qusish bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  stomach_pain: [
    'Qorin og\'rig\'i uchun:\n\n1. Yengil ovqatlanish (sho\'rva, guruch, non)\n2. Ko\'p suyuqlik iching\n3. Issiq kompres qoringa qo\'ying\n4. Retseptsiz dorilar: Aktivlangan ko\'mir, Smekta\n5. Og\'ir ovqatlardan qoching\n\nAgar og\'riq kuchli, qusish yoki ishal bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Qorin og\'rig\'i turlari:\n- Hazm qilish muammosi\n- Ovqat zaharlanishi\n- Gastrit\n\nBirinchi yordam:\n1. Yengil ovqatlar (sho\'rva, guruch)\n2. Ko\'p suv iching\n3. Aktivlangan ko\'mir (zaharlanish uchun)\n4. Dam oling\n\nOg\'ir holatlarda (qon, yuqori temperatura, kuchli og\'riq):\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  fever: [
    'Temperatura (isitma) uchun:\n\n1. Retseptsiz dorilar: Paracetamol, Ibuprofen\n2. Ko\'p suyuqlik iching\n3. Yengil kiyining\n4. Iliq suvda artib oling (sovuq emas!)\n5. Dam oling\n\nTemperatura 39°C dan yuqori yoki 3 kundan ko\'p davom etsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Temperatura davolash:\n\n1. Paracetamol 500mg (har 6 soatda)\n2. Ko\'p suv, choy, meva sharbatlari\n3. Yengil kiyim\n4. Xonani ventilyatsiya qiling\n5. Uyda dam oling\n\nBolalarda temperatura 38.5°C dan yuqori bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  cough: [
    'Yo\'tal uchun:\n\n1. Ko\'p iliq suyuqlik iching (choy, asal, limon)\n2. Yo\'tal siropi (retseptsiz)\n3. Namlik - bug\' inhalatsiyasi\n4. Asal va limon\n5. Chekishdan qoching\n\nYo\'tal 2 haftadan ko\'p davom etsa yoki qonda bo\'lsa:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Yo\'tal turlari:\n- Quruq yo\'tal\n- Balg\'amli yo\'tal\n\nDavolash:\n1. Iliq ichimliklar (choy, sho\'rva)\n2. Asal va limon\n3. Yo\'tal siropi (dorixonadan)\n4. Bug\' inhalatsiyasi\n5. Namlik - xonani namlang\n\nUzoq davom etadigan yo\'tal uchun:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  allergy: [
    'Allergiya uchun:\n\n1. Allergendan uzoqlashing\n2. Antihistamin dorilar: Suprastin, Loratadin, Cetirizin\n3. Ko\'p suv iching\n4. Tozalang - chang va allergenlarni olib tashlang\n\nOg\'ir allergiya (nafas qisilishi, shish) bo\'lsa, darhol 103 ga qo\'ng\'iroq qiling!',
    'Allergiya belgilari:\n- Teri qichishi\n- Burun oqishi\n- Ko\'z yoshlanishi\n- Nafas qisilishi\n\nDavolash:\n1. Allergendan qoching\n2. Antihistamin dorilar (Loratadin, Cetirizin)\n3. Ko\'p suv iching\n4. Tozalang\n\nOg\'ir allergiya (anaphylaxis) - darhol 103!'
  ],
  
  pain_relief: [
    'Og\'riq qoldiruvchi retseptsiz dorilar:\n\n1. Paracetamol - bosh og\'rig\'i, temperatura\n2. Ibuprofen - yallig\'lanish, og\'riq\n3. Aspirin - bosh og\'rig\'i (bolalarga berilmaydi!)\n4. No-Shpa - qorin og\'rig\'i, spazm\n\nDoimiy og\'riq uchun:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88',
    'Og\'riq qoldiruvchi dorilar:\n\n1. Paracetamol 500mg - har 6 soatda\n2. Ibuprofen 400mg - har 8 soatda\n3. Aspirin 500mg - har 6 soatda (18 yoshdan katta)\n\nEslatma: Dorilarni dozasiga rioya qiling!\n\nKo\'proq ma\'lumot uchun:\n📞 Bolajon klinikasiga tashrif buyuring yoki quyidagi raqamlarga tel qiling:\n+998 77 310 98 28\n+998 77 252 86 88'
  ],
  
  website: [
    'Saytimiz qanday ishlaydi:\n\n1. Ro\'yxatdan o\'ting - bemor profili yarating\n2. Navbatga yoziling - shifokor qabuliga\n3. Retseptlaringizni ko\'ring - shifokor yozgan dorilar\n4. Tahlil natijalarini tekshiring - laboratoriya natijalari\n5. Hisob-fakturalaringizni ko\'ring - to\'lovlar\n6. AI chatbot - savollaringizga javob\n\nSayt 24/7 ishlaydi va barcha ma\'lumotlaringiz xavfsiz saqlanadi!',
    'Veb-saytimizda:\n\n✅ Bemor portali - shaxsiy kabinet\n✅ Navbat tizimi - onlayn yozilish\n✅ Retseptlar - shifokor tayinlamalari\n✅ Tahlillar - laboratoriya natijalari\n✅ Hisob-fakturalar - to\'lovlar tarixi\n✅ AI chatbot - 24/7 yordam\n\nSayt orqali onlayn xizmatlardan foydalanish uchun tizimga kiring yoki ro\'yxatdan o\'ting.',
    'Sayt imkoniyatlari:\n\n1. Onlayn navbat - shifokorga yozilish\n2. Retseptlar - dorilar ro\'yxati\n3. Tahlillar - natijalarni ko\'rish\n4. To\'lovlar - hisob-fakturalar\n5. Profil - shaxsiy ma\'lumotlar\n6. AI yordam - 24/7 chatbot\n\nBarcha xizmatlar xavfsiz va qulay!'
  ],
  
  default: [
    'Kechirasiz, bu savolga aniq javob berolmayman. Iltimos, aniqroq savol bering yoki quyidagi mavzulardan birini tanlang:\n\n- Shamollash va sovuq tushish\n- Bosh og\'rig\'i\n- Qorin og\'rig\'i\n- Temperatura\n- Yo\'tal\n- Allergiya\n- Sayt haqida\n- Klinika xizmatlari\n\nYoki administrator bilan bog\'laning:\n📞 +998 77 310 98 28\n📞 +998 77 252 86 88',
    'Bu haqda aniq ma\'lumot yo\'q. Iltimos, quyidagilardan birini so\'rang:\n\n✅ Tibbiy maslahatlar (shamollash, bosh og\'riq, temperatura)\n✅ Sayt qanday ishlaydi\n✅ Klinika xizmatlari\n✅ Ish vaqti va narxlar\n\nYoki klinikaga murojaat qiling:\n📞 +998 77 310 98 28\n📞 +998 77 252 86 88',
    'Sizning savolingizga javob topilmadi. Men quyidagi mavzularda yordam bera olaman:\n\n🏥 Tibbiy maslahatlar\n💊 Retseptsiz dorilar\n🌐 Sayt imkoniyatlari\n📞 Klinika ma\'lumotlari\n\nIltimos, boshqa savol bering yoki administrator bilan gaplashing:\n📞 +998 77 310 98 28\n📞 +998 77 252 86 88'
  ]
};

// Keywords for intent detection
const keywords = {
  greeting: ['salom', 'assalomu', 'alaykum', 'xayr', 'hello', 'hi', 'привет', 'xush', 'kelibsiz'],
  about: ['siz', 'kimsiz', 'kim', 'bot', 'ai', 'yordamchi', 'assistant', 'who', 'кто', 'ты', 'sen', 'kimsan'],
  appointment: ['qabul', 'yozil', 'navbat', 'appointment', 'врач', 'shifokor', 'doktor', 'ko\'rik'],
  hours: ['vaqt', 'soat', 'ishlash', 'ochiq', 'yopiq', 'hours', 'время', 'график', 'qachon'],
  services: ['xizmat', 'service', 'услуга', 'davolash', 'tekshir', 'analiz', 'muolaja'],
  price: ['narx', 'pul', 'to\'lov', 'price', 'cost', 'цена', 'стоимость', 'qancha'],
  location: ['manzil', 'joy', 'qayerda', 'address', 'location', 'адрес', 'где'],
  emergency: ['shoshilinch', 'favqulodda', 'tez', 'emergency', 'urgent', 'срочно', 'экстренно', 'og\'ir'],
  
  // Tibbiy mavzular - kengaytirilgan
  cold_flu: ['shamollash', 'sovuq', 'gripp', 'flu', 'cold', 'простуда', 'грипп', 'burun', 'oqish', 'tushish'],
  headache: ['bosh', 'og\'riq', 'og\'riyapti', 'headache', 'головная', 'боль', 'migren', 'chakka'],
  stomach_pain: ['qorin', 'oshqozon', 'stomach', 'живот', 'hazm', 'ichak', 'zaharlan'],
  fever: ['temperatura', 'isitma', 'fever', 'температура', 'issiq', 'qizish'],
  cough: ['yo\'tal', 'cough', 'кашель', 'balg\'am', 'tomog\''],
  allergy: ['allergiya', 'allergy', 'аллергия', 'qichish', 'teri', 'shish'],
  pain_relief: ['og\'riq', 'qoldiruvchi', 'dori', 'paracetamol', 'ibuprofen', 'aspirin', 'pain', 'relief'],
  
  website: ['sayt', 'website', 'сайт', 'qanday', 'ishlaydi', 'how', 'work', 'portal', 'tizim', 'online']
};

// Detect intent from message
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some(word => lowerMessage.includes(word))) {
      return intent;
    }
  }
  
  return 'default';
}

// Get random response
function getRandomResponse(intent) {
  const responseList = responses[intent] || responses.default;
  return responseList[Math.floor(Math.random() * responseList.length)];
}

/**
 * @swagger
 * /api/v1/ai-chatbot/chat:
 *   post:
 *     summary: Send message to AI chatbot
 *     tags: [AI Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Xabar bo\'sh bo\'lishi mumkin emas'
      });
    }

    // Detect intent and get response
    const intent = detectIntent(message);
    const response = getRandomResponse(intent);

    // Log for analytics (optional)
    console.log(`[AI Chatbot] Session: ${sessionId}, Intent: ${intent}, Message: ${message.substring(0, 50)}...`);

    res.json({
      success: true,
      message: response,
      intent,
      sessionId
    });

  } catch (error) {
    console.error('AI Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Serverda xatolik yuz berdi'
    });
  }
});

/**
 * @swagger
 * /api/v1/ai-chatbot/health:
 *   get:
 *     summary: Check AI chatbot health
 *     tags: [AI Chatbot]
 *     responses:
 *       200:
 *         description: Chatbot is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    message: 'AI Chatbot is running'
  });
});

export default router;
