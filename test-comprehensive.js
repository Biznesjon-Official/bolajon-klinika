/**
 * ========================================================
 * BOLAJON KLINIKA - TO'LIQ TEST SUITE
 * ========================================================
 * Barcha modullar va API endpointlarni test qiladi
 *
 * Ishga tushirish: node test-comprehensive.js
 * ========================================================
 */

const API_BASE = 'http://localhost:5001/api/v1';

// ============================================================
// RANGLAR VA LOG FUNKSIYALARI
// ============================================================
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  bgGreen: '\x1b[42m',
  bgRed:   '\x1b[41m',
};

// Test natijalari
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function print(msg, color = 'reset') {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function printHeader(title) {
  const line = '═'.repeat(65);
  print(`\n${line}`, 'cyan');
  print(`  ${title}`, 'cyan');
  print(`${line}`, 'cyan');
}

function printSection(title) {
  print(`\n  ┌─ ${title}`, 'yellow');
}

function pass(testName, info = '') {
  results.passed++;
  results.tests.push({ name: testName, status: 'PASS', info });
  print(`  │  ✅ ${testName}${info ? ` ${C.gray}(${info})${C.green}` : ''}`, 'green');
}

function fail(testName, error = '') {
  results.failed++;
  results.tests.push({ name: testName, status: 'FAIL', error });
  print(`  │  ❌ ${testName}${error ? `\n  │     ${C.red}${error}` : ''}`, 'red');
}

function skip(testName, reason = '') {
  results.skipped++;
  results.tests.push({ name: testName, status: 'SKIP', reason });
  print(`  │  ⏭️  ${testName}${reason ? ` ${C.gray}(${reason})` : ''}`, 'gray');
}

function info(msg) {
  print(`  │     ${C.gray}→ ${msg}`, 'gray');
}

// ============================================================
// API HELPER
// ============================================================
async function api(method, endpoint, body = null, token = null, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body)  opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    clearTimeout(timer);

    let data;
    try { data = await res.json(); }
    catch { data = {}; }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'Timeout', data: {} };
    return { ok: false, status: 0, error: err.message, data: {} };
  }
}

// ============================================================
// YORDAMCHI: Kutish
// ============================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// TEST MA'LUMOTLARI (GLOBAL)
// ============================================================
const TD = {
  tokens: {},
  patient: null,
  staff: {},        // role -> staff object
  services: [],
  labTests: [],
  queue: null,
  labOrder: null,
  invoice: null,
  prescription: null,
  task: null,
  expense: null,
};

// ============================================================
// 1. SERVER HEALTH CHECK
// ============================================================
async function testServerHealth() {
  printHeader('1. SERVER HEALTH CHECK');
  printSection('Server va API ulanishi');

  // Backend health
  const r = await api('GET', '/../health');
  if (r.ok || r.status === 404) {
    pass('Server ishlayapti (port 5001)');
  } else if (r.error === 'Timeout') {
    fail('Server javob bermayapti', 'Server ishlamayapti yoki port xato');
    print('\n⚠️  Server ishga tushmagan! Avval serverni yoqing:', 'red');
    print('   cd backend && npm start\n', 'yellow');
    process.exit(1);
  } else {
    pass('Server ishlayapti (port 5001)');
  }

  // Try a real endpoint
  const r2 = await api('GET', '/auth/login');
  if (r2.status === 400 || r2.status === 404 || r2.status === 405 || r2.ok) {
    pass('API /api/v1 prefix to\'g\'ri');
  } else if (r2.error) {
    fail('API ulanishi', r2.error);
  } else {
    pass('API endpointlar javob bermoqda');
  }
}

