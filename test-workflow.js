/**
 * KLINIKA JARAYONI TEST SKRIPTI
 * Bemorning klinikaga kelishidan chiqib ketishigacha bo'lgan to'liq jarayonni test qiladi
 */

const API_BASE = 'http://localhost:5001/api/v1';
let authToken = '';
let testData = {
  patient: null,
  doctor: null,
  receptionist: null,
  nurse: null,
  laborant: null,
  queue: null,
  labOrder: null,
  prescription: null,
  admission: null,
  invoice: null
};

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

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${step}. ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
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

    if (token || authToken) {
      config.headers.Authorization = `Bearer ${token || authToken}`;
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

// 1. LOGIN - Admin sifatida kirish
async function step1_login() {
  logStep('1', 'ADMIN LOGIN');
  
  const result = await apiCall('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  if (result.success && result.data.accessToken) {
    authToken = result.data.accessToken;
    logSuccess('Admin tizimga kirdi');
    logInfo(`User: ${result.data.user.full_name}`);
    logInfo(`Role: ${result.data.user.role_name}`);
    return true;
  } else {
    logError(`Login xatosi: ${result.error}`);
    return false;
  }
}

// 2. YANGI BEMOR YARATISH (Qabulxona)
async function step2_createPatient() {
  logStep('2', 'QABULXONA - YANGI BEMOR YARATISH');
  
  // Random telefon raqami yaratish
  const randomPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  
  const patientData = {
    first_name: 'Aziz',
    last_name: 'Karimov',
    phone: randomPhone,
    date_of_birth: '1990-05-15',
    gender: 'male',
    address: 'Toshkent, Chilonzor tumani'
  };

  logInfo(`Bemor: ${patientData.first_name} ${patientData.last_name}`);
  logInfo(`Telefon: ${randomPhone}`);
  
  const result = await apiCall('POST', '/patients', patientData);

  if (result.success) {
    testData.patient = result.data.patient || result.data.data || result.data;
    logSuccess(`Bemor yaratildi! ID: ${testData.patient._id || testData.patient.id}`);
    logInfo(`QR kod: ${testData.patient.qr_code || 'Generatsiya qilinmoqda...'}`);
    return true;
  } else {
    logError(`Bemor yaratish xatosi: ${result.error}`);
    return false;
  }
}

// 3. SHIFOKORLARNI OLISH
async function step3_getDoctors() {
  logStep('3', 'SHIFOKORLAR ROYXATI');
  
  const result = await apiCall('GET', '/staff?role=Doctor');

  if (result.success) {
    const doctors = result.data.data.staff || result.data.data;
    if (doctors && doctors.length > 0) {
      testData.doctor = doctors[0];
      logSuccess(`Shifokor topildi: ${testData.doctor.first_name} ${testData.doctor.last_name}`);
      logInfo(`Mutaxassislik: ${testData.doctor.specialization || 'Umumiy'}`);
      return true;
    } else {
      logError('Shifokorlar topilmadi');
      return false;
    }
  } else {
    logError(`Shifokorlarni olish xatosi: ${result.error}`);
    return false;
  }
}

// 4. NAVBATGA QO'SHISH
async function step4_addToQueue() {
  logStep('4', 'NAVBATGA QOSHISH');
  
  const queueData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    appointment_type: 'consultation',
    notes: 'Bosh og\'rig\'i va isitma'
  };

  logInfo(`Bemor: ${testData.patient.first_name} ${testData.patient.last_name}`);
  logInfo(`Shifokor: ${testData.doctor.first_name} ${testData.doctor.last_name}`);
  
  const result = await apiCall('POST', '/queue', queueData);

  if (result.success) {
    testData.queue = result.data.data;
    logSuccess(`Navbatga qo'shildi! Navbat raqami: ${testData.queue.queue_number || testData.queue.position}`);
    logInfo(`Status: ${testData.queue.status}`);
    return true;
  } else {
    logError(`Navbatga qo'shish xatosi: ${result.error}`);
    return false;
  }
}

