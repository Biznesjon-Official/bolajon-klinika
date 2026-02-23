/**
 * Statsionar (Inpatient) Flow Tests
 * Tests against running server on port 5001
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const BASE = 'http://localhost:5001/api/v1'
let token = null
let testPatientId = null
let testAdmissionId = null
let testRoomId = null

// Helper for fetch requests
async function api(method, path, body = null, authToken = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (authToken) opts.headers.Authorization = `Bearer ${authToken}`
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  return { status: res.status, body: data }
}

beforeAll(async () => {
  // MongoDB ulanish (model testlari uchun)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic_db'
  await mongoose.connect(mongoUri)

  // Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'test123' })
  if (loginRes.body.success) {
    token = loginRes.body.accessToken || loginRes.body.token || loginRes.body.data?.token
  }
  if (!token) {
    const docRes = await api('POST', '/auth/login', { username: 'doctor1', password: 'test123' })
    token = docRes.body.accessToken || docRes.body.token || docRes.body.data?.token
  }
}, 15000)

afterAll(async () => {
  // Cleanup test admission
  if (testAdmissionId) {
    try {
      const Admission = (await import('../src/models/Admission.js')).default
      const Bed = (await import('../src/models/Bed.js')).default
      const admission = await Admission.findById(testAdmissionId)
      if (admission && admission.status === 'active') {
        admission.status = 'discharged'
        admission.discharge_date = new Date()
        await admission.save()
        await Bed.updateOne(
          { room_id: admission.room_id, bed_number: admission.bed_number },
          { status: 'available', current_patient_id: null, current_admission_id: null }
        )
      }
    } catch (e) { /* ignore */ }
  }
  await mongoose.connection.close()
}, 10000)

// ============================================
// 1. LABORDER MODEL - admission_id FIELD
// ============================================
describe('LabOrder admission_id field', () => {
  it('LabOrder modelda admission_id field bor', async () => {
    const LabOrder = (await import('../src/models/LabOrder.js')).default
    const schema = LabOrder.schema.paths
    expect(schema).toHaveProperty('admission_id')
    expect(schema.admission_id.instance).toBe('ObjectId')
  })

  it('LabOrder admission_id indexi mavjud', async () => {
    const LabOrder = (await import('../src/models/LabOrder.js')).default
    const indexes = LabOrder.schema.indexes()
    const hasAdmissionIndex = indexes.some(idx => idx[0].admission_id === 1)
    expect(hasAdmissionIndex).toBe(true)
  })
})

// ============================================
// 2. MEDICINE CABINET ENDPOINT
// ============================================
describe('Medicine Cabinet endpoint', () => {
  it('GET /nurse/medicine-cabinets haqiqiy dorilarni qaytaradi', async () => {
    if (!token) return

    const res = await api('GET', '/nurse/medicine-cabinets', null, token)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      const med = res.body.data[0]
      expect(med).toHaveProperty('name')
      expect(med).toHaveProperty('unit_price')
      expect(med).toHaveProperty('quantity')
      expect(med).toHaveProperty('floor')
    }
  })

  it('GET /nurse/medicine-cabinets?floor=3 floor filter', async () => {
    if (!token) return

    const res = await api('GET', '/nurse/medicine-cabinets?floor=3', null, token)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    for (const med of res.body.data) {
      expect(med.floor).toBe(3)
    }
  })
})

// ============================================
// 3. ADMISSION YARATISH
// ============================================
describe('Admission yaratish', () => {
  it('Test uchun patient va room topish', async () => {
    if (!token) return

    const patientRes = await api('GET', '/patients?limit=1', null, token)
    if (patientRes.body.success && patientRes.body.data?.length > 0) {
      testPatientId = patientRes.body.data[0]._id || patientRes.body.data[0].id
    }

    const roomRes = await api('GET', '/inpatient/rooms', null, token)
    if (roomRes.body.success && roomRes.body.data?.length > 0) {
      for (const room of roomRes.body.data) {
        if (room.beds?.some(b => b.status === 'available')) {
          testRoomId = room._id || room.id
          break
        }
      }
    }

    expect(testPatientId).toBeTruthy()
  })

  it('POST /ambulator-inpatient/admissions admission yaratadi', async () => {
    if (!token || !testPatientId || !testRoomId) return

    // Active admission bormi
    const Admission = (await import('../src/models/Admission.js')).default
    const existing = await Admission.findOne({ patient_id: testPatientId, status: 'active' })
    if (existing) {
      testAdmissionId = existing._id.toString()
      return
    }

    const res = await api('POST', '/ambulator-inpatient/admissions', {
      patient_id: testPatientId,
      room_id: testRoomId,
      bed_number: 1,
      diagnosis: 'Test tashxis',
      notes: 'Statsionar flow test'
    }, token)

    if (res.body.success) {
      testAdmissionId = res.body.data?.id?.toString()
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
    }
  })
})

// ============================================
// 4. BILLING SUMMARY
// ============================================
describe('Billing summary endpoint', () => {
  it('GET /admissions/:id/billing-summary ishlaydi', async () => {
    if (!token || !testAdmissionId) return

    const res = await api('GET', `/ambulator-inpatient/admissions/${testAdmissionId}/billing-summary`, null, token)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('admission')
    expect(res.body.data).toHaveProperty('summary')
    expect(res.body.data).toHaveProperty('invoices')
    expect(res.body.data).toHaveProperty('unpaid_invoices')

    const s = res.body.data.summary
    expect(s).toHaveProperty('estimated_days')
    expect(s).toHaveProperty('bed_daily_price')
    expect(s).toHaveProperty('bed_charges')
    expect(s).toHaveProperty('medicine_charges')
    expect(s).toHaveProperty('lab_charges')
    expect(s).toHaveProperty('grand_total')
    expect(s).toHaveProperty('total_paid')
    expect(s).toHaveProperty('total_debt')

    // grand_total = bed + medicine + lab + other
    expect(s.grand_total).toBe(s.bed_charges + s.medicine_charges + s.lab_charges + (s.other_charges || 0))
  })

  it('Noto\'g\'ri admission_id 404 qaytaradi', async () => {
    if (!token) return

    const fakeId = new mongoose.Types.ObjectId()
    const res = await api('GET', `/ambulator-inpatient/admissions/${fakeId}/billing-summary`, null, token)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

// ============================================
// 5. DISCHARGE
// ============================================
describe('Discharge endpoint', () => {
  it('POST /admissions/:id/discharge bemorni chiqaradi', async () => {
    if (!token || !testAdmissionId) return

    const res = await api('POST', `/ambulator-inpatient/admissions/${testAdmissionId}/discharge`, {
      discharge_type: 'normal',
      discharge_notes: 'Test discharge'
    }, token)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('admission_id')
    expect(res.body.data).toHaveProperty('total_days')
    expect(res.body.data).toHaveProperty('total_bed_charges')

    // DB tekshir
    const Admission = (await import('../src/models/Admission.js')).default
    const admission = await Admission.findById(testAdmissionId)
    expect(admission.status).toBe('discharged')

    const Bed = (await import('../src/models/Bed.js')).default
    const bed = await Bed.findOne({ room_id: admission.room_id, bed_number: admission.bed_number })
    if (bed) {
      expect(bed.status).toBe('available')
    }

    testAdmissionId = null
  })
})
