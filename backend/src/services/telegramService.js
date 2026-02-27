import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'

const BOT_TOKEN = process.env.BOT_TOKEN
const TELEGRAM_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

/**
 * Send message to Telegram user
 */
export async function sendTelegramMessage(chatId, message, options = {}) {
  try {
    if (!TELEGRAM_API) return { success: false, message: 'BOT_TOKEN not configured' };
    if (!chatId) {
      return { success: false, message: 'No chat ID' };
    }

    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    });

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to send telegram message' };
  }
}

/**
 * Send task notification to staff
 */
export async function sendTaskNotification(staff, task, creator) {
  try {
    if (!staff.telegram_chat_id) {
      console.log(`⚠️ Staff ${staff.first_name} ${staff.last_name} has no Telegram chat ID`);
      return { success: false, message: 'No Telegram chat ID' };
    }

    const priorityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      urgent: '🚨'
    };

    const taskTypeNames = {
      cleaning: 'Tozalash',
      maintenance: 'Ta\'mirlash',
      delivery: 'Yetkazib berish',
      inspection: 'Tekshirish',
      other: 'Boshqa'
    };

    const message = `
🔔 *Yangi vazifa tayinlandi!*

📋 *Vazifa:* ${task.title}
${task.description ? `📝 *Tavsif:* ${task.description}\n` : ''}
${priorityEmoji[task.priority] || '⚪'} *Muhimlik:* ${task.priority === 'low' ? 'Past' : task.priority === 'medium' ? 'O\'rta' : task.priority === 'high' ? 'Yuqori' : 'Juda muhim'}
🏷️ *Turi:* ${taskTypeNames[task.task_type] || task.task_type}
${task.due_date ? `⏰ *Muddat:* ${new Date(task.due_date).toLocaleString('uz-UZ')}\n` : ''}
${task.location_details ? `📍 *Manzil:* ${task.location_details}\n` : ''}
👤 *Tayinlagan:* ${creator.first_name} ${creator.last_name}

💡 Vazifani ko'rish uchun botda "📋 Vazifalar" tugmasini bosing!
    `.trim();

    return await sendTelegramMessage(staff.telegram_chat_id, message);
  } catch (error) {
    console.error('Error sending task notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send document (PDF) to Telegram user
 */
export async function sendTelegramDocument(chatId, filePath, caption = '') {
  try {
    if (!TELEGRAM_API) return { success: false, message: 'BOT_TOKEN not configured' }
    if (!chatId) return { success: false, message: 'No chat ID' }
    if (!fs.existsSync(filePath)) return { success: false, message: 'File not found' }

    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('document', fs.createReadStream(filePath))
    if (caption) {
      form.append('caption', caption)
      form.append('parse_mode', 'Markdown')
    }

    const response = await axios.post(`${TELEGRAM_API}/sendDocument`, form, {
      headers: form.getHeaders()
    })

    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: 'Failed to send telegram document' }
  }
}

/**
 * Send lab result notification to patient
 */
export async function sendLabResultNotification(patient, testName, pdfPath = null) {
  try {
    if (!patient?.telegram_chat_id) return { success: false, message: 'No chat ID' }

    const message = `
🔬 *Tahlil natijasi tayyor!*

👤 *Bemor:* ${patient.first_name} ${patient.last_name}
🧪 *Tahlil:* ${testName}
📅 *Sana:* ${new Date().toLocaleDateString('uz-UZ')}

✅ Natijangiz tayyor. Klinikaga murojaat qiling yoki botda ko'ring.
    `.trim()

    await sendTelegramMessage(patient.telegram_chat_id, message)

    if (pdfPath) {
      await sendTelegramDocument(patient.telegram_chat_id, pdfPath, `📄 ${testName} natijasi`)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Send critical lab alert to doctor
 */
export async function sendCriticalLabAlert(doctor, orderData, criticalValues) {
  try {
    if (!doctor?.telegram_chat_id) return { success: false, message: 'No chat ID' }

    const criticalList = criticalValues.map(cv => {
      const arrow = cv.critical_type === 'high' ? '⬆️ YUQORI' : '⬇️ PAST'
      return `  • *${cv.parameter_name}:* ${cv.value} — ${arrow}`
    }).join('\n')

    const message = `
🚨 *CRITICAL LAB ALERT!*

👤 *Bemor:* ${orderData.patient_name}
🧪 *Tahlil:* ${orderData.test_name}
📋 *Buyurtma:* ${orderData.order_number}

⚠️ *Kritik qiymatlar:*
${criticalList}

🔴 Zudlik bilan tekshiring!
    `.trim()

    return await sendTelegramMessage(doctor.telegram_chat_id, message)
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export default {
  sendTelegramMessage,
  sendTaskNotification,
  sendTelegramDocument,
  sendLabResultNotification,
  sendCriticalLabAlert
}
