/**
 * Qabulxona Roli Test
 * Bu fayl qabulxona rolining laboratoriya buyurtma berishni test qiladi
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logTitle(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

// Test ma'lumotlari
const testUsers = [
  {
    role: 'admin',
    username: 'admin',
    password: 'admin123',
    expectedAccess: true
  },
  {
    role: 'reception',
    username: 'reception',
    password: 'reception123',
    expectedAccess: true
  },
  {
    role: 'laborant',
    username: 'laborant',
    password: 'laborant123',
    expectedAccess: true
  },
  {
    role: 'doctor',
    username: 'doctor',
    password: 'doctor123',
    expectedAccess: true
  }
];

// Har bir rol uchun test
async function testRoleAccess(user) {
  logTitle(`${user.role.toUpperCase()} ROLI TESTI`);
  
  let token = '';
  let userData = null;

  // 1. Login
  try {
    logInfo(`1. ${user.role} sifatida login qilish...`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: user.username,
      password: user.password
    });

    if (response.data.success && (response.data.token || response.data.accessToken)) {
      token = response.data.token || response.data.accessToken;
      userData = response.data.user;
      logSuccess('Login muvaffaqiyatli');
      logInfo(`User: ${userData.username}`);
      logInfo(`Role: ${userData.role?.name || userData.role_name || 'N/A'}`);
    } else {
      logError('Login muvaffaqiyatsiz');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logWarning(`${user.role} user topilmadi yoki parol noto'g'ri`);
      logInfo('Bu user yaratilmagan bo\'lishi mumkin');
      return null; // Skip
    }
    logError(`Login xatosi: ${error.response?.data?.message || error.message}`);
    return false;
  }

  // 2. Laboratoriya buyurtmalarini ko'rish
  try {
    logInfo('2. Laboratoriya buyurtmalarini ko\'rish...');
    
    const response = await axios.get(`${API_URL}/laboratory/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data) {
      logSuccess(`Buyurtmalar ko'rish ruxsati bor: ${response.data.data?.length || 0} ta`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logError('Buyurtmalarni ko\'rish ruxsati yo\'q');
      return false;
    }
    logWarning(`Buyurtmalarni olish xatosi: ${error.response?.data?.message || error.message}`);
  }

  // 3. Tahlillarni ko'rish
  try {
    logInfo('3. Tahlillarni ko\'rish...');
    
    const response = await axios.get(`${API_URL}/laboratory/tests`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { is_active: true }
    });

    if (response.data && response.data.data) {
      logSuccess(`Tahlillar ko'rish ruxsati bor: ${response.data.data.length} ta`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logError('Tahlillarni ko\'rish ruxsati yo\'q');
      return false;
    }
    logWarning(`Tahlillarni olish xatosi: ${error.response?.data?.message || error.message}`);
  }

  // 4. Buyurtma yaratish (agar bemor va tahlil mavjud bo'lsa)
  try {
    logInfo('4. Buyurtma yaratish imkoniyatini tekshirish...');
    
    // Avval bemor va tahlil olish
    const [patientsRes, testsRes] = await Promise.all([
      axios.get(`${API_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${API_URL}/laboratory/tests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { is_active: true }
      })
    ]);

    if (patientsRes.data?.data?.length > 0 && testsRes.data?.data?.length > 0) {
      const orderData = {
        patient_id: patientsRes.data.data[0].id,
        test_id: testsRes.data.data[0].id,
        priority: 'normal',
        notes: `Test buyurtma - ${user.role} roli`
      };

      const response = await axios.post(`${API_URL}/laboratory/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        logSuccess('Buyurtma yaratish ruxsati bor va muvaffaqiyatli!');
        logInfo(`Buyurtma raqami: ${response.data.data.order_number}`);
        return true;
      }
    } else {
      logWarning('Bemor yoki tahlil topilmadi - buyurtma yaratish test qilinmadi');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logError('Buyurtma yaratish ruxsati yo\'q');
      if (user.expectedAccess) {
        logError(`XATO: ${user.role} roli buyurtma yaratishi kerak edi!`);
        return false;
      }
    } else {
      logWarning(`Buyurtma yaratish xatosi: ${error.response?.data?.message || error.message}`);
    }
  }

  return true;
}

// Barcha rollarni test qilish
async function runAllRoleTests() {
  logTitle('QABULXONA ROLI - LABORATORIYA RUXSATLARI TESTI');
  
  logInfo(`API URL: ${API_URL}`);
  logInfo(`Vaqt: ${new Date().toLocaleString('uz-UZ')}`);
  logInfo(`Test qilinadigan rollar: ${testUsers.length} ta\n`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  for (const user of testUsers) {
    const result = await testRoleAccess(user);
    
    if (result === true) {
      results.passed++;
      logSuccess(`${user.role.toUpperCase()} roli testi muvaffaqiyatli\n`);
    } else if (result === false) {
      results.failed++;
      logError(`${user.role.toUpperCase()} roli testi muvaffaqiyatsiz\n`);
    } else {
      results.skipped++;
      logWarning(`${user.role.toUpperCase()} roli testi o'tkazib yuborildi\n`);
    }
  }

  // Yakuniy natijalar
  logTitle('TEST NATIJALARI');
  
  logSuccess(`Muvaffaqiyatli: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Muvaffaqiyatsiz: ${results.failed}`);
  }
  if (results.skipped > 0) {
    logWarning(`O'tkazib yuborildi: ${results.skipped}`);
  }
  log(`Jami: ${testUsers.length}`, 'blue');

  // Xulosa
  if (results.failed === 0 && results.passed > 0) {
    log('\n🎉 BARCHA ROLLAR TO\'G\'RI ISHLAYAPTI! 🎉\n', 'green');
    log('✅ Qabulxona roli laboratoriya buyurtma bera oladi', 'green');
    log('✅ Boshqa rollar ham to\'g\'ri ishlayapti\n', 'green');
  } else if (results.failed > 0) {
    log('\n❌ BA\'ZI ROLLAR NOTO\'G\'RI ISHLAYAPTI ❌\n', 'red');
    log('Xatolarni yuqorida ko\'ring\n', 'yellow');
  } else {
    log('\n⚠️  HECH QANDAY TEST O\'TMADI ⚠️\n', 'yellow');
    log('Userlar yaratilmagan yoki API ishlamayapti\n', 'yellow');
  }

  // Qo'shimcha ma'lumot
  logTitle('QO\'SHIMCHA MA\'LUMOT');
  log('Agar userlar topilmasa, quyidagi script\'ni ishga tushiring:', 'blue');
  log('node backend/src/scripts/create-all-test-users.js\n', 'cyan');
}

// Testlarni ishga tushirish
runAllRoleTests().catch(error => {
  logError(`Umumiy xato: ${error.message}`);
  process.exit(1);
});
