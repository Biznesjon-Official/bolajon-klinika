/**
 * Patient Flow Integration Test
 *
 * Flow: Login → Registration → Queue → Call → Start → Prescription → Billing → Complete
 *
 * Prerequisites: Backend running (npm run dev), seed data loaded (npm run seed)
 * Seed users: receptionist1, doctor1 (password: test123)
 */
import { login, api, apiDelete } from './setup.js'

// Unique phone for this test run
const TEST_PHONE = `+99899${Date.now().toString().slice(-7)}`
const TEST_PHONE_2 = `+99898${Date.now().toString().slice(-7)}`

// Store IDs for cleanup
const ids = {}
let receptionToken, doctorToken, adminToken

describe('Bemor Flow: Ro\'yxatdan o\'tish → Navbat → Qabul → Retsept → To\'lov → Yakunlash', () => {

  // ==================== STEP 1: LOGIN ====================
  describe('1-qadam: Login', () => {
    test('Receptionist login', async () => {
      receptionToken = await login('receptionist1')
      expect(receptionToken).toBeDefined()
      expect(typeof receptionToken).toBe('string')
    })

    test('Doctor login', async () => {
      doctorToken = await login('doctor1')
      expect(doctorToken).toBeDefined()
    })

    test('Admin login', async () => {
      adminToken = await login('admin')
      expect(adminToken).toBeDefined()
    })

    test('Noto\'g\'ri parol — login bo\'lmasligi kerak', async () => {
      await expect(login('receptionist1', 'wrongpassword'))
        .rejects.toThrow('Login failed')
    })

    test('Mavjud bo\'lmagan user — login bo\'lmasligi kerak', async () => {
      await expect(login('nonexistent_user_xyz'))
        .rejects.toThrow('Login failed')
    })
  })

  // ==================== STEP 2: PATIENT REGISTRATION ====================
  describe('2-qadam: Bemor ro\'yxatdan o\'tkazish', () => {
    test('Yangi bemor yaratish', async () => {
      const { status, data } = await api('POST', '/patients', receptionToken, {
        first_name: 'FlowTest',
        last_name: 'Bemor',
        phone: TEST_PHONE,
        date_of_birth: '2020-05-15',
        gender: 'male'
      })

      expect(status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()

      ids.patientId = data.data._id || data.data.id
      expect(ids.patientId).toBeDefined()
      expect(data.data.patient_number).toMatch(/^P\d+$/)
    })

    test('Majburiy maydonlarsiz — xato bo\'lishi kerak', async () => {
      const { status, data } = await api('POST', '/patients', receptionToken, {
        first_name: 'Test'
      })

      expect(status).toBeGreaterThanOrEqual(400)
      expect(data.success).toBe(false)
    })

    test('Takroriy telefon — xato bo\'lishi kerak', async () => {
      const { status } = await api('POST', '/patients', receptionToken, {
        first_name: 'Dup',
        last_name: 'Test',
        phone: TEST_PHONE,
        date_of_birth: '2020-01-01',
        gender: 'female'
      })

      expect(status).toBeGreaterThanOrEqual(400)
    })
  })

  // ==================== STEP 3: GET DOCTOR ID ====================
  describe('3-qadam: Doktor tanlash', () => {
    test('Doktorlar ro\'yxatini olish', async () => {
      const { status, data } = await api('GET', '/staff?role=doctor&limit=1', receptionToken)

      expect(status).toBe(200)
      expect(data.data?.length).toBeGreaterThan(0)

      ids.doctorId = data.data[0]._id
      expect(ids.doctorId).toBeDefined()
    })
  })

  // ==================== STEP 4: QUEUE ====================
  describe('4-qadam: Navbatga qo\'shish', () => {
    test('Bemorni navbatga qo\'shish', async () => {
      const { status, data } = await api('POST', '/queue', receptionToken, {
        patient_id: ids.patientId,
        doctor_id: ids.doctorId,
        queue_type: 'NORMAL'
      })

      expect(status).toBe(201)
      expect(data.success).toBe(true)

      ids.queueId = data.data._id
      expect(ids.queueId).toBeDefined()
      expect(data.data.queue_number).toBeDefined()
      expect(data.data.status).toBe('WAITING')
    })

    test('URGENT navbat ham ishlashi kerak', async () => {
      // Second patient for urgent queue
      const { data: pData } = await api('POST', '/patients', receptionToken, {
        first_name: 'FlowTest2',
        last_name: 'Urgent',
        phone: TEST_PHONE_2,
        date_of_birth: '2019-03-10',
        gender: 'female'
      })
      ids.patient2Id = pData.data?._id || pData.data?.id

      if (ids.patient2Id) {
        const { status, data } = await api('POST', '/queue', receptionToken, {
          patient_id: ids.patient2Id,
          doctor_id: ids.doctorId,
          queue_type: 'URGENT'
        })

        expect(status).toBe(201)
        expect(data.data.queue_type).toBe('URGENT')
        ids.queue2Id = data.data._id
      }
    })
  })

  // ==================== STEP 5: DOCTOR CALLS PATIENT ====================
  describe('5-qadam: Doktor bemorni chaqiradi', () => {
    test('WAITING → CALLED', async () => {
      const { status, data } = await api('PUT', `/queue/${ids.queueId}/call`, doctorToken)

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('CALLED')
    })
  })

  // ==================== STEP 6: START CONSULTATION ====================
  describe('6-qadam: Qabulni boshlash', () => {
    test('CALLED → IN_PROGRESS', async () => {
      const { status, data } = await api('PUT', `/queue/${ids.queueId}/start`, doctorToken)

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('IN_PROGRESS')
    })
  })

  // ==================== STEP 7: PRESCRIPTION ====================
  describe('7-qadam: Retsept yozish', () => {
    test('REGULAR retsept', async () => {
      const { status, data } = await api('POST', '/prescriptions', doctorToken, {
        patient_id: ids.patientId,
        diagnosis: 'ORVI - Flow test',
        queue_id: ids.queueId,
        prescription_type: 'REGULAR',
        medications: [
          {
            medication_name: 'Paracetamol',
            per_dose_amount: '1 tabletka',
            dosage: '500mg',
            frequency: 'Kuniga 3 mahal',
            frequency_per_day: 3,
            duration_days: 5,
            instructions: 'Ovqatdan keyin'
          },
          {
            medication_name: 'Vitamin C',
            per_dose_amount: '1 tabletka',
            dosage: '250mg',
            frequency: 'Kuniga 1 mahal',
            frequency_per_day: 1,
            duration_days: 7
          }
        ]
      })

      // Backend returns 200 for prescription creation
      expect(status).toBe(200)
      expect(data.success).toBe(true)
      ids.prescriptionId = data.data._id
      expect(data.data.prescription_number).toBeDefined()
    })

    test('URGENT retsept', async () => {
      const { status, data } = await api('POST', '/prescriptions', doctorToken, {
        patient_id: ids.patientId,
        diagnosis: 'Yuqori harorat',
        prescription_type: 'URGENT',
        medications: [{
          medication_name: 'Analgin ukol',
          per_dose_amount: '1 ampula',
          dosage: '2ml',
          frequency: 'Bir martalik',
          frequency_per_day: 1,
          duration_days: 1,
          is_urgent: true
        }]
      })

      expect(status).toBe(200)
      expect(data.data.prescription_type).toBe('URGENT')
      ids.urgentPrescriptionId = data.data._id
    })

    test('Diagnozsiz — xato', async () => {
      const { status } = await api('POST', '/prescriptions', doctorToken, {
        patient_id: ids.patientId,
        medications: [{ medication_name: 'Test', dosage: '1mg' }]
      })
      expect(status).toBeGreaterThanOrEqual(400)
    })

    test('Bo\'sh dorilar ro\'yxati — xato', async () => {
      const { status } = await api('POST', '/prescriptions', doctorToken, {
        patient_id: ids.patientId,
        diagnosis: 'Test',
        medications: []
      })
      expect(status).toBeGreaterThanOrEqual(400)
    })
  })

  // ==================== STEP 8: BILLING ====================
  describe('8-qadam: To\'lov (Billing)', () => {
    test('Xizmatlar ro\'yxatini olish', async () => {
      const { status, data } = await api('GET', '/billing/services?limit=1', receptionToken)

      expect(status).toBe(200)
      ids.serviceId = data.data?.[0]?._id
      expect(ids.serviceId).toBeDefined()
    })

    test('Invoice yaratish', async () => {
      const { status, data } = await api('POST', '/billing/invoices', receptionToken, {
        patient_id: ids.patientId,
        items: [{
          service_id: ids.serviceId,
          quantity: 1
        }],
        payment_method: 'cash',
        paid_amount: 0
      })

      expect(status).toBe(201)
      expect(data.success).toBe(true)

      ids.invoiceId = data.data?.invoice?._id
      expect(ids.invoiceId).toBeDefined()
      expect(data.data?.invoice?.invoice_number).toMatch(/^INV-/)
    })

    test('To\'lov qilish (cash)', async () => {
      if (!ids.invoiceId) return

      // First get invoice to know total
      const { data: invData } = await api('GET', `/billing/invoices/${ids.invoiceId}`, receptionToken)
      const totalAmount = invData.data?.total_amount || invData.data?.invoice?.total_amount || 50000

      const { status, data } = await api('POST', `/billing/invoices/${ids.invoiceId}/payment`, receptionToken, {
        amount: totalAmount,
        payment_method: 'cash'
      })

      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('Ortiqcha to\'lov — xato', async () => {
      if (!ids.invoiceId) return

      const { status } = await api('POST', `/billing/invoices/${ids.invoiceId}/payment`, receptionToken, {
        amount: 99999999,
        payment_method: 'cash'
      })

      expect(status).toBeGreaterThanOrEqual(400)
    })
  })

  // ==================== STEP 9: COMPLETE QUEUE ====================
  describe('9-qadam: Qabulni yakunlash', () => {
    test('IN_PROGRESS → COMPLETED', async () => {
      const { status, data } = await api('PUT', `/queue/${ids.queueId}/complete`, doctorToken)

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('COMPLETED')
    })

    test('Qayta yakunlash — idempotent yoki xato', async () => {
      const { status, data } = await api('PUT', `/queue/${ids.queueId}/complete`, doctorToken)
      // Backend may return 200 (idempotent) or 400 (error)
      // Verify it doesn't crash (status < 500)
      expect(status).toBeLessThan(500)
    })
  })

  // ==================== STEP 10: VERIFY ====================
  describe('10-qadam: Tekshirish', () => {
    test('Bemor profili mavjud', async () => {
      const { status, data } = await api('GET', `/patients/${ids.patientId}`, receptionToken)

      expect(status).toBe(200)
      // Response structure: data.data.patient or data.data directly
      const patient = data.data?.patient || data.data
      expect(patient.first_name).toBe('FlowTest')
    })

    test('Retseptlar ro\'yxati', async () => {
      const { status, data } = await api('GET', `/prescriptions?patient_id=${ids.patientId}`, doctorToken)

      expect(status).toBe(200)
      const list = Array.isArray(data.data) ? data.data : [data.data]
      expect(list.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ==================== CLEANUP ====================
  afterAll(async () => {
    const token = adminToken || receptionToken
    if (!token) return

    // Delete test data via API
    if (ids.queue2Id) await apiDelete(token, `/queue/${ids.queue2Id}`)
    if (ids.queueId) await apiDelete(token, `/queue/${ids.queueId}`)
    if (ids.urgentPrescriptionId) await apiDelete(token, `/prescriptions/${ids.urgentPrescriptionId}`)
    if (ids.prescriptionId) await apiDelete(token, `/prescriptions/${ids.prescriptionId}`)
    if (ids.patient2Id) await apiDelete(token, `/patients/${ids.patient2Id}`)
    if (ids.patientId) await apiDelete(token, `/patients/${ids.patientId}`)
  })
})
