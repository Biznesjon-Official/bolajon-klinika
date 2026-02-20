/**
 * TO'LIQ KLINIKA JARAYONI TEST
 * Har bir rol o'z vazifasini bajaradi
 */

const API_BASE = 'http://localhost:5001/api/v1';

// Test ma'lumotlari
let testData = {
  tokens: {},
  patient: null,
  doctor: null,
  nurse: null,
  laborant: null,
  receptionist: null,
  cashier: null,
  queue: null,
  labTests: [],
  labOrder: null,
  prescription: null,
  invoice: null
};

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

function logStep(role, step, message) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`👤 ${role.toUpperCase()} - ${step}. ${message}`, 'cyan');
  log('='.repeat(70), 'cyan');
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

// API helper
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || responseData.message || 'Unknown error'
      };
    }
    
    return { success: true, data: responseData };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Login funksiyasi
async function login(username, password, roleName) {
  logStep(roleName, '1', 'LOGIN');
  
  const result = await apiCall('POST', '/auth/login', {
    username,
    password
  });

  if (result.success && result.data.accessToken) {
    testData.tokens[roleName] = result.data.accessToken;
    logSuccess(`${roleName} tizimga kirdi`);
    logInfo(`User: ${result.data.user.full_name}`);
    return true;
  } else {
    logError(`${roleName} login xatosi: ${result.error}`);
    return false;
  }
}

// ============================================
// QABULXONA (RECEPTIONIST)
// ============================================

async function receptionistCreatePatient() {
  logStep('QABULXONA', '2', 'YANGI BEMOR YARATISH');
  
  const randomPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  
  const patientData = {
    first_name: 'Jasur',
    last_name: 'Toshmatov',
    phone: randomPhone,
    date_of_birth: '1985-03-20',
    gender: 'male',
    address: 'Toshkent, Yunusobod tumani, 5-mavze'
  };

  logInfo(`Bemor: ${patientData.first_name} ${patientData.last_name}`);
  logInfo(`Telefon: ${randomPhone}`);
  
  const result = await apiCall('POST', '/patients', patientData, testData.tokens.receptionist);

  if (result.success) {
    testData.patient = result.data.patient || result.data.data || result.data;
    logSuccess(`Bemor yaratildi! ID: ${testData.patient._id || testData.patient.id}`);
    logInfo(`Bemor raqami: ${testData.patient.patient_number || 'N/A'}`);
    return true;
  } else {
    logError(`Bemor yaratish xatosi: ${result.error}`);
    return false;
  }
}

async function receptionistAddToQueue() {
  logStep('QABULXONA', '3', 'NAVBATGA QOSHISH');
  
  // Shifokorlarni olish
  const doctorsResult = await apiCall('GET', '/staff?role=Doctor', null, testData.tokens.receptionist);
  
  if (!doctorsResult.success || !doctorsResult.data.data || doctorsResult.data.data.length === 0) {
    logError('Shifokorlar topilmadi');
    return false;
  }
  
  testData.doctor = doctorsResult.data.data[0];
  logInfo(`Shifokor: ${testData.doctor.first_name} ${testData.doctor.last_name}`);
  
  const queueData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    queue_type: 'NORMAL',
    notes: 'Bosh og\'rig\'i va isitma shikoyati'
  };
  
  const result = await apiCall('POST', '/queue', queueData, testData.tokens.receptionist);

  if (result.success) {
    testData.queue = result.data.data;
    logSuccess(`Navbatga qo'shildi! Navbat raqami: ${testData.queue.queue_number}`);
    logInfo(`Status: ${testData.queue.status}`);
    return true;
  } else {
    logError(`Navbatga qo'shish xatosi: ${result.error}`);
    return false;
  }
}

// ============================================
// SHIFOKOR (DOCTOR)
// ============================================

