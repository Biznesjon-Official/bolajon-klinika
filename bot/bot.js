import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { config } from './config.js';

// Bot yaratish
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Foydalanuvchi sessiyalari
const userSessions = new Map();

// API so'rovlari uchun helper
const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
});

// API xatoliklarini ushlash
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running!');
      console.error('Please start backend server: cd backend && npm run dev');
    }
    throw error;
  }
);

// Telefon raqamni formatlash
function formatPhone(phone) {
  // +998901234567 formatiga keltirish
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('998')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('8')) {
    cleaned = '+998' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '+998' + cleaned;
  }
  return cleaned;
}

// Asosiy menyu klaviaturasi
function getMainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: '📊 Navbat' }, { text: '💊 Retseptlar' }],
      [{ text: '🔬 Tahlillar' }, { text: '💰 Qarzlar' }],
      [{ text: '📨 Xabarlar' }, { text: '⚙️ Sozlamalar' }]
    ],
    resize_keyboard: true
  };
}

// Inline tugmalar - bemor ma'lumotlari uchun
function getPatientInfoKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 Navbat', callback_data: 'info_queue' },
        { text: '💊 Retseptlar', callback_data: 'info_prescriptions' }
      ],
      [
        { text: '🔬 Tahlillar', callback_data: 'info_lab' },
        { text: '💰 Qarzlar', callback_data: 'info_debts' }
      ],
      [
        { text: '📨 Xabarlar', callback_data: 'info_messages' }
      ]
    ]
  };
}

