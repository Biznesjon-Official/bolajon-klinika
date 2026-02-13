/**
 * HARD EDGE CASE TEST - Laboratoriya API
 * Bu test API'ning noto'g'ri ma'lumotlar bilan ishlashini tekshiradi
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logTitle(message) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(70)}\n`, 'cyan');
}

let authToken = '';
let testPatientId = '';
let testTestId = '';

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Login
async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  authToken = response.data.accessToken || response.data.token;
}

// Test ma'lumotlarini olish
async function getTestData() {
  const [patientsRes, testsRes] = await Promise.all([
    axios.get(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    }),
    axios.get(`${API_URL}/laboratory/tests`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { is_active: true }
    })
  ]);

  testPatientId = patientsRes.data.data[0].id;
  testTestId = testsRes.data.data[0].id;
}

// Test helper
async function runTest(testName, testFn, expectedStatus = null) {
  results.total++;
  try {
    logInfo(`Test: ${testName}`);
    const result = await testFn();
    
    if (expectedStatus && result.status !== expectedStatus) {
      logError(`  Kutilgan status: ${expectedStatus}, Olindi: ${result.status}`);
      results.failed++;
      return false;
    }
    
    logSuccess(`  O'tdi`);
    results.passed++;
    return true;
  } catch (error) {
    if (expectedStatus && error.response?.status === expectedStatus) {
      logSuccess(`  O'tdi (kutilgan xato)`);
      results.passed++;
      return true;
    }
    logError(`  Xato: ${error.response?.data?.message || error.message}`);
    results.failed++;
    return false;
  }
}

// EDGE CASE TESTLAR

// 1. Bo'sh ma'lumotlar
async function testEmptyData() {
  logTitle('TEST 1: BO\'SH MA\'LUMOTLAR');

  await runTest('Bo\'sh obyekt yuborish', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('Null qiymatlar', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: null,
      test_id: null,
      priority: null
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('Bo\'sh stringlar', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: '',
      test_id: '',
      priority: ''
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);
}

// 2. Noto'g'ri ID'lar
async function testInvalidIds() {
  logTitle('TEST 2: NOTO\'G\'RI ID\'LAR');

  await runTest('Mavjud bo\'lmagan patient_id', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: '000000000000000000000000',
      test_id: testTestId,
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 404);

  await runTest('Mavjud bo\'lmagan test_id', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: testPatientId,
      test_id: '000000000000000000000000',
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 404);

  await runTest('Noto\'g\'ri format ID', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: 'invalid-id',
      test_id: testTestId,
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);
}

// 3. Noto'g'ri ma'lumot turlari
async function testInvalidDataTypes() {
  logTitle('TEST 3: NOTO\'G\'RI MA\'LUMOT TURLARI');

  await runTest('patient_id raqam sifatida', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: 12345,
      test_id: testTestId,
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('priority noto\'g\'ri qiymat', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: testPatientId,
      test_id: testTestId,
      priority: 'invalid-priority'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('notes juda uzun (10000 belgi)', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: testPatientId,
      test_id: testTestId,
      priority: 'normal',
      notes: 'A'.repeat(10000)
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);
}

// 4. SQL Injection urinishlari
async function testSQLInjection() {
  logTitle('TEST 4: SQL INJECTION HIMOYASI');

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE orders; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--"
  ];

  for (const payload of sqlPayloads) {
    await runTest(`SQL Injection: ${payload.substring(0, 20)}...`, async () => {
      return await axios.post(`${API_URL}/laboratory/orders`, {
        patient_id: testPatientId,
        test_id: testTestId,
        priority: 'normal',
        notes: payload
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }, 201); // Himoya bo'lsa, oddiy buyurtma yaratiladi
  }
}

// 5. XSS urinishlari
async function testXSS() {
  logTitle('TEST 5: XSS HIMOYASI');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ];

  for (const payload of xssPayloads) {
    await runTest(`XSS: ${payload.substring(0, 30)}...`, async () => {
      return await axios.post(`${API_URL}/laboratory/orders`, {
        patient_id: testPatientId,
        test_id: testTestId,
        priority: 'normal',
        notes: payload
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }, 201); // Himoya bo'lsa, oddiy buyurtma yaratiladi
  }
}

// 6. Autentifikatsiya testlari
async function testAuthentication() {
  logTitle('TEST 6: AUTENTIFIKATSIYA');

  await runTest('Token bo\'lmasa', async () => {
    return await axios.get(`${API_URL}/laboratory/orders`);
  }, 401);

  await runTest('Noto\'g\'ri token', async () => {
    return await axios.get(`${API_URL}/laboratory/orders`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
  }, 401);

  await runTest('Muddati o\'tgan token', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    return await axios.get(`${API_URL}/laboratory/orders`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
  }, 401);
}

// 7. Rate limiting test
async function testRateLimiting() {
  logTitle('TEST 7: RATE LIMITING');

  logInfo('100 ta so\'rov bir vaqtda yuborilmoqda...');
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      axios.get(`${API_URL}/laboratory/orders`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }).catch(err => err.response)
    );
  }

  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r?.status === 429).length;

  if (rateLimited > 0) {
    logSuccess(`  Rate limiting ishlayapti: ${rateLimited} ta so'rov bloklandi`);
  } else {
    logWarning(`  Rate limiting yo'q yoki juda yuqori limit`);
  }
}

// 8. Unicode va maxsus belgilar
async function testUnicodeAndSpecialChars() {
  logTitle('TEST 8: UNICODE VA MAXSUS BELGILAR');

  const specialChars = [
    '😀😁😂🤣😃😄', // Emoji
    '你好世界', // Xitoycha
    'مرحبا بالعالم', // Arabcha
    'Привет мир', // Ruscha
    '\\n\\r\\t', // Escape belgilar
    '!@#$%^&*()_+-=[]{}|;:,.<>?', // Maxsus belgilar
  ];

  for (const chars of specialChars) {
    await runTest(`Maxsus belgilar: ${chars.substring(0, 20)}`, async () => {
      return await axios.post(`${API_URL}/laboratory/orders`, {
        patient_id: testPatientId,
        test_id: testTestId,
        priority: 'normal',
        notes: chars
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }, 201);
  }
}

// 9. Concurrent updates (Race condition)
async function testRaceCondition() {
  logTitle('TEST 9: RACE CONDITION');

  logInfo('Bir xil buyurtmani bir vaqtda 10 marta yaratish...');

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.post(`${API_URL}/laboratory/orders`, {
        patient_id: testPatientId,
        test_id: testTestId,
        priority: 'normal',
        notes: 'Race condition test'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    );
  }

  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled').length;

  logInfo(`  ${successful}/10 buyurtma yaratildi`);
  if (successful === 10) {
    logSuccess(`  Race condition yo'q (yoki kutilgan xatti-harakat)`);
  }
}

// 10. Boundary values
async function testBoundaryValues() {
  logTitle('TEST 10: CHEGARA QIYMATLARI');

  await runTest('Juda uzun notes (1 million belgi)', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: testPatientId,
      test_id: testTestId,
      priority: 'normal',
      notes: 'A'.repeat(1000000)
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('Manfiy raqamlar', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: -1,
      test_id: -1,
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);

  await runTest('Juda katta raqamlar', async () => {
    return await axios.post(`${API_URL}/laboratory/orders`, {
      patient_id: Number.MAX_SAFE_INTEGER,
      test_id: Number.MAX_SAFE_INTEGER,
      priority: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }, 400);
}

// Yakuniy natijalar
function printResults() {
  logTitle('YAKUNIY NATIJALAR');

  logInfo(`Jami testlar: ${results.total}`);
  logSuccess(`O'tdi: ${results.passed} (${((results.passed / results.total) * 100).toFixed(2)}%)`);
  
  if (results.failed > 0) {
    logError(`O'tmadi: ${results.failed} (${((results.failed / results.total) * 100).toFixed(2)}%)`);
  }

  if (results.passed === results.total) {
    log('\n🎉 BARCHA EDGE CASE TESTLAR MUVAFFAQIYATLI! 🎉\n', 'green');
  } else {
    log('\n⚠️  BA\'ZI TESTLAR MUVAFFAQIYATSIZ ⚠️\n', 'yellow');
  }
}

// Barcha testlarni ishga tushirish
async function runAllTests() {
  logTitle('🔥 HARD EDGE CASE TEST - LABORATORIYA API 🔥');
  
  logInfo(`API URL: ${API_URL}`);
  logInfo(`Vaqt: ${new Date().toLocaleString('uz-UZ')}\n`);

  try {
    // Login
    logInfo('Login qilish...');
    await login();
    logSuccess('Login muvaffaqiyatli\n');

    // Test ma'lumotlarini olish
    logInfo('Test ma\'lumotlarini olish...');
    await getTestData();
    logSuccess('Test ma\'lumotlari tayyor\n');

    // Testlarni ishga tushirish
    await testEmptyData();
    await testInvalidIds();
    await testInvalidDataTypes();
    await testSQLInjection();
    await testXSS();
    await testAuthentication();
    await testRateLimiting();
    await testUnicodeAndSpecialChars();
    await testRaceCondition();
    await testBoundaryValues();

    printResults();

  } catch (error) {
    logError(`Umumiy xato: ${error.message}`);
    process.exit(1);
  }
}

// Testlarni ishga tushirish
runAllTests();