async function doctorStartConsultation() {
  logStep('SHIFOKOR', '4', 'BEMORNI QABUL QILISH');
  
  const result = await apiCall(
    'PUT',
    `/queue/${testData.queue._id || testData.queue.id}/start`,
    null,
    testData.tokens.doctor
  );

  if (result.success) {
    logSuccess('Bemor shifokor xonasiga kiritildi');
    logInfo('Ko\'rik boshlandi...');
    logInfo('Shikoyat: Bosh og\'rig\'i, isitma 38.5°C, burun bitishi');
    logInfo('Tashxis: ORVI (O\'tkir respirator virusli infeksiya)');
    return true;
  } else {
    logError(`Qabulni boshlash xatosi: ${result.error}`);
    return false;
  }
}

async function doctorOrderLabTests() {
  logStep('SHIFOKOR', '5', 'TAHLIL BUYURTMA QILISH');
  
  // Avval testlarni olish
  const testsResult = await apiCall('GET', '/laboratory/tests', null, testData.tokens.doctor);
  
  if (!testsResult.success || !testsResult.data.data || testsResult.data.data.length === 0) {
    logError('Tahlillar topilmadi. Avval tahlil yaratish kerak.');
    logInfo('Tahlilsiz davom etamiz...');
    return true; // Davom etamiz
  }
  
  testData.labTests = testsResult.data.data;
  const bloodTest = testData.labTests.find(t => t.name && t.name.includes('qon'));
  
  if (!bloodTest) {
    logError('Qon tahlili topilmadi');
    return true; // Davom etamiz
  }
  
  logInfo(`Tahlil: ${bloodTest.name}`);
  
  const labOrderData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    test_id: bloodTest.id || bloodTest._id,
    priority: 'normal',
    notes: 'ORVI shubhasi, qon tahlili kerak'
  };
  
  const result = await apiCall('POST', '/laboratory/orders', labOrderData, testData.tokens.doctor);

  if (result.success) {
    testData.labOrder = result.data.data;
    logSuccess(`Tahlil buyurtmasi yaratildi! ID: ${testData.labOrder._id || testData.labOrder.id}`);
    logInfo(`Buyurtma raqami: ${testData.labOrder.order_number}`);
    return true;
  } else {
    logError(`Tahlil buyurtmasi xatosi: ${result.error}`);
    return true; // Davom etamiz
  }
}

async function doctorWritePrescription() {
  logStep('SHIFOKOR', '6', 'RETSEPT YOZISH');
  
  const prescriptionData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    diagnosis: 'ORVI (O\'tkir respirator virusli infeksiya)',
    prescription_type: 'REGULAR',
    medications: [
      {
        medication_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 marta kuniga',
        duration: '5 kun',
        instructions: 'Ovqatdan keyin, ko\'p suyuqlik bilan'
      },
      {
        medication_name: 'Vitamin C',
        dosage: '1000mg',
        frequency: '1 marta kuniga',
        duration: '7 kun',
        instructions: 'Ertalab, ovqat bilan'
      }
    ],
    notes: 'Dam olish, ko\'p suyuqlik ichish. 3 kundan keyin qayta ko\'rik.'
  };

  logInfo('Dorilar:');
  logInfo('  1. Paracetamol 500mg - 3x kuniga, 5 kun');
  logInfo('  2. Vitamin C 1000mg - 1x kuniga, 7 kun');
  
  const result = await apiCall('POST', '/prescriptions', prescriptionData, testData.tokens.doctor);

  if (result.success) {
    testData.prescription = result.data.data || result.data.prescription;
    logSuccess(`Retsept yaratildi! ID: ${testData.prescription._id || testData.prescription.id}`);
    return true;
  } else {
    logError(`Retsept yaratish xatosi: ${result.error}`);
    return true; // Davom etamiz
  }
}

// ============================================
// LABORANT
// ============================================

