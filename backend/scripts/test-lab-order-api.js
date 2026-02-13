/**
 * Laboratoriya Buyurtma API Test
 * Bu fayl laboratoriya buyurtma yaratish API'sini test qiladi
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5001/api/v1';

// Test ma'lumotlari
let authToken = '';
let testPatientId = '';
let testDoctorId = '';
let testTestId = '';
let testOrderId = '';

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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 1. Login qilish
async function testLogin() {
  try {
    logInfo('Test 1: Login qilish...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    console.log('Login response:', response.data); // Debug

    if (response.data.success && (response.data.token || response.data.accessToken)) {
      authToken = response.data.token || response.data.accessToken;
      logSuccess('Login muvaffaqiyatli');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else if (response.data.accessToken) {
      // accessToken field bilan
      authToken = response.data.accessToken;
      logSuccess('Login muvaffaqiyatli');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login muvaffaqiyatsiz - token topilmadi');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    logError(`Login xatosi: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('Error response:', error.response.data);
    }
    return false;
  }
}

// 2. Bemorlarni olish
async function testGetPatients() {
  try {
    logInfo('Test 2: Bemorlarni olish...');
    
    const response = await axios.get(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      testPatientId = response.data.data[0].id;
      logSuccess(`Bemorlar topildi: ${response.data.data.length} ta`);
      logInfo(`Test bemor ID: ${testPatientId}`);
      logInfo(`Bemor: ${response.data.data[0].first_name} ${response.data.data[0].last_name}`);
      return true;
    } else {
      logWarning('Bemorlar topilmadi');
      return false;
    }
  } catch (error) {
    logError(`Bemorlarni olish xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 3. Xodimlarni olish (Laborantlar)
async function testGetStaff() {
  try {
    logInfo('Test 3: Xodimlarni olish...');
    
    const response = await axios.get(`${API_URL}/staff`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.data) {
      const staff = response.data.data;
      const laborants = staff.filter(s => 
        s.role_name === 'laborant' || 
        s.role_name === 'Laborant' ||
        (s.role && (s.role.name === 'laborant' || s.role.name === 'Laborant'))
      );
      
      if (laborants.length > 0) {
        testDoctorId = laborants[0].id;
        logSuccess(`Laborantlar topildi: ${laborants.length} ta`);
        logInfo(`Test laborant ID: ${testDoctorId}`);
        logInfo(`Laborant: ${laborants[0].first_name} ${laborants[0].last_name}`);
        return true;
      } else {
        logWarning('Laborantlar topilmadi');
        return true; // Ixtiyoriy
      }
    } else {
      logWarning('Xodimlar topilmadi');
      return true;
    }
  } catch (error) {
    logError(`Xodimlarni olish xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 4. Tahlillarni olish
async function testGetTests() {
  try {
    logInfo('Test 4: Tahlillarni olish...');
    
    const response = await axios.get(`${API_URL}/laboratory/tests`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { is_active: true }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      testTestId = response.data.data[0].id;
      logSuccess(`Tahlillar topildi: ${response.data.data.length} ta`);
      logInfo(`Test tahlil ID: ${testTestId}`);
      logInfo(`Tahlil: ${response.data.data[0].name} - ${response.data.data[0].price} so'm`);
      return true;
    } else {
      logError('Tahlillar topilmadi - buyurtma yaratish uchun tahlil kerak!');
      return false;
    }
  } catch (error) {
    logError(`Tahlillarni olish xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 5. Buyurtma yaratish
async function testCreateOrder() {
  try {
    logInfo('Test 5: Buyurtma yaratish...');
    
    const orderData = {
      patient_id: testPatientId,
      doctor_id: testDoctorId || null,
      test_id: testTestId,
      priority: 'normal',
      notes: 'Test buyurtma - avtomatik test'
    };

    logInfo(`Buyurtma ma'lumotlari: ${JSON.stringify(orderData, null, 2)}`);

    const response = await axios.post(`${API_URL}/laboratory/orders`, orderData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.success) {
      testOrderId = response.data.data.id;
      logSuccess('Buyurtma muvaffaqiyatli yaratildi!');
      logInfo(`Buyurtma ID: ${testOrderId}`);
      logInfo(`Buyurtma raqami: ${response.data.data.order_number}`);
      if (response.data.data.invoice_number) {
        logInfo(`Hisob-faktura: ${response.data.data.invoice_number}`);
      }
      return true;
    } else {
      logError('Buyurtma yaratish muvaffaqiyatsiz');
      return false;
    }
  } catch (error) {
    logError(`Buyurtma yaratish xatosi: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.details) {
      logError(`Tafsilotlar: ${JSON.stringify(error.response.data.details)}`);
    }
    return false;
  }
}

// 6. Buyurtmalarni olish
async function testGetOrders() {
  try {
    logInfo('Test 6: Buyurtmalarni olish...');
    
    const response = await axios.get(`${API_URL}/laboratory/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.data) {
      logSuccess(`Buyurtmalar topildi: ${response.data.data.length} ta`);
      
      // Yangi yaratilgan buyurtmani topish
      const newOrder = response.data.data.find(o => o.id === testOrderId);
      if (newOrder) {
        logSuccess('Yangi yaratilgan buyurtma ro\'yxatda topildi!');
        logInfo(`Status: ${newOrder.status}`);
        logInfo(`Bemor: ${newOrder.patient_name}`);
        logInfo(`Tahlil: ${newOrder.test_name}`);
      } else {
        logWarning('Yangi buyurtma ro\'yxatda topilmadi');
      }
      return true;
    } else {
      logWarning('Buyurtmalar topilmadi');
      return false;
    }
  } catch (error) {
    logError(`Buyurtmalarni olish xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 7. Statistikani olish
async function testGetStats() {
  try {
    logInfo('Test 7: Statistikani olish...');
    
    const response = await axios.get(`${API_URL}/laboratory/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.data) {
      const stats = response.data.data;
      logSuccess('Statistika olindi!');
      logInfo(`Jami buyurtmalar: ${stats.total_orders || 0}`);
      logInfo(`Kutilmoqda: ${stats.pending_orders || 0}`);
      logInfo(`Jarayonda: ${stats.in_progress_orders || 0}`);
      logInfo(`Bugun tayyor: ${stats.completed_today || 0}`);
      return true;
    } else {
      logWarning('Statistika topilmadi');
      return false;
    }
  } catch (error) {
    logError(`Statistikani olish xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Barcha testlarni ishga tushirish
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('LABORATORIYA BUYURTMA API TESTLARI', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  logInfo(`API URL: ${API_URL}`);
  logInfo(`Vaqt: ${new Date().toLocaleString('uz-UZ')}\n`);

  const tests = [
    { name: 'Login', fn: testLogin, required: true },
    { name: 'Bemorlarni olish', fn: testGetPatients, required: true },
    { name: 'Xodimlarni olish', fn: testGetStaff, required: false },
    { name: 'Tahlillarni olish', fn: testGetTests, required: true },
    { name: 'Buyurtma yaratish', fn: testCreateOrder, required: true },
    { name: 'Buyurtmalarni olish', fn: testGetOrders, required: true },
    { name: 'Statistikani olish', fn: testGetStats, required: false }
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        if (test.required) {
          failed++;
          logError(`Majburiy test muvaffaqiyatsiz: ${test.name}`);
          break; // Majburiy test muvaffaqiyatsiz bo'lsa, to'xtatamiz
        } else {
          skipped++;
          logWarning(`Ixtiyoriy test o'tkazib yuborildi: ${test.name}`);
        }
      }
    } catch (error) {
      failed++;
      logError(`Test xatosi: ${test.name} - ${error.message}`);
      if (test.required) {
        break;
      }
    }
    console.log(''); // Bo'sh qator
  }

  // Natijalar
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST NATIJALARI', 'cyan');
  log('='.repeat(60), 'cyan');
  logSuccess(`Muvaffaqiyatli: ${passed}`);
  if (failed > 0) {
    logError(`Muvaffaqiyatsiz: ${failed}`);
  }
  if (skipped > 0) {
    logWarning(`O'tkazib yuborildi: ${skipped}`);
  }
  log(`Jami: ${tests.length}`, 'blue');
  
  if (failed === 0) {
    log('\n🎉 BARCHA TESTLAR MUVAFFAQIYATLI O\'TDI! 🎉\n', 'green');
  } else {
    log('\n❌ BA\'ZI TESTLAR MUVAFFAQIYATSIZ ❌\n', 'red');
  }
}

// Testlarni ishga tushirish
runAllTests().catch(error => {
  logError(`Umumiy xato: ${error.message}`);
  process.exit(1);
});