// /start komandasi (deep linking va 8-xonali kod bilan)
bot.onText(/\/start\s*(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1] ? match[1].trim() : ''; // Deep link parametri yoki 8-xonali kod
  const session = userSessions.get(chatId) || {};
  
  console.log('=== START COMMAND ===');
  console.log('Chat ID:', chatId);
  console.log('Raw start param:', JSON.stringify(match[1]));
  console.log('Trimmed start param:', startParam);
  console.log('Start param length:', startParam.length);
  console.log('Username:', msg.from.username);
  console.log('Full message text:', msg.text);
  console.log('Match array:', match);
  
  // Agar deep link parametri yoki 8-xonali kod bor bo'lsa
  if (startParam && startParam.length > 0) {
    try {
      await bot.sendMessage(chatId, '⏳ Yuklanmoqda...');
      
      let patient = null;
      
      // Agar 8 xonali raqam bo'lsa (access_code)
      if (/^\d{8}$/.test(startParam)) {
        console.log('🔢 8-digit access code detected:', startParam);
        
        // Access code bo'yicha bemorni topish
        const response = await api.get(`/bot/patients/by-access-code/${startParam}`);
        
        if (response.data.success && response.data.data) {
          patient = response.data.data;
          console.log('✅ Patient found by access code:', patient.first_name, patient.last_name);
        }
      } else {
        // Patient number bo'yicha topish (eski usul)
        console.log('🔗 Deep link detected! Patient Number:', startParam);
        
        const response = await api.get(`/bot/patients/by-number/${startParam}`);
        
        if (response.data.success && response.data.data) {
          patient = response.data.data;
          console.log('✅ Patient found by patient number:', patient.first_name, patient.last_name);
        }
      }
      
      if (patient) {
        // Chat ID ni database'ga saqlash
        console.log('Saving chat_id to database...');
        console.log('Patient ID:', patient._id || patient.id);
        await api.put(`/bot/patients/telegram/${patient._id || patient.id}`, {
          telegram_chat_id: chatId.toString(),
          telegram_username: msg.from.username || null,
          telegram_notifications_enabled: true
        });
        
        console.log('✅ Chat ID saved to database!');
        
        // Sessiyaga saqlash
        userSessions.set(chatId, {
          patient,
          phone: patient.phone,
          language: 'uz'
        });
        
        await bot.sendMessage(
          chatId,
          `✅ Muvaffaqiyatli ulandi!\n\n🎉 Xush kelibsiz, ${patient.first_name} ${patient.last_name}!`,
          { parse_mode: 'Markdown' }
        );
        
        // Bot haqida batafsil ma'lumot
        const infoMessage = `📱 *Bot imkoniyatlari:*\n\n` +
          `🔹 *Navbat* - Navbat ma'lumotlaringizni real vaqtda kuzatib boring\n` +
          `🔹 *Retseptlar* - Shifokorlar tomonidan yozilgan barcha retseptlaringizni ko'ring\n` +
          `🔹 *Tahlillar* - Tahlil natijalaringizni darhol bilib oling\n` +
          `🔹 *Qarzlar* - Moliyaviy ma'lumotlaringizni nazorat qiling\n\n` +
          `🔔 *Avtomatik xabarnomalar:*\n` +
          `• Navbatga chaqirilganingizda\n` +
          `• Yangi retsept yozilganda\n` +
          `• Tahlil natijasi tayyor bo'lganda\n\n` +
          `💡 Quyidagi menyudan kerakli bo'limni tanlang!`;
        
        await bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
        
        // Inline tugmalar bilan menyu
        await bot.sendMessage(
          chatId,
          '📋 *Ma\'lumotlaringizni ko\'rish uchun quyidagi tugmalardan birini tanlang:*',
          { 
            parse_mode: 'Markdown',
            reply_markup: getPatientInfoKeyboard()
          }
        );
        
        // Oddiy menyu ham qo'shish
        await bot.sendMessage(
          chatId,
          'Yoki quyidagi menyudan tanlang:',
          { reply_markup: getMainMenuKeyboard() }
        );
        
        return;
      } else {
        console.log('❌ Patient not found in API response');
        await bot.sendMessage(chatId, '❌ Bemor topilmadi. Iltimos, to\'g\'ri 8-xonali kodni kiriting yoki klinikaga murojaat qiling.');
        return;
      }
    } catch (error) {
      console.error('❌ Error linking patient:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error stack:', error.stack);
      
      // Foydalanuvchiga tushunarli xabar
      if (error.code === 'ECONNREFUSED') {
        await bot.sendMessage(
          chatId, 
          '❌ Server bilan bog\'lanib bo\'lmadi.\n\n' +
          'Iltimos, biroz kutib qayta urinib ko\'ring yoki klinikaga murojaat qiling.'
        );
      } else if (error.response?.status === 404) {
        await bot.sendMessage(
          chatId, 
          '❌ Bemor topilmadi.\n\n' +
          'Iltimos, to\'g\'ri 8-xonali kodni kiriting yoki klinikaga murojaat qiling.'
        );
      } else {
        await bot.sendMessage(
          chatId, 
          '❌ Xatolik yuz berdi.\n\n' +
          `Xatolik: ${error.message}\n\n` +
          'Iltimos, qayta urinib ko\'ring yoki klinikaga murojaat qiling.'
        );
      }
      return;
    }
  }
  
  if (session.patient) {
    // Agar bemor allaqachon ro'yxatdan o'tgan bo'lsa
    await bot.sendMessage(
      chatId,
      `🎉 Xush kelibsiz, ${session.patient.first_name}!`,
      { parse_mode: 'Markdown' }
    );
    
    // Bot haqida batafsil ma'lumot
    const infoMessage = `📱 *Bot imkoniyatlari:*\n\n` +
      `🔹 *Navbat* - Navbat ma'lumotlaringizni real vaqtda kuzatib boring\n` +
      `🔹 *Retseptlar* - Shifokorlar tomonidan yozilgan barcha retseptlaringizni ko'ring\n` +
      `🔹 *Tahlillar* - Tahlil natijalaringizni darhol bilib oling\n` +
      `🔹 *Qarzlar* - Moliyaviy ma'lumotlaringizni nazorat qiling\n\n` +
      `🔔 *Avtomatik xabarnomalar:*\n` +
      `• Navbatga chaqirilganingizda\n` +
      `• Yangi retsept yozilganda\n` +
      `• Tahlil natijasi tayyor bo'lganda\n\n` +
      `💡 Quyidagi menyudan kerakli bo'limni tanlang!`;
    
    await bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
    
    await bot.sendMessage(
      chatId,
      config.MESSAGES.uz.main_menu,
      { reply_markup: getMainMenuKeyboard() }
    );
  } else {
    // Agar bemor ro'yxatdan o'tmagan bo'lsa - 8-xonali kodni kiritishni so'rash
    console.log('⚠️ No start parameter - user must enter 8-digit code');
    await bot.sendMessage(
      chatId,
      `👋 Assalomu alaykum! Klinika botiga xush kelibsiz.\n\n` +
      `🔐 Botdan foydalanish uchun sizga berilgan *8-xonali maxsus kodni* kiriting.\n\n` +
      `📝 Kod klinikada ro'yxatdan o'tganingizda berilgan.\n\n` +
      `💡 Kodni bilmasangiz, klinikaga murojaat qiling.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Kontakt qabul qilish
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const phone = formatPhone(msg.contact.phone_number);
  
  await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
  
  try {
    // Bemorni telefon raqami bo'yicha topish
    const response = await api.get('/patients/search', {
      params: { q: phone }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      const patient = response.data.data[0];
      
      // Chat ID ni database'ga saqlash
      try {
        await api.put(`/patients/${patient.id}`, {
          telegram_chat_id: chatId,
          telegram_username: msg.from.username || null,
          telegram_notifications_enabled: true
        });
      } catch (updateError) {
        console.error('Error updating telegram_chat_id:', updateError);
      }
      
      // Sessiyaga saqlash
      userSessions.set(chatId, {
        patient,
        phone,
        language: 'uz'
      });
      
      await bot.sendMessage(
        chatId,
        `✅ Xush kelibsiz, ${patient.first_name} ${patient.last_name}!`,
        { parse_mode: 'Markdown' }
      );
      
      // Bot haqida batafsil ma'lumot
      const infoMessage = `📱 *Bot imkoniyatlari:*\n\n` +
        `🔹 *Navbat* - Navbat ma'lumotlaringizni real vaqtda kuzatib boring\n` +
        `🔹 *Retseptlar* - Shifokorlar tomonidan yozilgan barcha retseptlaringizni ko'ring\n` +
        `🔹 *Tahlillar* - Tahlil natijalaringizni darhol bilib oling\n` +
        `🔹 *Qarzlar* - Moliyaviy ma'lumotlaringizni nazorat qiling\n\n` +
        `🔔 *Avtomatik xabarnomalar:*\n` +
        `• Navbatga chaqirilganingizda\n` +
        `• Yangi retsept yozilganda\n` +
        `• Tahlil natijasi tayyor bo'lganda\n\n` +
        `💡 Quyidagi menyudan kerakli bo'limni tanlang!`;
      
      await bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
      
      await bot.sendMessage(
        chatId,
        config.MESSAGES.uz.main_menu,
        { reply_markup: getMainMenuKeyboard() }
      );
    } else {
      await bot.sendMessage(
        chatId,
        config.MESSAGES.uz.not_registered,
        {
          reply_markup: {
            keyboard: [[{ text: '🔄 Qaytadan urinish' }]],
            resize_keyboard: true
          }
        }
      );
    }
  } catch (error) {
    console.error('Error finding patient:', error);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
});