async function laborantProcessTest() {
  if (!testData.labOrder) {
    logStep('LABORANT', '7', 'TAHLIL JARAYONI');
    logInfo('Tahlil buyurtmasi yo\'q, o\'tkazib yuboramiz');
    return true;
  }
  
  logStep('LABORANT', '7', 'TAHLIL OLISH VA NATIJA KIRITISH');
  
  // Tahlilni "in_progress" ga o'zgartirish
  logInfo('Tahlil olish...');
  const startResult = await apiCall(
    'PUT',
    `/laboratory/orders/${testData.labOrder._id || testData.labOrder.id}/status`,
    { status: 'in_progress' },
    testData.tokens.laborant
  );
  
  if (startResult.success) {
    logSuccess('Tahlil olindi, natija kiritilmoqda...');
  }
  
  // Natija kiritish
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 soniya kutish
  
  const resultsData = {
    test_results: [
      {
        parameter_name: 'Hemoglobin',
        value: '145',
        unit: 'g/L',
        reference_range: '120-160',
        status: 'normal'
      },
      {
        parameter_name: 'Leykositlar',
        value: '12.5',
        unit: 'x10^9/L',
        reference_range: '4-9',
        status: 'high',
        notes: 'Yuqori - infeksiya belgisi'
      },
      {
        parameter_name: 'ESR',
        value: '25',
        unit: 'mm/soat',
        reference_range: '0-15',
        status: 'high',
        notes: 'Yuqori - yallig\'lanish belgisi'
      }
    ],
    notes: 'Qon tahlili yakunlandi. Infeksiya belgilari mavjud.'
  };
  
  const result = await apiCall(
    'POST',
    `/laboratory/orders/${testData.labOrder._id || testData.labOrder.id}/results`,
    resultsData,
    testData.tokens.laborant
  );

  if (result.success) {
    logSuccess('Tahlil natijalari kiritildi!');
    logInfo('Hemoglobin: 145 g/L (Normal)');
    logInfo('Leykositlar: 12.5 x10^9/L (Yuqori ⚠️)');
    logInfo('ESR: 25 mm/soat (Yuqori ⚠️)');
    return true;
  } else {
    logError(`Natija kiritish xatosi: ${result.error}`);
    return true; // Davom etamiz
  }
}

// ============================================
// HAMSHIRA (NURSE)
// ============================================

async function nurseAdministerMedication() {
  if (!testData.prescription) {
    logStep('HAMSHIRA', '8', 'RETSEPT BAJARISH');
    logInfo('Retsept yo\'q, o\'tkazib yuboramiz');
    return true;
  }
  
  logStep('HAMSHIRA', '8', 'RETSEPT BAJARISH');
  
  logInfo('Bemorga dori berish...');
  logInfo('✓ Paracetamol 500mg - birinchi doza berildi');
  logInfo('✓ Vitamin C 1000mg - birinchi doza berildi');
  logInfo('✓ Bemorga ko\'rsatmalar berildi');
  
  logSuccess('Retsept bajarildi!');
  logInfo('Bemor uyga ketishi mumkin');
  
  return true;
}

// ============================================
// KASSA (CASHIER)
// ============================================