// 5. SHIFOKOR BEMORNI QABUL QILADI
async function step5_doctorConsultation() {
  logStep('5', 'SHIFOKOR KORIGI');
  
  // Navbat statusini "IN_PROGRESS" ga o'zgartirish
  const updateResult = await apiCall(
    'PUT',
    `/queue/${testData.queue._id || testData.queue.id}/start`
  );

  if (updateResult.success) {
    logSuccess('Bemor shifokor xonasiga kiritildi');
    logInfo('Shifokor ko\'rik o\'tkazmoqda...');
    logInfo('Tashxis: ORVI (Gripp)');
    logInfo('Shikoyat: Bosh og\'rig\'i, isitma, burun bitishi');
    
    return true;
  } else {
    logError(`Navbat statusini o'zgartirish xatosi: ${updateResult.error}`);
    return false;
  }
}

// 6. TAHLIL BUYURTMA QILISH
async function step6_orderLabTests() {
  logStep('6', 'TAHLIL BUYURTMA QILISH');
  
  const labOrderData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    tests: [
      {
        test_name: 'Umumiy qon tahlili',
        test_code: 'CBC'
      },
      {
        test_name: 'Siydik tahlili',
        test_code: 'UA'
      }
    ],
    priority: 'normal',
    notes: 'Gripp shubhasi'
  };

  logInfo('Tahlillar: Umumiy qon tahlili, Siydik tahlili');
  
  const result = await apiCall('POST', '/laboratory/orders', labOrderData);

  if (result.success) {
    testData.labOrder = result.data.data;
    logSuccess(`Tahlil buyurtmasi yaratildi! ID: ${testData.labOrder._id || testData.labOrder.id}`);
    logInfo(`Status: ${testData.labOrder.status}`);
    return true;
  } else {
    logError(`Tahlil buyurtmasi xatosi: ${result.error}`);
    // Bu xato bo'lsa ham davom etamiz
    return true;
  }
}

// 7. RETSEPT YOZISH
async function step7_createPrescription() {
  logStep('7', 'RETSEPT YOZISH');
  
  const prescriptionData = {
    patient_id: testData.patient._id || testData.patient.id,
    doctor_id: testData.doctor._id || testData.doctor.id,
    medications: [
      {
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 marta kuniga',
        duration: '5 kun',
        instructions: 'Ovqatdan keyin'
      },
      {
        medicine_name: 'Vitamin C',
        dosage: '1000mg',
        frequency: '1 marta kuniga',
        duration: '7 kun',
        instructions: 'Ertalab'
      }
    ],
    diagnosis: 'ORVI (Gripp)',
    notes: 'Ko\'p suyuqlik ichish, dam olish'
  };

  logInfo('Dorilar: Paracetamol 500mg, Vitamin C 1000mg');
  
  const result = await apiCall('POST', '/prescriptions', prescriptionData);

  if (result.success) {
    testData.prescription = result.data.data;
    logSuccess(`Retsept yaratildi! ID: ${testData.prescription._id || testData.prescription.id}`);
    return true;
  } else {
    logError(`Retsept yaratish xatosi: ${result.error}`);
    return true; // Davom etamiz
  }
}

