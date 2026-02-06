import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '8551375038:AAFXDSS0IwrsZsqCIC2_oXXZwVZZWgqSdD4';

async function deleteWebhook() {
  try {
    console.log('🗑️  Deleting webhook...');
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
    console.log('✅ Webhook deleted:', response.data);
    
    // Get webhook info to confirm
    const infoResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    console.log('📊 Current webhook info:', infoResponse.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteWebhook();