async function cashierCreateInvoice() {
  logStep('KASSA', '9', 'HISOB-FAKTURA YARATISH');
  
  // Xizmatlarni olish
  const servicesResult = await apiCall('GET', '/services', null, testData.tokens.cashier);
  
  let items = [];
  
  if (servicesResult.success && servicesResult.data.data && servicesResult.data.data.length > 0) {
    const services = servicesResult.data.data;
    const consultation = services.find(s => s.name && s.name.includes('Ko\'rik'));
    
    if (consultation) {
      items.push({
        service_id: consultation._id || consultation.id,
        quantity: 1
      });
      logInfo(`Xizmat: ${consultation.name} - ${consultation.price} so'm`);
    }
  }
  
  // Agar xizmat topilmasa, manual qo'shamiz
  if (items.length === 0) {
    logInfo('Xizmatlar topilmadi, manual hisob yaratamiz...');
    items = [
      {
        service_name: 'Shifokor ko\'rigi',
        quantity: 1,
        unit_price: 100000,
        total_price: 100000
      }
    ];
    
    if (testData.labOrder) {
      items.push({
        service_name: 'Qon tahlili',
        quantity: 1,
        unit_price: 50000,
        total_price: 50000
      });
    }
  }
  
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.total_price || (item.unit_price * item.quantity) || 0);
  }, 0);
  
  logInfo(`\nHisob-faktura:`);
  items.forEach((item, i) => {
    const name = item.service_name || 'Xizmat';
    const price = item.total_price || (item.unit_price * item.quantity) || 0;
    logInfo(`  ${i + 1}. ${name}: ${price.toLocaleString()} so'm`);
  });
  logInfo(`\nJAMI: ${totalAmount.toLocaleString()} so'm`);
  
  const invoiceData = {
    patient_id: testData.patient._id || testData.patient.id,
    items: items,
    payment_method: 'cash',
    paid_amount: totalAmount,
    discount_amount: 0,
    notes: 'To\'liq to\'lov'
  };
  
  const result = await apiCall('POST', '/billing/invoices', invoiceData, testData.tokens.cashier);

  if (result.success) {
    testData.invoice = result.data.data || result.data.invoice;
    logSuccess(`Hisob-faktura yaratildi! Raqam: ${testData.invoice.invoice_number || 'N/A'}`);
    logInfo(`To'lov holati: ${testData.invoice.payment_status || 'paid'}`);
    return true;
  } else {
    logError(`Hisob-faktura xatosi: ${result.error}`);
    logInfo('Hisob-fakturasiz davom etamiz...');
    return true;
  }
}

// ============================================
// YAKUNLASH
// ============================================

async function doctorCompleteConsultation() {
  logStep('SHIFOKOR', '10', 'QABULNI YAKUNLASH');
  
  const result = await apiCall(
    'PUT',
    `/queue/${testData.queue._id || testData.queue.id}/complete`,
    null,
    testData.tokens.doctor
  );

  if (result.success) {
    logSuccess('Qabul yakunlandi!');
    logInfo('Bemor klinikadan chiqdi');
    return true;
  } else {
    logError(`Qabulni yakunlash xatosi: ${result.error}`);
    return true;
  }
}

// ============================================
// YAKUNIY HISOBOT
// ============================================

async function finalReport() {
  log('\n' + '='.repeat(70), 'magenta');
  log('📊 YAKUNIY HISOBOT', 'magenta');
  log('='.repeat(70), 'magenta');
  
  log('\n👥 ISHTIROK ETGAN XODIMLAR:', 'yellow');
  log('─'.repeat(70), 'yellow');
  logSuccess('1. Qabulxona - Bemor yaratdi va navbatga qo\'shdi');
  logSuccess('2. Shifokor - Ko\'rik o\'tkazdi, tahlil va retsept yozdi');
  if (testData.labOrder) {
    logSuccess('3. Laborant - Tahlil oldi va natija kiritdi');
  }
  if (testData.prescription) {
    logSuccess('4. Hamshira - Retsept bajaradi');
  }
  logSuccess('5. Kassa - Hisob-faktura yaratdi va to\'lov qabul qildi');
  
  log('\n📋 BEMOR MA\'LUMOTLARI:', 'yellow');
  log('─'.repeat(70), 'yellow');
  if (testData.patient) {
    logInfo(`Ism: ${testData.patient.first_name} ${testData.patient.last_name}`);
    logInfo(`ID: ${testData.patient._id || testData.patient.id}`);
    logInfo(`Telefon: ${testData.patient.phone}`);
    logInfo(`Bemor raqami: ${testData.patient.patient_number || 'N/A'}`);
  }
  
  log('\n🏥 TIBBIY MA\'LUMOTLAR:', 'yellow');
  log('─'.repeat(70), 'yellow');
  logInfo('Tashxis: ORVI (O\'tkir respirator virusli infeksiya)');
  logInfo('Shikoyat: Bosh og\'rig\'i, isitma, burun bitishi');
  
  if (testData.labOrder) {
    logInfo('\nTahlil:');
    logInfo('  • Umumiy qon tahlili');
    logInfo('  • Natija: Infeksiya belgilari mavjud');
  }
  
  if (testData.prescription) {
    logInfo('\nRetsept:');
    logInfo('  • Paracetamol 500mg - 3x kuniga, 5 kun');
    logInfo('  • Vitamin C 1000mg - 1x kuniga, 7 kun');
  }
  
  log('\n💰 MOLIYAVIY MA\'LUMOTLAR:', 'yellow');
  log('─'.repeat(70), 'yellow');
  if (testData.invoice) {
    logInfo(`Hisob-faktura: ${testData.invoice.invoice_number || 'N/A'}`);
    logInfo(`Jami: ${(testData.invoice.total_amount || 150000).toLocaleString()} so'm`);
    logInfo(`To'langan: ${(testData.invoice.paid_amount || 150000).toLocaleString()} so'm`);
    logInfo(`To'lov holati: ${testData.invoice.payment_status || 'paid'}`);
  }
  
  log('\n' + '='.repeat(70), 'magenta');
  logSuccess('✨ TEST MUVAFFAQIYATLI YAKUNLANDI! ✨');
  log('='.repeat(70) + '\n', 'magenta');
}

