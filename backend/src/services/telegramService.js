import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

/**
 * Send message to Telegram user
 */
export async function sendTelegramMessage(chatId, message, options = {}) {
  try {
    if (!chatId) {
      console.log('⚠️ No chat ID provided, skipping Telegram notification');
      return { success: false, message: 'No chat ID' };
    }

    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    });

    console.log('✅ Telegram message sent to chat ID:', chatId);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.response?.data || error.message);
    return { success: false, error: error.message };
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

export default {
  sendTelegramMessage,
  sendTaskNotification
};
