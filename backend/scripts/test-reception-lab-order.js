/**
 * Reception Lab Order Test
 * Reception role bilan laboratoriya buyurtma yaratish testini tekshiradi
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5001/api/v1';

// Ranglar
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logTitle(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

let authToken = '';
let testPatientId = '';
let testTestId = '';

// Test
async function runTest() {
  logTitle('RECEPTION LAB ORDER TEST');
  
  logInfo(`API URL: ${API_URL}`);
  logInfo(`Vaqt: ${new Date().toLocaleString('uz-UZ')}\n`);

  try {
    // 1. Login as reception
    logInfo('Test 1: Reception sifatida login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: 'reception',
        password: 'reception123'
      });
      
      authToken = loginResponse.data.accessToken || loginResponse.data.token;
      logSuccess('Login muvaffaqiyatli');
      logInfo(`User: ${loginResponse.data.user.username}`);
      logInfo(`Role: ${loginResponse.data.user.role_name}`);
      console.log('Full user data:', JSON.stringify(loginResponse.data.user, null, 2));
    } catch (error) {
      logError(`Login xatosi: ${error.response?.data?.message || error.message}`);
      logInfo('Reception user mavjud emasligini tekshiring');
      return;
    }

    // 2. Get patients
    logInfo('\nTest 2: Bemorlarni olish...');
    const patientsRes = await axios.get(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (patientsRes.data.data && patientsRes.data.data.length > 0) {
      testPatientId = patientsRes.data.data[0].id;
      logSuccess(`Bemorlar topildi: ${patientsRes.data.data.length} ta`);
      logInfo(`Test bemor: ${patientsRes.data.data[0].first_name} ${patientsRes.data.data[0].last_name}`);
    } else {
      logError('Bemorlar topilmadi');
      return;
    }

    // 3. Get tests
    logInfo('\nTest 3: Tahlillarni olish...');
    const testsRes = await axios.get(`${API_URL}/laboratory/tests`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { is_active: true }
    });
    
    if (testsRes.data.data && testsRes.data.data.length > 0) {
      testTestId = testsRes.data.data[0].id;
      logSuccess(`Tahlillar topildi: ${testsRes.data.data.length} ta`);
      logInfo(`Test tahlil: ${testsRes.data.data[0].name} - ${testsRes.data.data[0].price} so'm`);
    } else {
      logError('Tahlillar topilmadi');
      return;
    }

    // 4. Create order
    logInfo('\nTest 4: Buyurtma yaratish (reception role)...');
    const orderData = {
      patient_id: testPatientId,
      test_id: testTestId,
      priority: 'normal',
      notes: 'Test buyurtma - reception tomonidan'
    };
    
    logInfo(`Buyurtma ma'lumotlari: ${JSON.stringify(orderData, null, 2)}`);
    
    try {
      const orderRes = await axios.post(`${API_URL}/laboratory/orders`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      logSuccess('Buyurtma muvaffaqiyatli yaratildi!');
      logInfo(`Buyurtma ID: ${orderRes.data.data.id}`);
      logInfo(`Buyurtma raqami: ${orderRes.data.data.order_number}`);
      if (orderRes.data.data.invoice_number) {
        logInfo(`Hisob-faktura: ${orderRes.data.data.invoice_number}`);
      }
    } catch (error) {
      logError(`Buyurtma yaratish xatosi: ${error.response?.data?.message || error.message}`);
      if (error.response?.status === 403) {
        logError('403 Forbidden - Reception role ruxsati yo\'q!');
      }
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      return;
    }

    // 5. Get orders
    logInfo('\nTest 5: Buyurtmalarni olish...');
    const ordersRes = await axios.get(`${API_URL}/laboratory/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess(`Buyurtmalar topildi: ${ordersRes.data.data.length} ta`);

    logTitle('✅ BARCHA TESTLAR MUVAFFAQIYATLI!');

  } catch (error) {
    logError(`Umumiy xato: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

runTest();
