/**
 * HARD STRESS TEST - Laboratoriya API
 * Bu test API'ning yuqori yuk ostida ishlashini tekshiradi
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
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(70)}\n`, 'cyan');
}

// Test ma'lumotlari
let authToken = '';
let testPatientId = '';
let testTestId = '';
const createdOrders = [];

// Performance metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  minTime: Infinity,
  maxTime: 0,
  errors: []
};

// Login
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.accessToken || response.data.token;
    return true;
  } catch (error) {
    logError(`Login xatosi: ${error.message}`);
    return false;
  }
}

// Test ma'lumotlarini olish
async function getTestData() {
  try {
    const [patientsRes, testsRes] = await Promise.all([
      axios.get(`${API_URL}/patients`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_URL}/laboratory/tests`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { is_active: true }
      })
    ]);

    if (patientsRes.data.data?.length > 0) {
      testPatientId = patientsRes.data.data[0].id;
    }
    if (testsRes.data.data?.length > 0) {
      testTestId = testsRes.data.data[0].id;
    }

    return testPatientId && testTestId;
  } catch (error) {
    logError(`Ma\'lumotlarni olish xatosi: ${error.message}`);
    return false;
  }
}

// Bitta buyurtma yaratish (performance tracking bilan)
async function createSingleOrder(index) {
  const startTime = Date.now();
  metrics.totalRequests++;

  try {
    const orderData = {
      patient_id: testPatientId,
      test_id: testTestId,
      priority: ['normal', 'urgent', 'stat'][index % 3],
      notes: `Stress test buyurtma #${index}`
    };

    const response = await axios.post(`${API_URL}/laboratory/orders`, orderData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    metrics.successfulRequests++;
    metrics.totalTime += duration;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);

    if (response.data.data?.id) {
      createdOrders.push(response.data.data.id);
    }

    return { success: true, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    metrics.failedRequests++;
    metrics.errors.push({
      index,
      error: error.response?.data?.message || error.message,
      duration
    });

    return { success: false, duration, error: error.message };
  }
}

// TEST 1: Sequential Load Test (Ketma-ket yuklash)
async function testSequentialLoad() {
  logTitle('TEST 1: SEQUENTIAL LOAD TEST (Ketma-ket 50 ta buyurtma)');
  
  const count = 50;
  logInfo(`${count} ta buyurtma ketma-ket yaratilmoqda...`);

  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    await createSingleOrder(i);
    if ((i + 1) % 10 === 0) {
      logInfo(`Progress: ${i + 1}/${count} buyurtma yaratildi`);
    }
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  logSuccess(`\nSequential test yakunlandi!`);
  logInfo(`Jami vaqt: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  logInfo(`O'rtacha vaqt: ${(totalDuration / count).toFixed(2)}ms/request`);
  logInfo(`Muvaffaqiyatli: ${metrics.successfulRequests}`);
  logInfo(`Muvaffaqiyatsiz: ${metrics.failedRequests}`);
}

// TEST 2: Concurrent Load Test (Parallel yuklash)
async function testConcurrentLoad() {
  logTitle('TEST 2: CONCURRENT LOAD TEST (Parallel 100 ta buyurtma)');
  
  const count = 100;
  logInfo(`${count} ta buyurtma parallel yaratilmoqda...`);

  // Metrics'ni reset qilish
  const prevSuccess = metrics.successfulRequests;
  const prevFailed = metrics.failedRequests;

  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(createSingleOrder(prevSuccess + i));
  }

  const results = await Promise.all(promises);

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  const newSuccess = metrics.successfulRequests - prevSuccess;
  const newFailed = metrics.failedRequests - prevFailed;

  logSuccess(`\nConcurrent test yakunlandi!`);
  logInfo(`Jami vaqt: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  logInfo(`Throughput: ${(count / (totalDuration / 1000)).toFixed(2)} requests/second`);
  logInfo(`Muvaffaqiyatli: ${newSuccess}`);
  logInfo(`Muvaffaqiyatsiz: ${newFailed}`);
}

// TEST 3: Spike Test (Keskin yuklash)
async function testSpikeLoad() {
  logTitle('TEST 3: SPIKE TEST (Keskin 200 ta buyurtma)');
  
  const count = 200;
  logInfo(`${count} ta buyurtma bir vaqtda yaratilmoqda...`);

  const prevSuccess = metrics.successfulRequests;
  const prevFailed = metrics.failedRequests;

  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(createSingleOrder(prevSuccess + i));
  }

  await Promise.allSettled(promises);

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  const newSuccess = metrics.successfulRequests - prevSuccess;
  const newFailed = metrics.failedRequests - prevFailed;

  logSuccess(`\nSpike test yakunlandi!`);
  logInfo(`Jami vaqt: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  logInfo(`Throughput: ${(count / (totalDuration / 1000)).toFixed(2)} requests/second`);
  logInfo(`Muvaffaqiyatli: ${newSuccess}`);
  logInfo(`Muvaffaqiyatsiz: ${newFailed}`);
  
  if (newFailed > 0) {
    logWarning(`Xatolar soni: ${newFailed} (${((newFailed / count) * 100).toFixed(2)}%)`);
  }
}

// TEST 4: Endurance Test (Chidamlilik testi)
async function testEndurance() {
  logTitle('TEST 4: ENDURANCE TEST (5 daqiqa davomida)');
  
  logInfo('5 daqiqa davomida har 2 soniyada 10 ta buyurtma yaratiladi...');
  logWarning('Bu test uzoq davom etadi. Ctrl+C bilan to\'xtatish mumkin.');

  const duration = 5 * 60 * 1000; // 5 daqiqa
  const interval = 2000; // 2 soniya
  const batchSize = 10;

  const startTime = Date.now();
  const prevSuccess = metrics.successfulRequests;
  const prevFailed = metrics.failedRequests;

  let iterations = 0;

  while (Date.now() - startTime < duration) {
    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      promises.push(createSingleOrder(prevSuccess + iterations * batchSize + i));
    }
    
    await Promise.all(promises);
    iterations++;

    const elapsed = Date.now() - startTime;
    const remaining = duration - elapsed;
    
    if (iterations % 5 === 0) {
      logInfo(`Progress: ${(elapsed / 1000).toFixed(0)}s / ${(duration / 1000).toFixed(0)}s (${(remaining / 1000).toFixed(0)}s qoldi)`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  const totalDuration = Date.now() - startTime;
  const newSuccess = metrics.successfulRequests - prevSuccess;
  const newFailed = metrics.failedRequests - prevFailed;

  logSuccess(`\nEndurance test yakunlandi!`);
  logInfo(`Jami vaqt: ${(totalDuration / 1000).toFixed(2)}s`);
  logInfo(`Jami buyurtmalar: ${newSuccess + newFailed}`);
  logInfo(`Muvaffaqiyatli: ${newSuccess}`);
  logInfo(`Muvaffaqiyatsiz: ${newFailed}`);
  logInfo(`Success rate: ${((newSuccess / (newSuccess + newFailed)) * 100).toFixed(2)}%`);
}

// Yakuniy natijalar
function printFinalResults() {
  logTitle('YAKUNIY NATIJALAR');

  logInfo(`Jami so'rovlar: ${metrics.totalRequests}`);
  logSuccess(`Muvaffaqiyatli: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  
  if (metrics.failedRequests > 0) {
    logError(`Muvaffaqiyatsiz: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  }

  if (metrics.successfulRequests > 0) {
    const avgTime = metrics.totalTime / metrics.successfulRequests;
    logInfo(`\nPerformance Metrics:`);
    logInfo(`  O'rtacha vaqt: ${avgTime.toFixed(2)}ms`);
    logInfo(`  Minimal vaqt: ${metrics.minTime}ms`);
    logInfo(`  Maksimal vaqt: ${metrics.maxTime}ms`);
  }

  if (metrics.errors.length > 0) {
    logWarning(`\nXatolar (birinchi 10 ta):`);
    metrics.errors.slice(0, 10).forEach((err, i) => {
      logError(`  ${i + 1}. Buyurtma #${err.index}: ${err.error} (${err.duration}ms)`);
    });
  }

  logInfo(`\nYaratilgan buyurtmalar: ${createdOrders.length} ta`);
}

// Barcha testlarni ishga tushirish
async function runAllTests() {
  logTitle('🔥 HARD STRESS TEST - LABORATORIYA API 🔥');
  
  logInfo(`API URL: ${API_URL}`);
  logInfo(`Vaqt: ${new Date().toLocaleString('uz-UZ')}`);
  logWarning(`OGOHLANTIRISH: Bu testlar server'ga yuqori yuk beradi!\n`);

  // Login
  logInfo('Login qilish...');
  if (!await login()) {
    logError('Login muvaffaqiyatsiz. Test to\'xtatildi.');
    return;
  }
  logSuccess('Login muvaffaqiyatli\n');

  // Test ma'lumotlarini olish
  logInfo('Test ma\'lumotlarini olish...');
  if (!await getTestData()) {
    logError('Test ma\'lumotlari topilmadi. Test to\'xtatildi.');
    return;
  }
  logSuccess('Test ma\'lumotlari tayyor\n');

  // Testlarni ishga tushirish
  try {
    await testSequentialLoad();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s kutish

    await testConcurrentLoad();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testSpikeLoad();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Endurance test ixtiyoriy
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\nEndurance test (5 daqiqa) ishga tushirilsinmi? (y/n): ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        await testEndurance();
      } else {
        logInfo('Endurance test o\'tkazib yuborildi');
      }

      printFinalResults();
    });

  } catch (error) {
    logError(`Test xatosi: ${error.message}`);
  }
}

// Testlarni ishga tushirish
runAllTests().catch(error => {
  logError(`Umumiy xato: ${error.message}`);
  process.exit(1);
});