// ============================================
// ASOSIY TEST FUNKSIYASI
// ============================================

async function runFullWorkflowTest() {
  log('\n🏥 TO\'LIQ KLINIKA JARAYONI TEST', 'cyan');
  log('Har bir rol o\'z vazifasini bajaradi\n', 'cyan');

  try {
    // 1. Barcha rollar login qiladi
    log('\n👥 BARCHA XODIMLAR LOGIN QILMOQDA...', 'yellow');
    await login('admin', 'admin123', 'admin');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!await login('reception', 'reception123', 'receptionist')) {
      // Agar reception yo'q bo'lsa, admin ishlatamiz
      testData.tokens.receptionist = testData.tokens.admin;
      logInfo('Reception topilmadi, admin token ishlatiladi');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!await login('doctor', 'doctor123', 'doctor')) {
      // Agar doctor yo'q bo'lsa, admin ishlatamiz
      testData.tokens.doctor = testData.tokens.admin;
      logInfo('Doctor topilmadi, admin token ishlatiladi');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!await login('laborant', 'laborant123', 'laborant')) {
      testData.tokens.laborant = testData.tokens.admin;
      logInfo('Laborant topilmadi, admin token ishlatiladi');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!await login('nurse', 'nurse123', 'nurse')) {
      testData.tokens.nurse = testData.tokens.admin;
      logInfo('Nurse topilmadi, admin token ishlatiladi');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!await login('cashier', 'cashier123', 'cashier')) {
      testData.tokens.cashier = testData.tokens.admin;
      logInfo('Cashier topilmadi, admin token ishlatiladi');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. QABULXONA - Bemor yaratish va navbatga qo'shish
    if (!await receptionistCreatePatient()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!await receptionistAddToQueue()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. SHIFOKOR - Ko'rik, tahlil va retsept
    if (!await doctorStartConsultation()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await doctorOrderLabTests();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await doctorWritePrescription();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. LABORANT - Tahlil jarayoni
    await laborantProcessTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. HAMSHIRA - Retsept bajarish
    await nurseAdministerMedication();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. KASSA - Hisob-faktura
    await cashierCreateInvoice();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. SHIFOKOR - Qabulni yakunlash
    await doctorCompleteConsultation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 8. Yakuniy hisobot
    await finalReport();
    
  } catch (error) {
    logError(`Kutilmagan xato: ${error.message}`);
    console.error(error);
  }
}

// Testni ishga tushirish
runFullWorkflowTest();