// Matn xabarlari
bot.on('message', async (msg) => {
  if (msg.contact || msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  const session = userSessions.get(chatId);
  
  if (!session || !session.patient) {
    // 8-xonali kod kiritilgan bo'lishi mumkin
    if (text && /^\d{8}$/.test(text.trim())) {
      const accessCode = text.trim();
      await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
      
      try {
        console.log('🔢 Attempting to find patient by access code:', accessCode);
        console.log('API URL:', `${config.API_URL}/bot/patients/by-access-code/${accessCode}`);
        
        const response = await api.get(`/bot/patients/by-access-code/${accessCode}`);
        
        console.log('✅ API Response:', response.data);
        
        if (response.data.success && response.data.data) {
          const patient = response.data.data;
          
          console.log('✅ Patient found:', patient.first_name, patient.last_name);
          
          // Chat ID ni database'ga saqlash
          await api.put(`/bot/patients/telegram/${patient._id || patient.id}`, {
            telegram_chat_id: chatId.toString(),
            telegram_username: msg.from.username || null,
            telegram_notifications_enabled: true
          });
          
          userSessions.set(chatId, {
            patient,
            phone: patient.phone,
            language: 'uz'
          });
          
          await bot.sendMessage(
            chatId,
            `✅ Xush kelibsiz, ${patient.first_name} ${patient.last_name}!`,
            { parse_mode: 'Markdown' }
          );
          
          // Bot haqida batafsil ma'lumot
          const infoMessage = `📱 *Bot imkoniyatlari:*\n\n` +
            `🔹 *Navbat* - Navbat ma'lumotlaringizni real vaqtda kuzatib boring\n` +
            `🔹 *Retseptlar* - Shifokorlar tomonidan yozilgan barcha retseptlaringizni ko'ring\n` +
            `🔹 *Tahlillar* - Tahlil natijalaringizni darhol bilib oling\n` +
            `🔹 *Qarzlar* - Moliyaviy ma'lumotlaringizni nazorat qiling\n\n` +
            `🔔 *Avtomatik xabarnomalar:*\n` +
            `• Navbatga chaqirilganingizda\n` +
            `• Yangi retsept yozilganda\n` +
            `• Tahlil natijasi tayyor bo'lganda\n\n` +
            `💡 Quyidagi menyudan kerakli bo'limni tanlang!`;
          
          await bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
          
          await bot.sendMessage(
            chatId,
            config.MESSAGES.uz.main_menu,
            { reply_markup: getMainMenuKeyboard() }
          );
        } else {
          console.log('❌ Patient not found in response');
          await bot.sendMessage(chatId, '❌ Noto\'g\'ri kod. Iltimos, to\'g\'ri 8-xonali kodni kiriting.');
        }
      } catch (error) {
        console.error('❌ Error finding patient by access code:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Foydalanuvchiga tushunarli xabar
        let errorMessage = '❌ Xatolik yuz berdi.\n\n';
        
        if (error.code === 'ECONNREFUSED') {
          errorMessage += 'Server bilan bog\'lanib bo\'lmadi. Iltimos, biroz kutib qayta urinib ko\'ring.';
        } else if (error.response?.status === 404) {
          errorMessage += 'Bemor topilmadi. Iltimos, to\'g\'ri 8-xonali kodni kiriting.';
        } else if (error.response?.status === 400) {
          errorMessage += error.response?.data?.message || 'Noto\'g\'ri kod formati.';
        } else {
          errorMessage += 'Iltimos, qayta urinib ko\'ring yoki klinikaga murojaat qiling.';
        }
        
        await bot.sendMessage(chatId, errorMessage);
      }
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Iltimos, 8-xonali maxsus kodingizni kiriting.\n\n' +
        'Kod klinikada ro\'yxatdan o\'tganingizda berilgan.'
      );
    }
    return;
  }
  
  // Menyu tugmalari
  switch (text) {
    case '📊 Navbat':
      await handleQueue(chatId, session);
      break;
    case '💊 Retseptlar':
      await handlePrescriptions(chatId, session);
      break;
    case '🔬 Tahlillar':
      await handleLabResults(chatId, session);
      break;
    case '💰 Qarzlar':
      await handleDebts(chatId, session);
      break;
    case '📨 Xabarlar':
      await handleMessages(chatId, session);
      break;
    case '⚙️ Sozlamalar':
      await handleSettings(chatId, session);
      break;
    case '◀️ Orqaga':
      await bot.sendMessage(
        chatId,
        config.MESSAGES.uz.main_menu,
        { reply_markup: getMainMenuKeyboard() }
      );
      break;
    default:
      await bot.sendMessage(
        chatId,
        'Iltimos, menyudan tanlang:',
        { reply_markup: getMainMenuKeyboard() }
      );
  }
});

// Navbat ma'lumotlari
async function handleQueue(chatId, session) {
  try {
    await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
    
    console.log('=== QUEUE REQUEST ===');
    console.log('Patient ID:', session.patient.id || session.patient._id);
    console.log('Patient Name:', session.patient.first_name, session.patient.last_name);
    console.log('Patient Number:', session.patient.patient_number);
    
    // Bemorning navbatlarini olish
    const response = await api.get(`/bot/queue/patient/${session.patient.id || session.patient._id}`);
    
    console.log('API Response:', response.data);
    
    if (response.data.success && response.data.data.length > 0) {
      const queues = response.data.data;
      
      // Faqat kutayotgan navbatlarni filtrlash
      const waitingQueues = queues.filter(q => 
        q.status === 'WAITING' || q.status === 'waiting'
      );
      
      if (waitingQueues.length === 0) {
        // Agar kutayotgan navbat bo'lmasa, oxirgi navbatlarni ko'rsatish
        const recentQueues = queues.slice(0, 3);
        let message = '📊 *Sizning oxirgi navbatlaringiz:*\n\n';
        
        recentQueues.forEach((queue, index) => {
          let statusEmoji = '✅';
          let statusText = 'Yakunlandi';
          
          if (queue.status === 'CALLED' || queue.status === 'called') {
            statusEmoji = '🔔';
            statusText = 'Chaqirildi';
          } else if (queue.status === 'IN_PROGRESS' || queue.status === 'in_progress') {
            statusEmoji = '👨‍⚕️';
            statusText = 'Qabulda';
          } else if (queue.status === 'COMPLETED' || queue.status === 'completed') {
            statusEmoji = '✅';
            statusText = 'Yakunlandi';
          } else if (queue.status === 'CANCELLED' || queue.status === 'cancelled') {
            statusEmoji = '❌';
            statusText = 'Bekor qilindi';
          }
          
          message += `${index + 1}. ${statusEmoji} *${queue.doctor_name || 'Shifokor'}*\n`;
          message += `   📅 Sana: ${new Date(queue.created_at || queue.createdAt).toLocaleDateString('uz-UZ')}\n`;
          message += `   🕐 Vaqt: ${new Date(queue.created_at || queue.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}\n`;
          message += `   📍 Status: ${statusText}\n\n`;
        });
        
        message += '✅ Sizda hozirda kutayotgan navbat yo\'q.';
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
      }
      
      // Kutayotgan navbatlarni ko'rsatish
      let message = '📊 *Sizning navbatlaringiz:*\n\n';
      
      for (const queue of waitingQueues) {
        message += `👨‍⚕️ *${queue.doctor_name || 'Shifokor'}*\n`;
        message += `📅 Sana: ${new Date(queue.created_at || queue.createdAt).toLocaleDateString('uz-UZ')}\n`;
        message += `🕐 Vaqt: ${new Date(queue.created_at || queue.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}\n`;
        
        // Navbat pozitsiyasi
        const position = queue.queue_number || 1;
        if (position === 1) {
          message += `\n🔥 *Sizning navbatingiz keldi!*\n`;
          message += `🔢 Navbat: *${position}*\n`;
          message += `⏰ Iltimos, qabul xonasiga kiring!\n`;
        } else {
          message += `\n⏰ *Kutilmoqda*\n`;
          message += `🔢 Sizning navbatingiz: *${position}*\n`;
          const beforeYou = position - 1;
          message += `👥 Sizdan oldin: *${beforeYou}* ta bemor\n`;
        }
        
        // Shikoyat yoki izoh
        if (queue.notes) {
          message += `💬 Izoh: ${queue.notes}\n`;
        }
        
        message += '\n';
      }
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '📊 Sizda hozircha navbat yo\'q.');
    }
  } catch (error) {
    console.error('Error fetching queue:', error);
    console.error('Error details:', error.response?.data || error.message);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
}

// Retseptlar
async function handlePrescriptions(chatId, session) {
  try {
    await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
    
    const response = await api.get(`/bot/prescriptions/patient/${session.patient.id}`);
    
    if (response.data.success && response.data.data.length > 0) {
      const prescriptions = response.data.data;
      let message = '💊 *Sizning retseptlaringiz:*\n\n';
      
      // Barcha retseptlarni ko'rsatish (limit 10)
      prescriptions.slice(0, 10).forEach((prescription, index) => {
        // Shifokor ismi
        const doctorName = prescription.doctor_first_name && prescription.doctor_last_name 
          ? `${prescription.doctor_first_name} ${prescription.doctor_last_name}`
          : 'Shifokor';
        
        message += `${index + 1}. 👨‍⚕️ *${doctorName}*\n`;
        message += `   📅 ${new Date(prescription.created_at).toLocaleDateString('uz-UZ')}\n`;
        
        // Retsept turi
        const prescriptionType = prescription.prescription_type === 'URGENT' ? '🚨 Shoshilinch' : '📋 Oddiy';
        message += `   ${prescriptionType}\n`;
        
        // Tashxis
        if (prescription.diagnosis) {
          message += `   📝 ${prescription.diagnosis}\n`;
        }
        
        // Dorilar
        if (prescription.medications && prescription.medications.length > 0) {
          message += '\n   💊 *Dorilar:*\n';
          prescription.medications.forEach(med => {
            message += `   • ${med.medication_name || 'Dori'}\n`;
            
            // Doza
            if (med.dosage) {
              message += `     💉 Doza: ${med.dosage}\n`;
            }
            
            // Qabul qilish muddati (kunlar)
            if (med.duration_days) {
              message += `     📆 Muddat: ${med.duration_days} kun\n`;
            }
            
            // Qabul qilish tartibi
            if (med.frequency) {
              message += `     🕐 Qabul: ${med.frequency}\n`;
            }
            
            // Izoh
            if (med.instructions) {
              message += `     ℹ️ ${med.instructions}\n`;
            }
          });
        }
        message += '\n';
      });
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '💊 Sizda hozircha retsept yo\'q.');
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
}

// Tahlil natijalari
async function handleLabResults(chatId, session) {
  try {
    await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
    
    const response = await api.get(`/bot/patients/${session.patient.id}/full`);
    
    if (response.data.success && response.data.data.labOrders && response.data.data.labOrders.length > 0) {
      const labOrders = response.data.data.labOrders;
      let message = '🔬 *Sizning tahlillaringiz:*\n\n';
      
      // Barcha tahlillarni ko'rsatish (limit 10)
      labOrders.slice(0, 10).forEach((order, index) => {
        // Status emoji
        let statusEmoji = '⏰';
        let statusText = 'Kutilmoqda';
        
        if (order.status === 'pending') {
          statusEmoji = '⏰';
          statusText = 'Kutilmoqda';
        } else if (order.status === 'sample_collected') {
          statusEmoji = '🧪';
          statusText = 'Namuna olindi';
        } else if (order.status === 'in_progress') {
          statusEmoji = '⏳';
          statusText = 'Jarayonda';
        } else if (order.status === 'ready') {
          statusEmoji = '✅';
          statusText = 'Tayyor';
        } else if (order.status === 'delivered') {
          statusEmoji = '📋';
          statusText = 'Topshirildi';
        }
        
        message += `${index + 1}. ${statusEmoji} *${order.test_name || 'Tahlil'}*\n`;
        message += `   📅 ${new Date(order.order_date || order.createdAt).toLocaleDateString('uz-UZ')}\n`;
        message += `   📍 Status: ${statusText}\n`;
        
        if (order.test_price) {
          message += `   💰 ${order.test_price.toLocaleString()} so'm\n`;
        }
        
        // Natija tayyor bo'lsa
        if (order.status === 'ready' && order.results) {
          message += `   📊 Natija: ${order.results}\n`;
        }
        
        message += '\n';
      });
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '🔬 Sizda hozircha tahlil yo\'q.');
    }
  } catch (error) {
    console.error('Error fetching lab results:', error);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
}

// Qarzlar
async function handleDebts(chatId, session) {
  try {
    await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
    
    const response = await api.get(`/bot/patients/${session.patient.id}/full`);
    
    if (response.data.success && response.data.data.patient) {
      const patient = response.data.data.patient;
      const balance = patient.current_balance || 0;
      
      let message = '💰 *Moliyaviy ma\'lumotlar:*\n\n';
      
      if (balance >= 0) {
        message += `✅ Sizda qarz yo'q\n`;
        message += `💵 Balans: +${balance.toLocaleString()} so'm`;
      } else {
        message += `⚠️ Sizda qarz bor\n`;
        message += `💵 Qarz: ${Math.abs(balance).toLocaleString()} so'm`;
      }
      
      // Hisob-fakturalar
      if (response.data.data.invoices && response.data.data.invoices.length > 0) {
        message += '\n\n📋 *Hisob-fakturalar:*\n\n';
        
        response.data.data.invoices.slice(0, 3).forEach((invoice, index) => {
          message += `${index + 1}. ${invoice.invoice_number || 'INV-' + invoice.id.slice(0, 8)}\n`;
          message += `   💰 ${invoice.total_amount.toLocaleString()} so'm\n`;
          message += `   📍 ${invoice.payment_status === 'paid' ? '✅ To\'langan' : invoice.payment_status === 'partial' ? '⏳ Qisman' : '❌ To\'lanmagan'}\n\n`;
        });
      }
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, config.MESSAGES.uz.error);
    }
  } catch (error) {
    console.error('Error fetching debts:', error);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
}

// Sozlamalar
async function handleSettings(chatId, session) {
  const message = `⚙️ *Sozlamalar*\n\n` +
    `👤 Ism: ${session.patient.first_name} ${session.patient.last_name}\n` +
    `📱 Telefon: ${session.phone}\n` +
    `🆔 Bemor raqami: ${session.patient.patient_number}\n` +
    `🔢 Maxsus kod: ${session.patient.access_code || 'Yo\'q'}\n\n` +
    `Sozlamalarni o'zgartirish uchun klinikaga murojaat qiling.`;
  
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Xabarlar
async function handleMessages(chatId, session) {
  try {
    await bot.sendMessage(chatId, config.MESSAGES.uz.loading);
    
    const response = await api.get(`/bot/messages/patient/${session.patient.id}`);
    
    if (response.data.success && response.data.data.length > 0) {
      const messages = response.data.data;
      let message = '📨 *Sizga yuborilgan xabarlar:*\n\n';
      
      messages.slice(0, 10).forEach((msg, index) => {
        message += `${index + 1}. 📅 ${new Date(msg.created_at).toLocaleDateString('uz-UZ')} ${new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}\n`;
        
        // Mavzu
        if (msg.subject) {
          message += `   📌 ${msg.subject}\n`;
        }
        
        // Xabar matni
        if (msg.content) {
          message += `   💬 ${msg.content}\n`;
        }
        
        // Yuboruvchi
        if (msg.sender_name) {
          message += `   👤 ${msg.sender_name}`;
          if (msg.sender_role) {
            message += ` (${msg.sender_role})`;
          }
          message += '\n';
        }
        
        // Status
        const statusEmoji = msg.status === 'read' ? '✅' : '📬';
        message += `   ${statusEmoji} ${msg.status === 'read' ? 'O\'qilgan' : 'Yangi'}\n\n`;
      });
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '📨 Sizga hozircha xabar yuborilmagan.');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    await bot.sendMessage(chatId, config.MESSAGES.uz.error);
  }
}

// Xatoliklarni ushlash
bot.on('polling_error', (error) => {
  // Ignore "bot was blocked by the user" errors - this is normal
  if (error.response && error.response.body && error.response.body.error_code === 403) {
    console.log('⚠️ Bot was blocked by a user (this is normal, ignoring)');
    return;
  }
  
  // Log other errors
  console.error('❌ Polling error:', error.message || error);
});

// Inline tugmalar uchun callback query handler
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = userSessions.get(chatId);
  
  // Tugma bosilganini tasdiqlash
  await bot.answerCallbackQuery(query.id);
  
  if (!session || !session.patient) {
    await bot.sendMessage(chatId, '❌ Iltimos, avval 8-xonali kodingizni kiriting.');
    return;
  }
  
  // Ma'lumotlarni ko'rsatish
  switch (data) {
    case 'info_queue':
      await handleQueue(chatId, session);
      break;
    case 'info_prescriptions':
      await handlePrescriptions(chatId, session);
      break;
    case 'info_lab':
      await handleLabResults(chatId, session);
      break;
    case 'info_debts':
      await handleDebts(chatId, session);
      break;
    case 'info_messages':
      await handleMessages(chatId, session);
      break;
    default:
      await bot.sendMessage(chatId, 'Noma\'lum buyruq');
  }
});

// Handle uncaught errors to prevent bot from crashing
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message || error);
  // Don't exit, keep bot running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit, keep bot running
});

console.log('🤖 Telegram bot ishga tushdi!');

export default bot;
