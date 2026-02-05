import axios from 'axios';
import Patient from '../models/Patient.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8551375038:AAFXDSS0IwrsZsqCIC2_oXXZwVZZWgqSdD4';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Telegram orqali xabar yuborish
 */
export async function sendTelegramMessage(chatId, message, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Telegram send message error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message
    };
  }
}

/**
 * Navbat chaqiruvi haqida xabarnoma
 */
export async function sendQueueCallNotification(patientId, queueNumber, doctorName, roomNumber) {
  try {
    // Bemorning telegram ma'lumotlarini olish
    const patient = await Patient.findById(patientId).select('telegram_chat_id telegram_notifications_enabled first_name');
    
    if (!patient) {
      return { success: false, error: 'Bemor topilmadi' };
    }
    
    if (!patient.telegram_chat_id) {
      return { success: false, error: 'Bemor Telegram\'ga ulanmagan' };
    }
    
    if (!patient.telegram_notifications_enabled) {
      return { success: false, error: 'Bemor xabarnomalarni o\'chirgan' };
    }
    
    const message = `
🔔 *Navbat chaqiruvi*

Hurmatli ${patient.first_name}!

Sizning navbatingiz keldi.

📋 Navbat raqami: *${queueNumber}*
👨‍⚕️ Shifokor: *${doctorName}*
🚪 Xona: *${roomNumber}*

Iltimos, ko'rikka kiring.
    `.trim();
    
    const result = await sendTelegramMessage(patient.telegram_chat_id, message);
    
    // Xabarnoma tarixini saqlash (hozircha log qilamiz)
    console.log('Queue call notification sent:', {
      patient_id: patientId,
      chat_id: patient.telegram_chat_id,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null
    });
    
    return result;
  } catch (error) {
    console.error('Send queue call notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Retsept tayyor bo'lganligi haqida xabarnoma
 */
export async function sendPrescriptionNotification(patientId, prescriptionId) {
  try {
    const patient = await Patient.findById(patientId).select('telegram_chat_id telegram_notifications_enabled first_name');
    
    if (!patient || !patient.telegram_chat_id || !patient.telegram_notifications_enabled) {
      return { success: false, error: 'Telegram xabarnoma yuborib bo\'lmadi' };
    }
    
    const message = `
💊 *Retsept tayyor*

Hurmatli ${patient.first_name}!

Sizning retseptingiz tayyor.

📄 Retsept ID: *${prescriptionId}*

Dorixonadan dori olishingiz mumkin.
    `.trim();
    
    const result = await sendTelegramMessage(patient.telegram_chat_id, message);
    
    console.log('Prescription notification sent:', {
      patient_id: patientId,
      status: result.success ? 'sent' : 'failed'
    });
    
    return result;
  } catch (error) {
    console.error('Send prescription notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Tahlil natijasi tayyor bo'lganligi haqida xabarnoma
 */
export async function sendLabResultNotification(patientId, testName) {
  try {
    const patient = await Patient.findById(patientId).select('telegram_chat_id telegram_notifications_enabled first_name');
    
    if (!patient || !patient.telegram_chat_id || !patient.telegram_notifications_enabled) {
      return { success: false, error: 'Telegram xabarnoma yuborib bo\'lmadi' };
    }
    
    const message = `
🔬 *Tahlil natijasi tayyor*

Hurmatli ${patient.first_name}!

Sizning tahlil natijangiz tayyor.

📊 Tahlil: *${testName}*

Natijani ko'rish uchun klinikaga tashrif buyuring yoki bemor portaliga kiring.
    `.trim();
    
    const result = await sendTelegramMessage(patient.telegram_chat_id, message);
    
    console.log('Lab result notification sent:', {
      patient_id: patientId,
      status: result.success ? 'sent' : 'failed'
    });
    
    return result;
  } catch (error) {
    console.error('Send lab result notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Qarz haqida xabarnoma
 */
export async function sendDebtNotification(patientId, amount, description) {
  try {
    const patient = await Patient.findById(patientId).select('telegram_chat_id telegram_notifications_enabled first_name');
    
    if (!patient || !patient.telegram_chat_id || !patient.telegram_notifications_enabled) {
      return { success: false, error: 'Telegram xabarnoma yuborib bo\'lmadi' };
    }
    
    const message = `
💰 *Qarz haqida eslatma*

Hurmatli ${patient.first_name}!

Sizda to'lanmagan qarz bor.

💵 Summa: *${amount.toLocaleString()} so'm*
📝 Tavsif: ${description}

Iltimos, qarzni to'lang.
    `.trim();
    
    const result = await sendTelegramMessage(patient.telegram_chat_id, message);
    
    console.log('Debt notification sent:', {
      patient_id: patientId,
      amount,
      status: result.success ? 'sent' : 'failed'
    });
    
    return result;
  } catch (error) {
    console.error('Send debt notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Umumiy xabar yuborish
 */
export async function sendGeneralMessage(patientId, messageText) {
  try {
    const patient = await Patient.findById(patientId).select('telegram_chat_id telegram_notifications_enabled first_name');
    
    if (!patient || !patient.telegram_chat_id || !patient.telegram_notifications_enabled) {
      return { success: false, error: 'Telegram xabarnoma yuborib bo\'lmadi' };
    }
    
    const result = await sendTelegramMessage(patient.telegram_chat_id, messageText);
    
    console.log('General message sent:', {
      patient_id: patientId,
      status: result.success ? 'sent' : 'failed'
    });
    
    return result;
  } catch (error) {
    console.error('Send general message error:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendTelegramMessage,
  sendQueueCallNotification,
  sendPrescriptionNotification,
  sendLabResultNotification,
  sendDebtNotification,
  sendGeneralMessage
};