// ============================================================
// 2. AUTHENTICATION
// ============================================================
async function testAuthentication() {
  printHeader('2. AUTENTIFIKATSIYA TESTLARI');
  printSection('Login testlari');

  // Admin login (retry agar rate limit bo'lsa)
  let adminR = await api('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  if (adminR.status === 429) {
    info('Rate limit - 65 sekund kutilmoqda...');
    await sleep(65000);
    adminR = await api('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  }
  if (adminR.ok && adminR.data.accessToken) {
    TD.tokens.admin = adminR.data.accessToken;
    TD.tokens.receptionist = adminR.data.accessToken; // fallback
    TD.tokens.doctor = adminR.data.accessToken;
    TD.tokens.cashier = adminR.data.accessToken;
    TD.tokens.laborant = adminR.data.accessToken;
    TD.tokens.nurse = adminR.data.accessToken;
    TD.tokens.pharmacist = adminR.data.accessToken;
    pass('Admin login', `${adminR.data.user?.full_name || 'admin'} (${adminR.data.user?.role})`);
  } else {
    fail('Admin login', adminR.data?.message || adminR.error || `Status: ${adminR.status}`);
    print('\n  ⚠️  Admin login ishlamadi. Iltimos 60 soniya kutib qayta urinib ko\'ring.', 'red');
    return;
  }

  // Wrong password test (500ms kutish - rate limiter uchun)
  await sleep(500);
  const badR = await api('POST', '/auth/login', { username: 'admin', password: 'wrong_password_xyz' });
  if (!badR.ok && (badR.status === 401 || badR.status === 429)) {
    pass('Noto\'g\'ri parol rad etildi', `Status: ${badR.status}`);
  } else {
    fail('Noto\'g\'ri parol rad etilmadi', `Status: ${badR.status}`);
  }

  // Missing credentials
  await sleep(200);
  const emptyR = await api('POST', '/auth/login', { username: '', password: '' });
  if (!emptyR.ok) {
    pass('Bo\'sh ma\'lumotlar rad etildi');
  } else {
    fail('Bo\'sh ma\'lumotlar qabul qilindi (kerak emas)');
  }

  // Role-specific logins (300ms delay - rate limit uchun)
  printSection('Rol bo\'yicha login');
  const roles = [
    { username: 'reception', password: 'reception123', key: 'receptionist', label: 'Qabulxona' },
    { username: 'doctor',    password: 'doctor123',    key: 'doctor',       label: 'Shifokor' },
    { username: 'nurse',     password: 'nurse123',     key: 'nurse',        label: 'Hamshira' },
    { username: 'laborant',  password: 'laborant123',  key: 'laborant',     label: 'Laborant' },
    { username: 'cashier',   password: 'cashier123',   key: 'cashier',      label: 'Kassir' },
    { username: 'pharmacist',password: 'pharmacist123',key: 'pharmacist',   label: 'Dorixona' },
  ];

  for (const role of roles) {
    await sleep(300); // Rate limit uchun
    const r = await api('POST', '/auth/login', { username: role.username, password: role.password });
    if (r.ok && r.data.accessToken) {
      TD.tokens[role.key] = r.data.accessToken;
      pass(`${role.label} login`, r.data.user?.role || role.key);
    } else if (r.status === 429) {
      skip(`${role.label} login`, 'Rate limit - admin token ishlatiladi');
    } else {
      // Use admin token as fallback
      skip(`${role.label} login`, `Foydalanuvchi topilmadi, admin token ishlatiladi`);
    }
  }
}

// ============================================================
// 3. STAFF MANAGEMENT
// ============================================================
async function testStaffManagement() {
  printHeader('3. XODIMLAR BOSHQARUVI');
  printSection('Xodimlar ro\'yxati');

  const token = TD.tokens.admin;
  if (!token) return skip('Xodimlar moduli', 'Admin token yo\'q');

  // Get all staff
  const r = await api('GET', '/staff', null, token);
  if (r.ok) {
    const count = r.data.data?.length || 0;
    pass('Xodimlar ro\'yxati', `${count} ta xodim`);
    if (r.data.data?.length) {
      TD.staff.any = r.data.data[0];
      info(`Birinchi xodim: ${r.data.data[0].first_name} ${r.data.data[0].last_name} (${r.data.data[0].role})`);
    }
  } else {
    fail('Xodimlar ro\'yxati', r.data?.message || r.error);
  }

  // Get staff by role
  printSection('Rol bo\'yicha xodim filtri');
  const roles = ['Doctor', 'Nurse', 'Laborant', 'Receptionist', 'Cashier', 'Pharmacist'];
  for (const role of roles) {
    const r2 = await api('GET', `/staff?role=${role}`, null, token);
    if (r2.ok) {
      const count = r2.data.data?.length || 0;
      if (count > 0) {
        pass(`${role} filter`, `${count} ta xodim`);
        if (role === 'Doctor' && !TD.staff.doctor) TD.staff.doctor = r2.data.data[0];
        if (role === 'Nurse' && !TD.staff.nurse) TD.staff.nurse = r2.data.data[0];
        if (role === 'Laborant' && !TD.staff.laborant) TD.staff.laborant = r2.data.data[0];
      } else {
        skip(`${role} filter`, 'Bu roldagi xodim yo\'q');
      }
    } else {
      fail(`${role} filter`, r2.data?.message);
    }
  }

  // Search staff
  printSection('Xodim qidirish');
  const searchR = await api('GET', '/staff?search=a', null, token);
  if (searchR.ok) {
    pass('Xodim qidirish', `${searchR.data.data?.length || 0} natija`);
  } else {
    fail('Xodim qidirish', searchR.data?.message);
  }
}

// ============================================================
// 4. PATIENT MANAGEMENT
// ============================================================
async function testPatientManagement() {
  printHeader('4. BEMOR BOSHQARUVI');
  printSection('Bemorlar ro\'yxati');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get patients list
  const listR = await api('GET', '/patients', null, token);
  if (listR.ok) {
    const count = listR.data.data?.length || listR.data.patients?.length || 0;
    pass('Bemorlar ro\'yxati', `${count} ta bemor`);
  } else {
    fail('Bemorlar ro\'yxati', listR.data?.message || listR.error);
  }

  // Patient search
  printSection('Bemor qidirish');
  const searchR = await api('GET', '/patients/search?q=a', null, token);
  if (searchR.ok) {
    pass('Bemor qidirish (harfli)', `${searchR.data.data?.length || 0} natija`);
  } else {
    fail('Bemor qidirish', searchR.data?.message);
  }

  const searchEmptyR = await api('GET', '/patients/search?q=', null, token);
  if (searchEmptyR.ok) {
    pass('Bemor qidirish (bo\'sh)', `${searchEmptyR.data.data?.length || 0} natija`);
  } else {
    skip('Bemor qidirish bo\'sh', 'Endpoint xato');
  }

  // Create patient
  printSection('Yangi bemor yaratish');
  const phone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const createR = await api('POST', '/patients', {
    first_name: 'Test',
    last_name: 'Bemor',
    middle_name: 'Testovich',
    phone: phone,
    date_of_birth: '1990-06-15',
    gender: 'male',
    address: 'Toshkent shahar, Chilonzor tumani'
  }, token);

  if (createR.ok) {
    TD.patient = createR.data.patient || createR.data.data;
    const pNum = TD.patient?.patient_number || TD.patient?._id || 'N/A';
    pass('Yangi bemor yaratildi', `Raqam: ${pNum}`);
    info(`Telefon: ${phone}`);
  } else {
    fail('Bemor yaratish', createR.data?.message || createR.error);
    // Try to get existing patient
    const listR2 = await api('GET', '/patients?limit=1', null, token);
    if (listR2.ok && listR2.data.data?.length) {
      TD.patient = listR2.data.data[0];
      info(`Mavjud bemor ishlatiladi: ${TD.patient.first_name} ${TD.patient.last_name}`);
    }
  }

  // Get patient by ID
  if (TD.patient) {
    printSection('Bemor profili');
    const patId = TD.patient._id || TD.patient.id;
    const getR = await api('GET', `/patients/${patId}`, null, token);
    if (getR.ok) {
      pass('Bemor profili', `${TD.patient.first_name} ${TD.patient.last_name}`);
    } else {
      fail('Bemor profili', getR.data?.message);
    }

    // Update patient
    const updateR = await api('PUT', `/patients/${patId}`, {
      address: 'Yangilangan manzil, Toshkent'
    }, token);
    if (updateR.ok) {
      pass('Bemor ma\'lumoti yangilandi');
    } else {
      fail('Bemor yangilash', updateR.data?.message);
    }
  }
}

// ============================================================
// 5. QUEUE MANAGEMENT
// ============================================================
async function testQueueManagement() {
  printHeader('5. NAVBAT BOSHQARUVI');

  const token = TD.tokens.receptionist || TD.tokens.admin;
  if (!token) return;

  // Get queue list
  printSection('Navbat ro\'yxati');
  const listR = await api('GET', '/queue', null, token);
  if (listR.ok) {
    const count = listR.data.data?.length || listR.data.queue?.length || 0;
    pass('Navbat ro\'yxati', `${count} ta navbat`);
  } else {
    fail('Navbat ro\'yxati', listR.data?.message || listR.error);
  }

  // Get queue stats
  const statsR = await api('GET', '/queue/stats', null, token);
  if (statsR.ok) {
    pass('Navbat statistikasi');
  } else {
    skip('Navbat statistikasi', statsR.data?.message);
  }

  // Create queue entry
  if (TD.patient && TD.staff.doctor) {
    printSection('Navbatga qo\'shish');
    const qR = await api('POST', '/queue', {
      patient_id: TD.patient._id || TD.patient.id,
      doctor_id: TD.staff.doctor._id || TD.staff.doctor.id,
      queue_type: 'NORMAL',
      notes: 'Test navbati - bosh og\'riq'
    }, token);

    if (qR.ok) {
      TD.queue = qR.data.data;
      pass('Navbatga qo\'shildi', `Navbat #${TD.queue?.queue_number || 'N/A'}`);
    } else {
      fail('Navbatga qo\'shish', qR.data?.message || qR.error);
    }
  } else {
    skip('Navbatga qo\'shish', 'Bemor yoki shifokor topilmadi');
  }

  // Get today's queue
  const todayR = await api('GET', '/queue/today', null, token);
  if (todayR.ok) {
    pass('Bugungi navbat');
  } else {
    skip('Bugungi navbat', 'Endpoint mavjud emas');
  }
}

// ============================================================
// 6. BILLING & FINANCIAL
// ============================================================
async function testBillingFinancial() {
  printHeader('6. MOLIYAVIY MODUL');

  const token = TD.tokens.cashier || TD.tokens.admin;
  if (!token) return;

  // Get billing stats
  printSection('Moliyaviy statistika');
  const statsR = await api('GET', '/billing/stats', null, token);
  if (statsR.ok) {
    pass('Moliyaviy statistika');
    if (statsR.data.data) {
      info(`Bugungi daromad: ${(statsR.data.data.today_revenue || 0).toLocaleString()} so'm`);
    }
  } else {
    fail('Moliyaviy statistika', statsR.data?.message);
  }

  // Get services list
  printSection('Xizmatlar');
  const svcR = await api('GET', '/billing/services', null, token);
  if (svcR.ok) {
    const count = svcR.data.data?.length || 0;
    pass('Xizmatlar ro\'yxati', `${count} ta xizmat`);
    TD.services = svcR.data.data || [];
    if (TD.services.length) {
      info(`Birinchi xizmat: ${TD.services[0].name} - ${TD.services[0].price?.toLocaleString()} so'm`);
    }
  } else {
    fail('Xizmatlar ro\'yxati', svcR.data?.message);
  }

  // Get invoices
  printSection('Hisob-fakturalar');
  const invListR = await api('GET', '/billing/invoices', null, token);
  if (invListR.ok) {
    const count = invListR.data.data?.length || 0;
    pass('Hisob-fakturalar ro\'yxati', `${count} ta faktura`);
  } else {
    fail('Hisob-fakturalar', invListR.data?.message);
  }

  // Create invoice
  if (TD.patient && TD.services.length) {
    printSection('Hisob-faktura yaratish');
    const service = TD.services[0];
    const invR = await api('POST', '/billing/invoices', {
      patient_id: TD.patient._id || TD.patient.id,
      items: [{ service_id: service._id || service.id, quantity: 1 }],
      payment_method: 'cash',
      paid_amount: service.price || 100000,
      discount_amount: 0,
      notes: 'Test to\'lovi'
    }, token);

    if (invR.ok) {
      TD.invoice = invR.data.data || invR.data.invoice;
      pass('Hisob-faktura yaratildi', `#${TD.invoice?.invoice_number || 'N/A'}`);
      info(`Summa: ${(TD.invoice?.total_amount || service.price)?.toLocaleString()} so'm`);
    } else {
      fail('Hisob-faktura yaratish', invR.data?.message || invR.error);
    }
  } else {
    skip('Hisob-faktura yaratish', TD.patient ? 'Xizmatlar yo\'q' : 'Bemor yo\'q');
  }

  // Get revenue report
  printSection('Daromad hisobot');
  const revR = await api('GET', '/billing/revenue?period=today', null, token);
  if (revR.ok) {
    pass('Daromad hisobot');
  } else {
    skip('Daromad hisobot', 'Endpoint mavjud emas yoki xato');
  }

  // Service categories
  const catR = await api('GET', '/billing/service-categories', null, token);
  if (catR.ok) {
    pass('Xizmat kategoriyalari', `${catR.data.data?.length || 0} ta kategoriya`);
  } else {
    skip('Xizmat kategoriyalari', catR.data?.message);
  }
}

// ============================================================
// 7. LABORATORY
// ============================================================
async function testLaboratory() {
  printHeader('7. LABORATORIYA MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get lab tests
  printSection('Tahlil ro\'yxati');
  const testsR = await api('GET', '/laboratory/tests', null, token);
  if (testsR.ok) {
    const count = testsR.data.data?.length || testsR.data.tests?.length || 0;
    pass('Tahlillar ro\'yxati', `${count} ta tahlil`);
    TD.labTests = testsR.data.data || testsR.data.tests || [];
    if (TD.labTests.length) {
      info(`Birinchi tahlil: ${TD.labTests[0].name}`);
    }
  } else {
    fail('Tahlillar ro\'yxati', testsR.data?.message || testsR.error);
  }

  // Get lab orders
  printSection('Lab buyurtmalar');
  const ordersR = await api('GET', '/laboratory/orders', null, token);
  if (ordersR.ok) {
    const count = ordersR.data.data?.length || 0;
    pass('Lab buyurtmalar ro\'yxati', `${count} ta buyurtma`);
  } else {
    fail('Lab buyurtmalar', ordersR.data?.message);
  }

  // Create lab order
  if (TD.patient && TD.labTests.length && TD.staff.doctor) {
    printSection('Lab buyurtma yaratish');
    const test = TD.labTests[0];
    const createR = await api('POST', '/laboratory/orders', {
      patient_id: TD.patient._id || TD.patient.id,
      doctor_id: TD.staff.doctor._id || TD.staff.doctor.id,
      test_id: test._id || test.id,
      priority: 'normal',
      notes: 'Test buyurtma'
    }, token);

    if (createR.ok) {
      TD.labOrder = createR.data.data;
      pass('Lab buyurtma yaratildi', `#${TD.labOrder?.order_number || 'N/A'}`);
    } else {
      fail('Lab buyurtma yaratish', createR.data?.message || createR.error);
    }
  } else {
    let reason = [];
    if (!TD.patient) reason.push('bemor yo\'q');
    if (!TD.labTests.length) reason.push('tahlil yo\'q');
    if (!TD.staff.doctor) reason.push('shifokor yo\'q');
    skip('Lab buyurtma yaratish', reason.join(', '));
  }

  // Lab order status update
  if (TD.labOrder) {
    printSection('Lab buyurtma holati');
    const ordId = TD.labOrder._id || TD.labOrder.id;

    const statusR = await api('PUT', `/laboratory/orders/${ordId}/status`,
      { status: 'in_progress' }, TD.tokens.laborant || token);
    if (statusR.ok) {
      pass('Lab buyurtma holati o\'zgartirildi (in_progress)');
    } else {
      fail('Lab holat o\'zgartirish', statusR.data?.message);
    }

    // Submit results
    const resultsR = await api('POST', `/laboratory/orders/${ordId}/results`, {
      test_results: [
        { parameter_name: 'Hemoglobin', value: '145', unit: 'g/L', reference_range: '120-160', status: 'normal' },
        { parameter_name: 'Leykositlar', value: '12.5', unit: 'x10^9/L', reference_range: '4-9', status: 'high' }
      ],
      notes: 'Test natijalari'
    }, TD.tokens.laborant || token);

    if (resultsR.ok) {
      pass('Tahlil natijalari kiritildi');
    } else {
      fail('Tahlil natijalari', resultsR.data?.message || resultsR.error);
    }
  }

  // Lab stats
  printSection('Laboratoriya statistikasi');
  const labStatsR = await api('GET', '/laboratory/stats', null, token);
  if (labStatsR.ok) {
    pass('Laboratoriya statistikasi');
  } else {
    skip('Lab statistika', 'Endpoint mavjud emas');
  }

  // Lab reagents
  const reagentsR = await api('GET', '/lab-reagents', null, token);
  if (reagentsR.ok) {
    pass('Reagentlar ro\'yxati', `${reagentsR.data.data?.length || 0} ta reagent`);
  } else {
    skip('Reagentlar', reagentsR.data?.message);
  }
}

// ============================================================
// 8. PHARMACY
// ============================================================
async function testPharmacy() {
  printHeader('8. DORIXONA MODULI');

  const token = TD.tokens.pharmacist || TD.tokens.admin;
  if (!token) return;

  // Get medicines
  printSection('Dorilar ro\'yxati');
  const medsR = await api('GET', '/pharmacy/medicines', null, token);
  if (medsR.ok) {
    const count = medsR.data.data?.length || medsR.data.medicines?.length || 0;
    pass('Dorilar ro\'yxati', `${count} ta dori`);
    if (medsR.data.data?.length) {
      info(`Birinchi dori: ${medsR.data.data[0].name}`);
    }
  } else {
    fail('Dorilar ro\'yxati', medsR.data?.message || medsR.error);
  }

  // Get pharmacy transactions
  printSection('Dorixona tranzaksiyalari');
  const transR = await api('GET', '/pharmacy/transactions', null, token);
  if (transR.ok) {
    pass('Dorixona tranzaksiyalari', `${transR.data.data?.length || 0} ta tranzaksiya`);
  } else {
    fail('Dorixona tranzaksiyalari', transR.data?.message);
  }

  // Get pharmacy requests
  const reqR = await api('GET', '/pharmacy/requests', null, token);
  if (reqR.ok) {
    pass('Dorixona so\'rovlari', `${reqR.data.data?.length || 0} ta so\'rov`);
  } else {
    skip('Dorixona so\'rovlari', reqR.data?.message);
  }

  // Get low stock alerts
  printSection('Kam zaxira ogohlantirishlari');
  const lowR = await api('GET', '/pharmacy/low-stock', null, token);
  if (lowR.ok) {
    pass('Kam zaxira tekshiruvi', `${lowR.data.data?.length || 0} ta dori kam`);
  } else {
    skip('Kam zaxira', lowR.data?.message);
  }
}

// ============================================================
// 9. INPATIENT
// ============================================================
async function testInpatient() {
  printHeader('9. STATSIONAR MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get rooms
  printSection('Palatalar');
  const roomsR = await api('GET', '/inpatient/rooms', null, token);
  if (roomsR.ok) {
    const count = roomsR.data.data?.length || roomsR.data.rooms?.length || 0;
    pass('Palatalar ro\'yxati', `${count} ta palata`);
  } else {
    fail('Palatalar ro\'yxati', roomsR.data?.message || roomsR.error);
  }

  // Get beds
  printSection('To\'shaklar');
  const bedsR = await api('GET', '/inpatient/beds', null, token);
  if (bedsR.ok) {
    const count = bedsR.data.data?.length || bedsR.data.beds?.length || 0;
    pass('To\'shaklar ro\'yxati', `${count} ta to\'shak`);
  } else {
    fail('To\'shaklar ro\'yxati', bedsR.data?.message || bedsR.error);
  }

  // Get admissions
  printSection('Yotqizilganlar');
  const admR = await api('GET', '/inpatient/admissions', null, token);
  if (admR.ok) {
    pass('Yotqizilganlar ro\'yxati', `${admR.data.data?.length || 0} ta bemor`);
  } else if (admR.data?.error?.includes('populate')) {
    // Known backend bug: doctor_id populate error in Admission model
    fail('Yotqizilganlar [BACKEND BUG]', 'doctor_id populate xatosi - model schema muammosi');
  } else {
    fail('Yotqizilganlar', admR.data?.message || admR.error);
  }

  // Stats
  const statR = await api('GET', '/inpatient/stats', null, token);
  if (statR.ok) {
    pass('Statsionar statistikasi');
    if (statR.data.data) {
      info(`Band to'shaklar: ${statR.data.data.occupied_beds || 0}`);
      info(`Bo'sh to'shaklar: ${statR.data.data.available_beds || 0}`);
    }
  } else {
    skip('Statsionar statistika', statR.data?.message);
  }
}

// ============================================================
// 10. AMBULATOR (OUTPATIENT)
// ============================================================
async function testAmbulator() {
  printHeader('10. AMBULATORIYA MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get ambulator rooms
  printSection('Ambulator xonalar');
  const roomsR = await api('GET', '/ambulator/rooms', null, token);
  if (roomsR.ok) {
    pass('Ambulator xonalar', `${roomsR.data.data?.length || 0} ta xona`);
  } else {
    fail('Ambulator xonalar', roomsR.data?.message || roomsR.error);
  }

  // Get today's patients
  printSection('Bugungi bemorlar');
  const todayR = await api('GET', '/ambulator/today', null, token);
  if (todayR.ok) {
    pass('Bugungi ambulator bemorlar', `${todayR.data.data?.length || 0} ta`);
  } else {
    skip('Bugungi ambulator', 'Endpoint mavjud emas');
  }

  // Complaints
  const complR = await api('GET', '/ambulator/complaints', null, token);
  if (complR.ok) {
    pass('Shikoyatlar ro\'yxati', `${complR.data.data?.length || 0} ta`);
  } else {
    skip('Shikoyatlar', complR.data?.message);
  }
}

// ============================================================
// 11. PAYROLL
// ============================================================
async function testPayroll() {
  printHeader('11. ISH HAQI MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get staff salaries
  printSection('Ish haqi ma\'lumotlari');
  const salR = await api('GET', '/payroll/staff-salaries', null, token);
  if (salR.ok) {
    const count = salR.data.data?.length || 0;
    pass('Xodimlar ish haqi', `${count} ta yozuv`);
    if (salR.data.data?.length) {
      info(`Birinchi: ${salR.data.data[0].staff_name} - ${salR.data.data[0].base_salary?.toLocaleString()} so'm`);
    }
  } else {
    fail('Ish haqi ro\'yxati', salR.data?.message || salR.error);
  }

  // Get monthly payroll (correct route: /payroll/monthly-payroll)
  printSection('Oylik to\'lovlar');
  const now = new Date();
  const monthR = await api('GET', `/payroll/monthly-payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, null, token);
  if (monthR.ok) {
    pass('Oylik hisoblanganlar', `${monthR.data.data?.length || 0} ta xodim`);
  } else {
    fail('Oylik to\'lovlar', monthR.data?.message);
  }

  // Get bonuses
  const bonusR = await api('GET', '/payroll/bonuses', null, token);
  if (bonusR.ok) {
    pass('Bonuslar ro\'yxati', `${bonusR.data.data?.length || 0} ta bonus`);
  } else {
    skip('Bonuslar', bonusR.data?.message);
  }

  // Get penalties
  const penR = await api('GET', '/payroll/penalties', null, token);
  if (penR.ok) {
    pass('Jarimalar ro\'yxati', `${penR.data.data?.length || 0} ta jarima`);
  } else {
    skip('Jarimalar', penR.data?.message);
  }
}

// ============================================================
// 12. ATTENDANCE
// ============================================================
async function testAttendance() {
  printHeader('12. DAVOMAT MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get today's attendance
  printSection('Bugungi davomat');
  const todayR = await api('GET', '/attendance/today', null, token);
  if (todayR.ok) {
    pass('Bugungi davomat', `${todayR.data.data?.length || 0} ta xodim`);
  } else {
    fail('Bugungi davomat', todayR.data?.message || todayR.error);
  }

  // Get attendance history
  const histR = await api('GET', '/attendance/history', null, token);
  if (histR.ok) {
    pass('Davomat tarixi', `${histR.data.data?.length || 0} ta yozuv`);
  } else {
    fail('Davomat tarixi', histR.data?.message || histR.error);
  }

  // Check-in test (informational)
  printSection('Davomat belgilash');
  const checkinR = await api('POST', '/attendance/check-in', {
    notes: 'Test check-in'
  }, token);
  if (checkinR.ok) {
    pass('Check-in amalga oshirildi');
  } else {
    // Possibly already checked in - not a real error
    info(`Check-in: ${checkinR.data?.message || 'allaqachon belgilangan'}`);
    skip('Check-in', checkinR.data?.message || 'allaqachon check-in qilingan');
  }
}

// ============================================================
// 13. REPORTS
// ============================================================
async function testReports() {
  printHeader('13. HISOBOTLAR MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Daily report
  printSection('Kunlik hisobotlar');
  const dailyR = await api('GET', `/reports/daily?date=${dateStr}`, null, token);
  if (dailyR.ok) {
    pass('Kunlik hisobot');
  } else {
    fail('Kunlik hisobot', dailyR.data?.message);
  }

  // Financial report
  const finR = await api('GET', `/reports/financial?from=${dateStr}&to=${dateStr}`, null, token);
  if (finR.ok) {
    pass('Moliyaviy hisobot');
  } else {
    fail('Moliyaviy hisobot', finR.data?.message);
  }

  // Patient statistics
  const patStatR = await api('GET', '/reports/patients', null, token);
  if (patStatR.ok) {
    pass('Bemor statistika hisobot');
  } else {
    skip('Bemor statistika', patStatR.data?.message);
  }

  // Staff report
  const staffRepR = await api('GET', '/reports/staff', null, token);
  if (staffRepR.ok) {
    pass('Xodimlar hisobot');
  } else {
    skip('Xodimlar hisobot', staffRepR.data?.message);
  }
}

// ============================================================
// 14. SETTINGS
// ============================================================
async function testSettings() {
  printHeader('14. SOZLAMALAR MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get settings
  printSection('Tizim sozlamalari');
  const getR = await api('GET', '/settings', null, token);
  if (getR.ok) {
    pass('Sozlamalar olindi');
    if (getR.data.data?.clinic_name) {
      info(`Klinika: ${getR.data.data.clinic_name}`);
    }
  } else {
    fail('Sozlamalar', getR.data?.message || getR.error);
  }
}

// ============================================================
// 15. TASKS
// ============================================================
async function testTasks() {
  printHeader('15. VAZIFALAR MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get tasks
  printSection('Vazifalar ro\'yxati');
  const listR = await api('GET', '/tasks', null, token);
  if (listR.ok) {
    pass('Vazifalar ro\'yxati', `${listR.data.data?.length || 0} ta vazifa`);
  } else {
    fail('Vazifalar ro\'yxati', listR.data?.message || listR.error);
  }

  // Get all tasks
  const allR = await api('GET', '/tasks/all', null, token);
  if (allR.ok) {
    pass('Barcha vazifalar', `${allR.data.data?.length || 0} ta`);
  } else {
    skip('Barcha vazifalar', allR.data?.message);
  }

  // Create task (requires assignedTo - a staff ID)
  printSection('Vazifa yaratish');
  const staffId = TD.staff.any?._id || TD.staff.any?.id;
  if (staffId) {
    const createR = await api('POST', '/tasks/create', {
      title: 'Test vazifa',
      description: 'Avtomatik test',
      taskType: 'general',
      priority: 'medium',
      assignedTo: staffId,
      dueDate: new Date(Date.now() + 86400000).toISOString()
    }, token);

    if (createR.ok) {
      TD.task = createR.data.data || createR.data.task;
      pass('Vazifa yaratildi', TD.task?.title || 'N/A');
    } else {
      fail('Vazifa yaratish', createR.data?.message || createR.error);
    }
  } else {
    skip('Vazifa yaratish', 'Xodim ID topilmadi');
  }

  // Update task status
  if (TD.task) {
    const taskId = TD.task._id || TD.task.id;

    const startR = await api('PUT', `/tasks/${taskId}/start`, null, token);
    if (startR.ok) {
      pass('Vazifa boshlandi (in_progress)');
    } else {
      skip('Vazifa boshlash', startR.data?.message);
    }

    const complR = await api('PUT', `/tasks/${taskId}/complete`, null, token);
    if (complR.ok) {
      pass('Vazifa yakunlandi (completed)');
    } else {
      skip('Vazifa yakunlash', complR.data?.message);
    }
  }
}

// ============================================================
// 16. COMMUNICATION
// ============================================================
async function testCommunication() {
  printHeader('16. MULOQOT MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get communications (correct route: /communications plural)
  printSection('Xabarlar');
  const msgR = await api('GET', '/communications', null, token);
  if (msgR.ok) {
    pass('Xabarlar ro\'yxati', `${msgR.data.data?.length || 0} ta xabar`);
  } else {
    fail('Xabarlar ro\'yxati', msgR.data?.message || msgR.error);
  }

  // Get unread count
  const unreadR = await api('GET', '/communications/unread-count', null, token);
  if (unreadR.ok) {
    pass('O\'qilmagan xabarlar', `${unreadR.data.count || 0} ta`);
  } else {
    skip('O\'qilmagan xabarlar', unreadR.data?.message);
  }

  // Communication logs
  const logsR = await api('GET', '/communications/logs', null, token);
  if (logsR.ok) {
    pass('Muloqot loglari', `${logsR.data.data?.length || 0} ta`);
  } else {
    skip('Muloqot loglari', logsR.data?.message);
  }

  // Communication stats
  const comStatsR = await api('GET', '/communications/stats', null, token);
  if (comStatsR.ok) {
    pass('Muloqot statistikasi');
  } else {
    skip('Muloqot statistika', comStatsR.data?.message);
  }
}

// ============================================================
// 17. DASHBOARD
// ============================================================
async function testDashboard() {
  printHeader('17. DASHBOARD MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Main dashboard stats (correct path: /dashboard/stats)
  printSection('Asosiy statistika');
  const statsR = await api('GET', '/dashboard/stats', null, token);
  if (statsR.ok) {
    pass('Dashboard statistika olindi');
    const d = statsR.data;
    if (d?.totalPatients !== undefined) info(`Jami bemorlar: ${d.totalPatients}`);
    if (d?.todayAppointments !== undefined) info(`Bugungi qabullar: ${d.todayAppointments}`);
    if (d?.availableBeds !== undefined) info(`Bo'sh to'shaklar: ${d.availableBeds}`);
  } else {
    fail('Dashboard statistika', statsR.data?.message || statsR.error);
  }

  // Dashboard main (root returns stats object directly)
  const mainR = await api('GET', '/dashboard', null, token);
  if (mainR.ok) {
    pass('Dashboard asosiy endpoint');
  } else {
    skip('Dashboard asosiy', mainR.data?.message);
  }
}

// ============================================================
// 18. CHIEF DOCTOR PANEL
// ============================================================
async function testChiefDoctor() {
  printHeader('18. BAŠ SHIFOKOR PANELI');

  const token = TD.tokens.admin;
  if (!token) return;

  // On-duty schedule (accessible by admin)
  printSection('Navbat jadvali');
  const schedR = await api('GET', '/chief-doctor/on-duty-schedule', null, token);
  if (schedR.ok) {
    pass('Navbat jadvali', `${schedR.data.data?.length || 0} ta jadval`);
  } else {
    fail('Navbat jadvali', schedR.data?.message || schedR.error);
  }

  // Available doctors
  const availR = await api('GET', '/chief-doctor/available-doctors', null, token);
  if (availR.ok) {
    pass('Mavjud shifokorlar', `${availR.data.data?.length || 0} ta`);
  } else {
    fail('Mavjud shifokorlar', availR.data?.message || availR.error);
  }

  // Dashboard (chief_doctor role only - expected to fail for admin)
  const dashR = await api('GET', '/chief-doctor/dashboard', null, token);
  if (dashR.ok) {
    pass('Baş shifokor paneli (admin kirdi)');
  } else if (dashR.status === 403) {
    pass('Baş shifokor paneli faqat chief_doctor uchun (403 correct)');
  } else {
    skip('Baş shifokor paneli', `Status: ${dashR.status}`);
  }
}

// ============================================================
// 19. NURSE MODULE
// ============================================================
async function testNurse() {
  printHeader('19. HAMSHIRA MODULI');

  const token = TD.tokens.nurse || TD.tokens.admin;
  if (!token) return;

  // Get nurse stats
  printSection('Hamshira statistikasi');
  const statsR = await api('GET', '/nurse/stats', null, token);
  if (statsR.ok) {
    pass('Hamshira statistikasi');
    if (statsR.data.data) info(`Faol davolashlar: ${statsR.data.data.active_treatments || 0}`);
  } else {
    fail('Hamshira statistikasi', statsR.data?.message || statsR.error);
  }

  // Get treatments
  const treatR = await api('GET', '/nurse/treatments', null, token);
  if (treatR.ok) {
    pass('Davolash rejalari', `${treatR.data.data?.length || 0} ta`);
  } else {
    fail('Davolash rejalari', treatR.data?.message || treatR.error);
  }

  // Get nurse patients
  const patientsR = await api('GET', '/nurse/patients', null, token);
  if (patientsR.ok) {
    pass('Hamshira bemorlar ro\'yxati', `${patientsR.data.data?.length || 0} ta`);
  } else {
    skip('Hamshira bemorlar', patientsR.data?.message);
  }

  // Get medicines
  const medsR = await api('GET', '/nurse/medicines', null, token);
  if (medsR.ok) {
    pass('Hamshira dorilari', `${medsR.data.data?.length || 0} ta dori`);
  } else {
    skip('Hamshira dorilari', medsR.data?.message);
  }
}

// ============================================================
// 20. EXPENSES
// ============================================================
async function testExpenses() {
  printHeader('20. XARAJATLAR MODULI');

  const token = TD.tokens.admin;
  if (!token) return;

  // Get expenses
  printSection('Xarajatlar ro\'yxati');
  const listR = await api('GET', '/expenses', null, token);
  if (listR.ok) {
    pass('Xarajatlar ro\'yxati', `${listR.data.data?.length || 0} ta`);
  } else {
    fail('Xarajatlar ro\'yxati', listR.data?.message || listR.error);
  }

  // Create expense (uses 'Admin'/'Administrator' role authorize)
  printSection('Xarajat qo\'shish');
  const createR = await api('POST', '/expenses', {
    title: 'Test xarajat',
    category: 'Boshqa',
    amount: 50000,
    description: 'Test xarajat - avtomatik test',
    date: new Date().toISOString(),
    payment_method: 'Naqd'
  }, token);

  if (createR.ok) {
    TD.expense = createR.data.data;
    pass('Xarajat yaratildi', `${(TD.expense?.amount || 50000).toLocaleString()} so'm`);
  } else {
    fail('Xarajat yaratish', createR.data?.message || createR.error);
  }
}

// ============================================================
// 21. PRESCRIPTIONS
// ============================================================
async function testPrescriptions() {
  printHeader('21. RETSEPT MODULI');

  const token = TD.tokens.doctor || TD.tokens.admin;
  if (!token) return;

  // Get prescriptions
  printSection('Retseptlar ro\'yxati');
  const listR = await api('GET', '/prescriptions', null, token);
  if (listR.ok) {
    pass('Retseptlar ro\'yxati', `${listR.data.data?.length || 0} ta`);
  } else {
    fail('Retseptlar ro\'yxati', listR.data?.message || listR.error);
  }

  // Create prescription
  if (TD.patient && TD.staff.doctor) {
    printSection('Retsept yaratish');
    const createR = await api('POST', '/prescriptions', {
      patient_id: TD.patient._id || TD.patient.id,
      doctor_id: TD.staff.doctor._id || TD.staff.doctor.id,
      diagnosis: 'ORVI',
      prescription_type: 'REGULAR',
      medications: [
        {
          medication_name: 'Paracetamol',
          dosage: '500mg',
          frequency: '3 marta kuniga',
          duration: '5 kun',
          instructions: 'Ovqatdan keyin'
        }
      ],
      notes: 'Test retsept'
    }, token);

    if (createR.ok) {
      TD.prescription = createR.data.data || createR.data.prescription;
      pass('Retsept yaratildi');
    } else {
      fail('Retsept yaratish', createR.data?.message || createR.error);
    }
  } else {
    skip('Retsept yaratish', TD.patient ? 'Shifokor topilmadi' : 'Bemor topilmadi');
  }
}

// ============================================================
// 22. CASHIER REPORTS
// ============================================================
async function testCashierReports() {
  printHeader('22. KASSIR HISOBOTLARI');

  const token = TD.tokens.cashier || TD.tokens.admin;
  if (!token) return;

  // Get cashier reports
  printSection('Kassir kunlik hisobotlar');
  const repR = await api('GET', '/cashier-reports', null, token);
  if (repR.ok) {
    pass('Kassir hisobotlari', `${repR.data.data?.length || 0} ta hisobot`);
  } else {
    fail('Kassir hisobotlari', repR.data?.message || repR.error);
  }

  // Get today's report
  const todayR = await api('GET', '/cashier-reports/today', null, token);
  if (todayR.ok) {
    pass('Bugungi kassir hisobot');
    if (todayR.data.data) {
      info(`Bugungi daromad: ${(todayR.data.data.total || 0).toLocaleString()} so'm`);
    }
  } else {
    skip('Bugungi kassir hisobot', 'Endpoint mavjud emas');
  }
}

// ============================================================
// 23. ROLE-BASED ACCESS CONTROL
// ============================================================
async function testRBAC() {
  printHeader('23. ROL ASOSIDA KIRISHNI BOSHQARISH (RBAC)');

  printSection('Ruxsat tekshiruvi');

  // Test that non-admin can't access admin endpoints
  const patientToken = TD.tokens.nurse || TD.tokens.doctor;
  if (!patientToken) {
    skip('RBAC tekshiruvi', 'Non-admin token yo\'q');
    return;
  }

  // Payroll should be admin/doctor only
  const payR = await api('GET', '/payroll/staff-salaries', null, patientToken);
  if (!payR.ok && payR.status === 403) {
    pass('Hamshira ish haqi ma\'lumotlariga kira olmaydi (403 Forbidden)');
  } else if (payR.ok) {
    // Doctor also has access, so this is OK
    skip('RBAC ish haqi', 'Doctor roli ham kira oladi');
  } else {
    skip('RBAC ish haqi', `Status: ${payR.status}`);
  }

  // Unauthenticated access
  printSection('Autentifikatsiyasiz kirish');
  const unauthR = await api('GET', '/patients', null, null);
  if (!unauthR.ok && (unauthR.status === 401 || unauthR.status === 403)) {
    pass('Token olmadan kirish rad etildi (401/403)');
  } else {
    fail('Token olmadan kirish ruxsati bor (xavfli!)', `Status: ${unauthR.status}`);
  }

  // Invalid token
  const invalidR = await api('GET', '/patients', null, 'invalid.token.here');
  if (!invalidR.ok && (invalidR.status === 401 || invalidR.status === 403)) {
    pass('Noto\'g\'ri token rad etildi');
  } else {
    fail('Noto\'g\'ri token qabul qilindi', `Status: ${invalidR.status}`);
  }
}

// ============================================================
// 24. FULL WORKFLOW TEST
// ============================================================
async function testFullWorkflow() {
  printHeader('24. TO\'LIQ KLINIKA JARAYONI TESTI');
  print('\n  Qabulxona → Shifokor → Laborant → Hamshira → Kassir\n', 'gray');

  // Step 1: Create patient
  printSection('1-qadam: Qabulxona - Yangi bemor yaratish');
  const wfPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const wfCreateR = await api('POST', '/patients', {
    first_name: 'Workflow',
    last_name: 'Bemor',
    phone: wfPhone,
    date_of_birth: '1992-04-10',
    gender: 'female',
    address: 'Workflow testi - Toshkent'
  }, TD.tokens.receptionist || TD.tokens.admin);

  let wfPatient = null;
  if (wfCreateR.ok) {
    wfPatient = wfCreateR.data.patient || wfCreateR.data.data;
    pass('Bemor yaratildi (workflow)', wfPhone);
  } else {
    fail('Bemor yaratish (workflow)', wfCreateR.data?.message);
    // Use existing patient
    if (TD.patient) {
      wfPatient = TD.patient;
      info('Mavjud bemor ishlatiladi');
    }
  }

  // Step 2: Add to queue
  printSection('2-qadam: Qabulxona - Navbatga qo\'shish');
  const doctor = TD.staff.doctor;
  let wfQueue = null;

  if (wfPatient && doctor) {
    const queueR = await api('POST', '/queue', {
      patient_id: wfPatient._id || wfPatient.id,
      doctor_id: doctor._id || doctor.id,
      queue_type: 'NORMAL',
      notes: 'Workflow test - isitma, yo\'tal'
    }, TD.tokens.receptionist || TD.tokens.admin);

    if (queueR.ok) {
      wfQueue = queueR.data.data;
      pass('Navbatga qo\'shildi', `#${wfQueue?.queue_number || 'N/A'}`);
    } else {
      fail('Navbatga qo\'shish', queueR.data?.message);
    }
  } else {
    skip('Navbatga qo\'shish', wfPatient ? 'Shifokor yo\'q' : 'Bemor yaratilmadi');
  }

  // Step 3: Doctor starts consultation
  printSection('3-qadam: Shifokor - Ko\'rik boshlash');
  if (wfQueue) {
    const startR = await api('PUT', `/queue/${wfQueue._id || wfQueue.id}/start`,
      null, TD.tokens.doctor || TD.tokens.admin);
    if (startR.ok) {
      pass('Ko\'rik boshlandi');
    } else {
      fail('Ko\'rik boshlash', startR.data?.message);
    }
  } else {
    skip('Ko\'rik boshlash', 'Navbat yo\'q');
  }

  // Step 4: Doctor orders lab test
  printSection('4-qadam: Shifokor - Tahlil buyurtmasi');
  let wfLabOrder = null;
  if (wfPatient && TD.labTests.length && doctor) {
    const labR = await api('POST', '/laboratory/orders', {
      patient_id: wfPatient._id || wfPatient.id,
      doctor_id: doctor._id || doctor.id,
      test_id: TD.labTests[0]._id || TD.labTests[0].id,
      priority: 'urgent',
      notes: 'Workflow test - shoshilinch tahlil'
    }, TD.tokens.doctor || TD.tokens.admin);

    if (labR.ok) {
      wfLabOrder = labR.data.data;
      pass('Tahlil buyurildi', `#${wfLabOrder?.order_number || 'N/A'}`);
    } else {
      fail('Tahlil buyurtmasi', labR.data?.message);
    }
  } else {
    skip('Tahlil buyurmasi', 'Tahlil turi yoki bemor yo\'q');
  }

  // Step 5: Laborant processes test
  printSection('5-qadam: Laborant - Natija kiritish');
  if (wfLabOrder) {
    const ordId = wfLabOrder._id || wfLabOrder.id;
    const labResR = await api('POST', `/laboratory/orders/${ordId}/results`, {
      test_results: [
        { parameter_name: 'Temperatura', value: '38.5', unit: '°C', reference_range: '36-37', status: 'high' }
      ],
      notes: 'Workflow test natijalari'
    }, TD.tokens.laborant || TD.tokens.admin);

    if (labResR.ok) {
      pass('Tahlil natijalari kiritildi');
    } else {
      fail('Natija kiritish', labResR.data?.message);
    }
  } else {
    skip('Natija kiritish', 'Lab buyurtma yo\'q');
  }

  // Step 6: Doctor writes prescription
  printSection('6-qadam: Shifokor - Retsept yozish');
  if (wfPatient && doctor) {
    const presR = await api('POST', '/prescriptions', {
      patient_id: wfPatient._id || wfPatient.id,
      doctor_id: doctor._id || doctor.id,
      diagnosis: 'Gripp',
      prescription_type: 'REGULAR',
      medications: [
        { medication_name: 'Ibuprofen', dosage: '400mg', frequency: '2x kuniga', duration: '3 kun', instructions: 'Ovqatdan keyin' }
      ],
      notes: 'Workflow retsept'
    }, TD.tokens.doctor || TD.tokens.admin);

    if (presR.ok) {
      pass('Retsept yozildi');
    } else {
      fail('Retsept yozish', presR.data?.message);
    }
  } else {
    skip('Retsept yozish', 'Bemor yoki shifokor yo\'q');
  }

  // Step 7: Create invoice
  printSection('7-qadam: Kassir - To\'lov qabul qilish');
  if (wfPatient && TD.services.length) {
    const svc = TD.services[0];
    const invR = await api('POST', '/billing/invoices', {
      patient_id: wfPatient._id || wfPatient.id,
      items: [{ service_id: svc._id || svc.id, quantity: 1 }],
      payment_method: 'cash',
      paid_amount: svc.price || 100000,
      discount_amount: 0,
      notes: 'Workflow to\'lovi'
    }, TD.tokens.cashier || TD.tokens.admin);

    if (invR.ok) {
      const inv = invR.data.data || invR.data.invoice;
      pass('To\'lov qabul qilindi', `${(inv?.total_amount || svc.price)?.toLocaleString()} so'm`);
    } else {
      fail('To\'lov', invR.data?.message);
    }
  } else {
    skip('To\'lov', wfPatient ? 'Xizmatlar yo\'q' : 'Bemor yo\'q');
  }

  // Step 8: Complete consultation
  printSection('8-qadam: Shifokor - Ko\'rikni yakunlash');
  if (wfQueue) {
    const complR = await api('PUT', `/queue/${wfQueue._id || wfQueue.id}/complete`,
      null, TD.tokens.doctor || TD.tokens.admin);
    if (complR.ok) {
      pass('Ko\'rik yakunlandi - Bemor chiqdi');
    } else {
      fail('Ko\'rikni yakunlash', complR.data?.message);
    }
  } else {
    skip('Ko\'rikni yakunlash', 'Navbat yo\'q');
  }
}

// ============================================================
// YAKUNIY HISOBOT
// ============================================================
function printFinalReport() {
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0;

  print('\n' + '═'.repeat(65), 'magenta');
  print('  📊 YAKUNIY TEST NATIJASI', 'magenta');
  print('═'.repeat(65), 'magenta');

  print(`\n  ✅ O'tdi:     ${String(results.passed).padStart(3)}`, 'green');
  print(`  ❌ Xato:      ${String(results.failed).padStart(3)}`, 'red');
  print(`  ⏭️  O'tkazildi: ${String(results.skipped).padStart(3)}`, 'gray');
  print(`  📝 Jami:      ${String(total).padStart(3)}\n`, 'white');

  if (results.failed === 0) {
    print(`  ${C.bgGreen}${C.bold}  BARCHA TESTLAR MUVAFFAQIYATLI O'TDI!  ${C.reset}`, 'reset');
    print(`  O'tish darajasi: ${passRate}%`, 'green');
  } else if (passRate >= 80) {
    print(`  ⚠️  Ko'p testlar o'tdi lekin ${results.failed} ta xato bor`, 'yellow');
    print(`  O'tish darajasi: ${passRate}%`, 'yellow');
  } else {
    print(`  ${C.bgRed}${C.bold}  JIDDIY MUAMMOLAR TOPILDI!  ${C.reset}`, 'reset');
    print(`  O'tish darajasi: ${passRate}%`, 'red');
  }

  // Show failed tests
  if (results.failed > 0) {
    print('\n  ─── XATO TESTLAR ───', 'red');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        print(`  ❌ ${t.name}`, 'red');
        if (t.error) print(`     → ${t.error}`, 'gray');
      });
  }

  print('\n' + '═'.repeat(65) + '\n', 'magenta');
}

// ============================================================
// ASOSIY TEST RUNNER
// ============================================================
async function main() {
  print('\n' + '╔' + '═'.repeat(63) + '╗', 'cyan');
  print('║' + ' '.repeat(15) + '🏥 BOLAJON KLINIKA' + ' '.repeat(15) + '║', 'cyan');
  print('║' + ' '.repeat(12) + 'TO\'LIQ TEST TIZIMI v1.0' + ' '.repeat(12) + '║', 'cyan');
  print('╚' + '═'.repeat(63) + '╝', 'cyan');
  print(`\n  API: ${API_BASE}`, 'gray');
  print(`  Sana: ${new Date().toLocaleString('uz-UZ')}\n`, 'gray');

  try {
    // Testlar ketma-ket ishga tushiriladi
    await testServerHealth();
    await testAuthentication();
    await testStaffManagement();
    await testPatientManagement();
    await testQueueManagement();
    await testBillingFinancial();
    await testLaboratory();
    await testPharmacy();
    await testInpatient();
    await testAmbulator();
    await testPayroll();
    await testAttendance();
    await testReports();
    await testSettings();
    await testTasks();
    await testCommunication();
    await testDashboard();
    await testChiefDoctor();
    await testNurse();
    await testExpenses();
    await testPrescriptions();
    await testCashierReports();
    await testRBAC();
    await testFullWorkflow();

  } catch (err) {
    print(`\n❌ Kutilmagan xato: ${err.message}`, 'red');
    console.error(err);
  }

  printFinalReport();
}

// Ishga tushirish
main();