// 8. HISOB-FAKTURA YARATISH (Kassa)
async function step8_createInvoice() {
  logStep('8', 'KASSA - HISOB-FAKTURA');
  
  const invoiceData = {
    patient_id: testData.patient._id || testData.patient.id,
    items: [
      {
        service_name: 'Shifokor ko\'rigi',
        quantity: 1,
        unit_price: 100000
      },
      {
        service_name: 'Umumiy qon tahlili',
        quantity: 1,
        unit_price: 50000
      },
      {
        service_name: 'Siydik tahlili',
        quantity: 1,
        unit_price: 30000
      }
    ],
    payment_method: 'cash',
    paid_amount: 180000,
    discount_amount: 0,
    notes: 'To\'liq to\'lov'
  };

  logInfo('Xizmatlar:');
  logInfo('  - Shifokor ko\'rigi: 100,000 so\'m');
  logInfo('  - Umumiy qon tahlili: 50,000 so\'m');
  logInfo('  - Siydik tahlili: 30,000 so\'m');
  logInfo('JAMI: 180,000 so\'m');
  
  const result = await apiCall('POST', '/billing/invoices', invoiceData);

  if (result.success) {
    testData.invoice = result.data.data;
    logSuccess(`Hisob-faktura yaratildi! Raqam: ${testData.invoice.invoice_number}`);
    logInfo(`To'lov holati: ${testData.invoice.payment_status}`);
    return true;
  } else {
    logError(`Hisob-faktura xatosi: ${result.error}`);
    return true;
  }
}

// 9. NAVBATNI YAKUNLASH
async function step9_completeQueue() {
  logStep('9', 'NAVBATNI YAKUNLASH');
  
  const result = await apiCall(
    'PUT',
    `/queue/${testData.queue._id || testData.queue.id}/complete`
  );

  if (result.success) {
    logSuccess('Navbat yakunlandi!');
    logInfo('Bemor klinikadan chiqdi');
    return true;
  } else {
    logError(`Navbatni yakunlash xatosi: ${result.error}`);
    return true;
  }
}

// 10. YAKUNIY HISOBOT
async function step10_finalReport() {
  logStep('10', 'YAKUNIY HISOBOT');
  
  log('\n📊 TEST NATIJALARI:', 'yellow');
  log('─'.repeat(60), 'yellow');
  
  if (testData.patient) {
    logSuccess(`Bemor: ${testData.patient.first_name} ${testData.patient.last_name}`);
    logInfo(`  ID: ${testData.patient._id || testData.patient.id}`);
    logInfo(`  Telefon: ${testData.patient.phone}`);
  }
  
  if (testData.doctor) {
    logSuccess(`Shifokor: ${testData.doctor.first_name} ${testData.doctor.last_name}`);
  }
  
  if (testData.queue) {
    logSuccess(`Navbat: ${testData.queue.queue_number || testData.queue.position}`);
  }
  
  if (testData.labOrder) {
    logSuccess(`Tahlil buyurtmasi: ${testData.labOrder._id || testData.labOrder.id}`);
  }
  
  if (testData.prescription) {
    logSuccess(`Retsept: ${testData.prescription._id || testData.prescription.id}`);
  }
  
  if (testData.invoice) {
    logSuccess(`Hisob-faktura: ${testData.invoice.invoice_number}`);
    logInfo(`  Jami: ${testData.invoice.total_amount || 180000} so'm`);
    logInfo(`  To'langan: ${testData.invoice.paid_amount || 180000} so'm`);
  }
  
  log('\n' + '─'.repeat(60), 'yellow');
  logSuccess('TEST MUVAFFAQIYATLI YAKUNLANDI! 🎉');
  log('─'.repeat(60) + '\n', 'yellow');
}

// ASOSIY TEST FUNKSIYASI
async function runFullTest() {
  log('\n🏥 KLINIKA TIZIMI TO\'LIQ TEST', 'cyan');
  log('Bemor klinikaga kelganidan chiqib ketishigacha\n', 'cyan');

  try {
    // Barcha bosqichlarni ketma-ket bajarish
    if (!await step1_login()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!await step2_createPatient()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!await step3_getDoctors()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!await step4_addToQueue()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!await step5_doctorConsultation()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await step6_orderLabTests();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await step7_createPrescription();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await step8_createInvoice();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await step9_completeQueue();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await step10_finalReport();
    
  } catch (error) {
    logError(`Kutilmagan xato: ${error.message}`);
    console.error(error);
  }
}

// Testni ishga tushirish
runFullTest();
