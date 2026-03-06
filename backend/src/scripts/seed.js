/**
 * Seed script — test ma'lumotlari (full reset + seed)
 * Usage: cd backend && node src/scripts/seed.js
 */

import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) { console.error('MONGODB_URI topilmadi'); process.exit(1) }

// ── Inline schemas (to avoid model conflicts) ──────────────────────

const staffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  plain_password: String,
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin','doctor','nurse','laborant','sanitar','receptionist','masseur','speech_therapist','chief_doctor','chef_laborant'] },
  phone: String, specialization: String, salary: { type: Number, default: 0 },
  commission_rate: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true })

staffSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.plain_password = this.password
  this.password = await bcryptjs.hash(this.password, 10)
})

const Staff       = mongoose.model('Staff', staffSchema, 'staff')
const LabCategory = mongoose.model('LabCategory', new mongoose.Schema({ name: { type: String, required: true, unique: true }, description: String, is_active: { type: Boolean, default: true } }, { timestamps: true }))
const LabTest     = mongoose.model('LabTest', new mongoose.Schema({ name: { type: String, required: true }, category: { type: mongoose.Schema.Types.ObjectId, ref: 'LabCategory', required: true }, price: { type: Number, required: true }, code: String, sample_type: String, duration_minutes: Number, is_active: { type: Boolean, default: true } }, { timestamps: true }))

const LabReagent  = mongoose.model('LabReagent', new mongoose.Schema({
  name: { type: String, required: true },
  country_of_origin: String,
  expiry_date: { type: Date, required: true },
  total_tests: { type: Number, required: true, min: 1 },
  remaining_tests: { type: Number, required: true, min: 0 },
  total_price: { type: Number, required: true },
  price_per_test: { type: Number, required: true },
  notes: String,
  status: { type: String, enum: ['active','low_stock','expired','depleted'], default: 'active' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }
}, { timestamps: true }))

const ServiceCategory   = mongoose.model('ServiceCategory', new mongoose.Schema({ name: { type: String, required: true, unique: true }, description: String }, { timestamps: true }))
const ProcedureCategory = mongoose.model('ProcedureCategory', new mongoose.Schema({ name: { type: String, required: true, unique: true }, procedure_type: { type: String, enum: ['ukol','kapelnitsa','massaj','xijoma'] }, is_active: { type: Boolean, default: true } }, { timestamps: true }))

const Service = mongoose.model('Service', new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
  price: { type: Number, required: true, min: 0 },
  base_price: Number, description: String, code: String,
  procedure_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcedureCategory' },
  procedure_type: String,
  is_active: { type: Boolean, default: true }
}, { timestamps: true }))

const Medicine = mongoose.model('Medicine', new mongoose.Schema({
  name: { type: String, required: true },
  generic_name: String, manufacturer: String, category: String,
  dosage_form: String, strength: String,
  unit: { type: String, enum: ['dona','mg','ml','g','kg','l','ampula','shisha','quti'], default: 'dona' },
  unit_price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 0 },
  reorder_level: { type: Number, default: 10 },
  status: { type: String, default: 'active' }
}, { timestamps: true }))

const AmbulatorRoom = mongoose.model('AmbulatorRoom', new mongoose.Schema({
  room_number: { type: String, required: true },
  room_name: { type: String, required: true },
  department: { type: String, required: true, enum: ['ambulator','inpatient'] },
  floor: Number, capacity: Number, status: { type: String, default: 'available' }
}, { timestamps: true }))

const Bed = mongoose.model('Bed', new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulatorRoom', required: true },
  bed_number: { type: Number, required: true },
  daily_price: { type: Number, required: true, default: 0 },
  status: { type: String, default: 'available' }
}, { timestamps: true }))

const DoctorService = mongoose.model('DoctorService', new mongoose.Schema({
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  service_name: { type: String, default: '' },
  custom_price: { type: Number, required: true, min: 0 },
  is_active: { type: Boolean, default: true },
  revisit_rules: { type: Array, default: [
    { min_days: 0, max_days: 3, discount_percent: 100 },
    { min_days: 4, max_days: 7, discount_percent: 50 }
  ]}
}, { timestamps: true }))

// ── Collections to clear ───────────────────────────────────────────
const CLEAR_COLLECTIONS = [
  'staff', 'staffs', 'labreagents', 'labcategories', 'labtests',
  'servicecategories', 'procedurecategories', 'services', 'medicines',
  'ambulatorrooms', 'beds', 'doctorservices', 'roles',
  'laborders', 'billing', 'billing_items', 'transactions', 'queues',
  'admissions', 'admissionrequests', 'ambulatorprocedures', 'prescriptions',
  'medical_records', 'treatment_schedules', 'labpharmacyrequests',
  'pharmacy_transactions', 'labrequests', 'labreagentusages',
  'patient_nurses', 'ambulatorcheckinlogs', 'ambulatorqrtickets',
  'ambulatorpatientcalls', 'ambulatordoctornotifications', 'on_duty_doctors',
  'tasks', 'communications', 'expenses', 'cashier_reports', 'attendance',
  'attendances', 'penalties', 'bonuses', 'monthly_payrolls', 'staff_salaries'
]

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('✅ MongoDB connected\n')

  // ── Clear ────────────────────────────────────────────────────────
  console.log('🗑  Tozalanmoqda...')
  const db = mongoose.connection.db
  for (const col of CLEAR_COLLECTIONS) {
    try {
      const res = await db.collection(col).deleteMany({})
      if (res.deletedCount > 0) console.log(`  ✓ ${col} (${res.deletedCount} o'chirildi)`)
    } catch (_) { /* collection not exist */ }
  }

  // ── 1. Staff ──────────────────────────────────────────────────────
  console.log('\n👤 Staff yaratilmoqda...')

  const staffData = [
    // Admin
    { username: 'admin', role: 'admin', first_name: 'Akbar', last_name: 'Mirzayev', specialization: 'Boshqaruv', phone: '+998901234560', salary: 5000000 },
    // Chief doctor
    { username: 'bosh_shifokor', role: 'chief_doctor', first_name: 'Sherzod', last_name: 'Rahimov', specialization: 'Bosh shifokor', phone: '+998901234561', salary: 8000000, commission_rate: 5 },
    // Doctors (4 ta)
    { username: 'abdullayev', role: 'doctor', first_name: 'Jasur', last_name: 'Abdullayev', specialization: 'Pediatriya', phone: '+998901234562', salary: 4000000, commission_rate: 20 },
    { username: 'nazarova_d', role: 'doctor', first_name: 'Dilnoza', last_name: 'Nazarova', specialization: 'Allergologiya', phone: '+998901234563', salary: 4000000, commission_rate: 20 },
    { username: 'kamolov', role: 'doctor', first_name: 'Firdavs', last_name: 'Kamolov', specialization: 'Nevrologiya', phone: '+998901234564', salary: 4000000, commission_rate: 20 },
    { username: 'toshmatova_s', role: 'doctor', first_name: 'Sarvinoz', last_name: 'Toshmatova', specialization: 'Dermatologiya', phone: '+998901234565', salary: 4000000, commission_rate: 20 },
    // Nurse
    { username: 'hamshira', role: 'nurse', first_name: 'Zulfiya', last_name: 'Karimova', specialization: 'Muolaja hamshirasi', phone: '+998901234566', salary: 2500000 },
    // Receptionist
    { username: 'qabulxona', role: 'receptionist', first_name: 'Nilufar', last_name: 'Yusupova', specialization: 'Qabulxona', phone: '+998901234567', salary: 2000000 },
    // Laborant
    { username: 'laborant', role: 'laborant', first_name: 'Bobur', last_name: 'Xolmatov', specialization: 'Klinik laborant', phone: '+998901234568', salary: 2500000 },
    // Chef laborant
    { username: 'bosh_laborant', role: 'chef_laborant', first_name: 'Malika', last_name: 'Saidova', specialization: 'Bosh laborant', phone: '+998901234569', salary: 3500000, commission_rate: 5 },
    // Masseur
    { username: 'massozhchi', role: 'masseur', first_name: 'Feruza', last_name: 'Ismoilova', specialization: 'Massaj terapevti', phone: '+998901234570', salary: 3000000, commission_rate: 30 },
    // Speech therapist
    { username: 'logoped', role: 'speech_therapist', first_name: 'Muazzam', last_name: 'Ergasheva', specialization: 'Nutq terapevti (logoped)', phone: '+998901234571', salary: 3000000, commission_rate: 25 },
    // Sanitar
    { username: 'sanitar', role: 'sanitar', first_name: 'Baxtiyor', last_name: 'Tursunov', specialization: 'Sanitar', phone: '+998901234572', salary: 1500000 },
  ]

  const staffMap = {}
  for (const s of staffData) {
    const doc = await Staff.create({ ...s, password: 'Test1234' })
    staffMap[s.username] = doc._id
    console.log(`  ✓ ${s.username} (${s.role}) — ${s.first_name} ${s.last_name}`)
  }

  // ── 2. LabCategories ──────────────────────────────────────────────
  console.log('\n🧪 LabCategories...')
  const labCatData = [
    { name: 'Qon tahlili', description: 'Qon tekshiruv tahlillari' },
    { name: 'Siynak va axlat tahlili', description: 'Siynak va axlat tekshiruvlari' },
    { name: 'Biokimyoviy tahlil', description: 'Qon biokimyosi' },
    { name: 'Immunologiya va serologiya', description: 'Immunologik tekshiruvlar' },
    { name: 'Bakteriologiya', description: 'Bakteriologik ekinlar' },
  ]
  const labCats = {}
  for (const c of labCatData) {
    const doc = await LabCategory.create({ ...c, is_active: true })
    labCats[c.name] = doc._id
    console.log(`  ✓ ${c.name}`)
  }

  // ── 3. LabTests ───────────────────────────────────────────────────
  console.log('\n🔬 LabTests...')
  const labTestsData = [
    // Qon tahlili
    { name: 'Umumiy qon tahlili (OAK)', category: 'Qon tahlili', price: 45000, sample_type: 'Venoz qon', duration_minutes: 30 },
    { name: 'Umumiy qon tahlili + leykoformula', category: 'Qon tahlili', price: 55000, sample_type: 'Venoz qon', duration_minutes: 45 },
    { name: 'Gemoglobin (Hb)', category: 'Qon tahlili', price: 20000, sample_type: 'Kapillyar qon', duration_minutes: 20 },
    { name: 'Qondagi glyukoza (shakar)', category: 'Qon tahlili', price: 30000, sample_type: 'Kapillyar qon', duration_minutes: 15 },
    { name: 'Qon ivish vaqti (VSK)', category: 'Qon tahlili', price: 5000, sample_type: 'Kapillyar qon', duration_minutes: 10 },
    { name: 'Qon guruhi va Rh-omil', category: 'Qon tahlili', price: 30000, sample_type: 'Venoz qon', duration_minutes: 30 },
    { name: 'Qonda gijjani aniqlash (eozinofil)', category: 'Qon tahlili', price: 80000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Koagulogamma (PT, APTT, fibrinogen)', category: 'Qon tahlili', price: 70000, sample_type: 'Venoz qon', duration_minutes: 60 },
    // Siynak va axlat
    { name: 'Umumiy siynak tahlili (OAM)', category: 'Siynak va axlat tahlili', price: 25000, sample_type: 'Siynak', duration_minutes: 30 },
    { name: 'Umumiy axlat tahlili (koprogramma)', category: 'Siynak va axlat tahlili', price: 25000, sample_type: 'Axlat', duration_minutes: 30 },
    { name: 'Axlatda gijja tuxumlari', category: 'Siynak va axlat tahlili', price: 20000, sample_type: 'Axlat', duration_minutes: 30 },
    { name: 'Axlatni yashirin qonga tekshirish', category: 'Siynak va axlat tahlili', price: 25000, sample_type: 'Axlat', duration_minutes: 30 },
    { name: "Siynak madaniyati (ekin)", category: 'Siynak va axlat tahlili', price: 60000, sample_type: 'Siynak', duration_minutes: 180 },
    // Biokimyo
    { name: 'ALT (alanin aminotransferaza)', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'AST (aspartat aminotransferaza)', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'ALT + AST + Bilirubin (umumiy)', category: 'Biokimyoviy tahlil', price: 60000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Kaltsiy (Ca)', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Mochevina', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Kaliy (K)', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Kreatinin', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Umumiy oqsil', category: 'Biokimyoviy tahlil', price: 25000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: "Siydik kislotasi", category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Xolesterin (umumiy)', category: 'Biokimyoviy tahlil', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Triglitseridlar', category: 'Biokimyoviy tahlil', price: 35000, sample_type: 'Venoz qon', duration_minutes: 60 },
    // Immunologiya
    { name: 'S-reaktiv oqsil (SRB)', category: 'Immunologiya va serologiya', price: 25000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Antistreptolizin-O (ASLO)', category: 'Immunologiya va serologiya', price: 25000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Revmatoidli omil (RF)', category: 'Immunologiya va serologiya', price: 30000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Revmo proba (4 ko\'rsatkich)', category: 'Immunologiya va serologiya', price: 60000, sample_type: 'Venoz qon', duration_minutes: 90 },
    { name: 'Vitamin D (25-OH)', category: 'Immunologiya va serologiya', price: 125000, sample_type: 'Venoz qon', duration_minutes: 120 },
    { name: 'Gepatit B (HBsAg)', category: 'Immunologiya va serologiya', price: 40000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'Gepatit C (anti-HCV)', category: 'Immunologiya va serologiya', price: 40000, sample_type: 'Venoz qon', duration_minutes: 60 },
    { name: 'TSH (qalqonsimon bez gormonlari)', category: 'Immunologiya va serologiya', price: 80000, sample_type: 'Venoz qon', duration_minutes: 120 },
    { name: 'Ferritin', category: 'Immunologiya va serologiya', price: 80000, sample_type: 'Venoz qon', duration_minutes: 120 },
    // Bakteriologiya
    { name: "Tomoq surtmasi (ekini)", category: 'Bakteriologiya', price: 70000, sample_type: 'Tomoq surtmasi', duration_minutes: 240 },
    { name: "Burun surtmasi (ekini)", category: 'Bakteriologiya', price: 70000, sample_type: 'Burun surtmasi', duration_minutes: 240 },
  ]
  for (const t of labTestsData) {
    const catId = labCats[t.category]
    await LabTest.create({ ...t, category: catId, is_active: true })
    console.log(`  ✓ ${t.name} (${(t.price/1000).toFixed(0)}k)`)
  }

  // ── 4. LabReagents ────────────────────────────────────────────────
  console.log('\n⚗️  LabReagents...')
  const chefLab = staffMap['bosh_laborant']
  const today = new Date()
  const exp1y = new Date(today); exp1y.setFullYear(exp1y.getFullYear() + 1)
  const exp2y = new Date(today); exp2y.setFullYear(exp2y.getFullYear() + 2)
  const exp6m = new Date(today); exp6m.setMonth(exp6m.getMonth() + 6)

  const reagents = [
    { name: 'HemoCue Hb 201+ kartridj', country_of_origin: 'Shvetsiya', expiry_date: exp1y, total_tests: 200, remaining_tests: 185, total_price: 800000, price_per_test: 4000 },
    { name: 'Diasys FS Glyukoza reagenti', country_of_origin: 'Germaniya', expiry_date: exp1y, total_tests: 100, remaining_tests: 78, total_price: 500000, price_per_test: 5000 },
    { name: 'Biolis ALT/AST reagent kit', country_of_origin: 'Yaponiya', expiry_date: exp2y, total_tests: 150, remaining_tests: 140, total_price: 750000, price_per_test: 5000 },
    { name: 'Kreatinin (Jaffe metodi) reagenti', country_of_origin: 'Xitoy', expiry_date: exp1y, total_tests: 120, remaining_tests: 105, total_price: 360000, price_per_test: 3000 },
    { name: 'Mochevina (urease metodi) reagenti', country_of_origin: 'Xitoy', expiry_date: exp1y, total_tests: 120, remaining_tests: 98, total_price: 360000, price_per_test: 3000 },
    { name: "Xolesterin CHOD-PAP reagenti", country_of_origin: 'Germaniya', expiry_date: exp2y, total_tests: 100, remaining_tests: 100, total_price: 450000, price_per_test: 4500 },
    { name: 'Vitamin D ELISA kit (96 test)', country_of_origin: 'Koreya', expiry_date: exp6m, total_tests: 96, remaining_tests: 72, total_price: 2400000, price_per_test: 25000 },
    { name: 'HBsAg tez test (immuno-xromatografiya)', country_of_origin: 'Koreya', expiry_date: exp1y, total_tests: 50, remaining_tests: 44, total_price: 500000, price_per_test: 10000 },
    { name: 'Anti-HCV tez test', country_of_origin: 'Koreya', expiry_date: exp1y, total_tests: 50, remaining_tests: 50, total_price: 500000, price_per_test: 10000 },
    { name: 'Kaltsiy (o-krezolftalein) reagenti', country_of_origin: 'Rossiya', expiry_date: exp1y, total_tests: 100, remaining_tests: 87, total_price: 300000, price_per_test: 3000 },
    { name: 'CRP (S-reaktiv oqsil) latex reagenti', country_of_origin: 'Italiya', expiry_date: exp2y, total_tests: 80, remaining_tests: 73, total_price: 400000, price_per_test: 5000 },
    { name: 'ASLO (Antistreptolizin-O) latex reagenti', country_of_origin: 'Italiya', expiry_date: exp2y, total_tests: 80, remaining_tests: 69, total_price: 400000, price_per_test: 5000 },
  ]
  for (const r of reagents) {
    await LabReagent.create({ ...r, status: 'active', created_by: chefLab })
    console.log(`  ✓ ${r.name} (${r.country_of_origin}) — ${r.remaining_tests}/${r.total_tests} test`)
  }

  // ── 5. ServiceCategories ──────────────────────────────────────────
  console.log('\n🏷  ServiceCategories...')
  const svcCatData = [
    { name: "Shifokor ko'rigi", description: "Shifokor muoyana xizmatlari" },
    { name: 'Hamshira muolajalari', description: "Ukol, kapelnitsa va boshqa muolajalar" },
    { name: 'Fizioterapiya', description: "Fizioterapevtik xizmatlar" },
    { name: 'Massaj xizmatlari', description: "Barcha turdagi massajlar" },
    { name: 'Xijoma va alternativ tibbiyot', description: "Xijoma, zulluk va boshqa" },
  ]
  const svcCats = {}
  for (const c of svcCatData) {
    const doc = await ServiceCategory.create(c)
    svcCats[c.name] = doc._id
    console.log(`  ✓ ${c.name}`)
  }

  // ── 6. ProcedureCategories ────────────────────────────────────────
  console.log('\n⚕️  ProcedureCategories...')
  const procCatData = [
    { name: 'Ukol', procedure_type: 'ukol' },
    { name: 'Kapelnitsa', procedure_type: 'kapelnitsa' },
    { name: 'Massaj', procedure_type: 'massaj' },
    { name: 'Xijoma', procedure_type: 'xijoma' },
  ]
  const procCatIds = {}
  for (const p of procCatData) {
    const doc = await ProcedureCategory.create({ ...p, is_active: true })
    procCatIds[p.name] = doc._id
    console.log(`  ✓ ${p.name}`)
  }

  // ── 7. Services ───────────────────────────────────────────────────
  console.log('\n💼 Services...')
  const servicesData = [
    // Shifokor ko'rigi
    { name: "Pediatr ko'rigi (birlamchi)", category: "Shifokor ko'rigi", price: 50000 },
    { name: "Pediatr qayta ko'rigi (1-3 kun)", category: "Shifokor ko'rigi", price: 0 },
    { name: "Pediatr qayta ko'rigi (4-7 kun)", category: "Shifokor ko'rigi", price: 25000 },
    { name: "Allergolog ko'rigi (birlamchi)", category: "Shifokor ko'rigi", price: 60000 },
    { name: "Allergolog qayta ko'rigi", category: "Shifokor ko'rigi", price: 30000 },
    { name: "Nevrolog ko'rigi (birlamchi)", category: "Shifokor ko'rigi", price: 60000 },
    { name: "Nevrolog qayta ko'rigi", category: "Shifokor ko'rigi", price: 30000 },
    { name: "Dermatolog ko'rigi (birlamchi)", category: "Shifokor ko'rigi", price: 50000 },
    { name: "Dermatolog qayta ko'rigi", category: "Shifokor ko'rigi", price: 25000 },
    { name: "Bosh shifokor ko'rigi", category: "Shifokor ko'rigi", price: 80000 },
    // Hamshira muolajalari
    { name: 'Ukol (mushak ichi)', category: 'Hamshira muolajalari', price: 10000, procedure_type: 'ukol' },
    { name: 'Ukol (vena ichi)', category: 'Hamshira muolajalari', price: 15000, procedure_type: 'ukol' },
    { name: 'Ukol (antibiotik proba)', category: 'Hamshira muolajalari', price: 15000, procedure_type: 'ukol' },
    { name: 'Kapelnitsa bolalarga (150 ml gacha)', category: 'Hamshira muolajalari', price: 30000, procedure_type: 'kapelnitsa' },
    { name: 'Kapelnitsa kattalarga (1 dona)', category: 'Hamshira muolajalari', price: 30000, procedure_type: 'kapelnitsa' },
    { name: 'Kapelnitsa kattalarga (2 dona)', category: 'Hamshira muolajalari', price: 45000, procedure_type: 'kapelnitsa' },
    { name: "Ingalyatsiya (nebulayzer)", category: 'Hamshira muolajalari', price: 10000 },
    { name: 'Klizma (bolalarga)', category: 'Hamshira muolajalari', price: 30000 },
    { name: "Burun yuvish (Dolphin)", category: 'Hamshira muolajalari', price: 15000 },
    // Fizioterapiya
    { name: 'Magnitoterapiya (1 seans)', category: 'Fizioterapiya', price: 25000 },
    { name: 'UZT (ultratovush terapiyasi)', category: 'Fizioterapiya', price: 25000 },
    { name: 'Lazer terapiya', category: 'Fizioterapiya', price: 30000 },
    { name: 'Darsonval (1 seans)', category: 'Fizioterapiya', price: 25000 },
    { name: "Parafin muolajasi", category: 'Fizioterapiya', price: 25000 },
    { name: "Elektroforez", category: 'Fizioterapiya', price: 30000 },
    { name: "Gelminterapiya (gijjalarni tushurish)", category: 'Fizioterapiya', price: 50000 },
    // Massaj
    { name: 'Bolalar terapevtik massaji (30 daqiqa)', category: 'Massaj xizmatlari', price: 50000, procedure_type: 'massaj' },
    { name: 'Raxit, skolioz, valgus stopa massaji', category: 'Massaj xizmatlari', price: 80000, procedure_type: 'massaj' },
    { name: 'Logopedik massaj (nutq muammolari)', category: 'Massaj xizmatlari', price: 80000, procedure_type: 'massaj' },
    { name: "Ayollar umumiy massaji (30 daqiqa)", category: 'Massaj xizmatlari', price: 80000, procedure_type: 'massaj' },
    { name: "Ozdiruvchi massaj (1 soat)", category: 'Massaj xizmatlari', price: 300000, procedure_type: 'massaj' },
    { name: 'Limfodrenaj massaji', category: 'Massaj xizmatlari', price: 300000, procedure_type: 'massaj' },
    { name: "Relaks-massaj (1 soat)", category: 'Massaj xizmatlari', price: 150000, procedure_type: 'massaj' },
    { name: "Olovli massaj", category: 'Massaj xizmatlari', price: 150000, procedure_type: 'massaj' },
    { name: "Shokoladli massaj", category: 'Massaj xizmatlari', price: 200000, procedure_type: 'massaj' },
    { name: "Asalli massaj", category: 'Massaj xizmatlari', price: 180000, procedure_type: 'massaj' },
    { name: "Bankali massaj", category: 'Massaj xizmatlari', price: 150000, procedure_type: 'massaj' },
    // Xijoma va alternativ
    { name: 'Xijoma (1 banka)', category: 'Xijoma va alternativ tibbiyot', price: 15000, procedure_type: 'xijoma' },
    { name: 'Xijoma (6-10 banka)', category: 'Xijoma va alternativ tibbiyot', price: 80000, procedure_type: 'xijoma' },
    { name: 'Kosmetik yuz xijomasi', category: 'Xijoma va alternativ tibbiyot', price: 100000, procedure_type: 'xijoma' },
    { name: 'Zulluk (girudoterapiya)', category: 'Xijoma va alternativ tibbiyot', price: 45000, procedure_type: 'xijoma' },
    { name: "Manual terapiya", category: 'Xijoma va alternativ tibbiyot', price: 50000 },
    { name: "Osteopatiya", category: 'Xijoma va alternativ tibbiyot', price: 500000 },
    { name: "Obertyvanie (tanani o'rash)", category: 'Xijoma va alternativ tibbiyot', price: 300000 },
  ]
  const svcIds = {}
  for (const s of servicesData) {
    const catId = svcCats[s.category]
    const extra = {}
    if (s.procedure_type) {
      const map = { ukol: 'Ukol', kapelnitsa: 'Kapelnitsa', massaj: 'Massaj', xijoma: 'Xijoma' }
      extra.procedure_category_id = procCatIds[map[s.procedure_type]]
      extra.procedure_type = s.procedure_type
    }
    const doc = await Service.create({ name: s.name, category: catId, price: s.price, base_price: s.price, is_active: true, ...extra })
    svcIds[s.name] = doc._id
    console.log(`  ✓ ${s.name} (${(s.price/1000).toFixed(0)}k)`)
  }

  // ── 8. DoctorServices ─────────────────────────────────────────────
  console.log('\n👨‍⚕️ DoctorServices...')
  const doctorServiceMap = {
    'abdullayev': [
      "Pediatr ko'rigi (birlamchi)",
      "Pediatr qayta ko'rigi (4-7 kun)",
      "Pediatr qayta ko'rigi (1-3 kun)",
      "Bolalar terapevtik massaji (30 daqiqa)",
      "Gelminterapiya (gijjalarni tushurish)",
    ],
    'nazarova_d': [
      "Allergolog ko'rigi (birlamchi)",
      "Allergolog qayta ko'rigi",
      "Ingalyatsiya (nebulayzer)",
      "Magnitoterapiya (1 seans)",
      "Burun yuvish (Dolphin)",
    ],
    'kamolov': [
      "Nevrolog ko'rigi (birlamchi)",
      "Nevrolog qayta ko'rigi",
      "Magnitoterapiya (1 seans)",
      "Elektroforez",
      "Manual terapiya",
    ],
    'toshmatova_s': [
      "Dermatolog ko'rigi (birlamchi)",
      "Dermatolog qayta ko'rigi",
      "Lazer terapiya",
      "UZT (ultratovush terapiyasi)",
      "Darsonval (1 seans)",
    ],
  }
  for (const [username, serviceNames] of Object.entries(doctorServiceMap)) {
    const doctorId = staffMap[username]
    for (const svcName of serviceNames) {
      const svcId = svcIds[svcName]
      if (!svcId) { console.log(`  ⚠ Service topilmadi: ${svcName}`); continue }
      const svc = await Service.findById(svcId).lean()
      await DoctorService.create({
        doctor_id: doctorId,
        service_id: svcId,
        service_name: svcName,
        custom_price: svc.price,
        is_active: true,
        revisit_rules: [
          { min_days: 0, max_days: 3, discount_percent: 100 },
          { min_days: 4, max_days: 7, discount_percent: 50 },
        ]
      })
      console.log(`  ✓ ${username} → ${svcName}`)
    }
  }

  // ── 9. Medicines ──────────────────────────────────────────────────
  console.log('\n💊 Medicines...')
  const medicinesData = [
    // Og'riq qoldiruvchi va harorat tushiruvchi
    { name: 'Paracetamol 500mg', generic_name: 'Paracetamol', dosage_form: 'Tabletka', strength: '500mg', unit: 'dona', unit_price: 2000, quantity: 500, reorder_level: 100, category: "Og'riq qoldiruvchi", manufacturer: 'O\'zbekiston' },
    { name: 'Paracetamol 250mg (suppozitoriy)', generic_name: 'Paracetamol', dosage_form: 'Suppozitoriy', strength: '250mg', unit: 'dona', unit_price: 5000, quantity: 200, reorder_level: 50, category: "Og'riq qoldiruvchi", manufacturer: 'O\'zbekiston' },
    { name: 'Ibuprofen 200mg', generic_name: 'Ibuprofen', dosage_form: 'Tabletka', strength: '200mg', unit: 'dona', unit_price: 3000, quantity: 300, reorder_level: 60, category: "Og'riq qoldiruvchi" },
    { name: 'Nimesulid 100mg', generic_name: 'Nimesulid', dosage_form: 'Tabletka', strength: '100mg', unit: 'dona', unit_price: 4000, quantity: 200, reorder_level: 40, category: "Og'riq qoldiruvchi" },
    // Antibiotiklar
    { name: 'Amoksitsillin 500mg', generic_name: 'Amoksitsillin', dosage_form: 'Kapsul', strength: '500mg', unit: 'quti', unit_price: 15000, quantity: 100, reorder_level: 20, category: 'Antibiotik' },
    { name: 'Azitromitsin 250mg', generic_name: 'Azitromitsin', dosage_form: 'Tabletka', strength: '250mg', unit: 'quti', unit_price: 25000, quantity: 80, reorder_level: 15, category: 'Antibiotik' },
    { name: 'Tseftriakson 1g (kukuncha)', generic_name: 'Tseftriakson', dosage_form: 'In\'eksiya', strength: '1g', unit: 'dona', unit_price: 8000, quantity: 150, reorder_level: 30, category: 'Antibiotik' },
    { name: 'Ampitsillin 0.5g', generic_name: 'Ampitsillin', dosage_form: 'In\'eksiya', strength: '0.5g', unit: 'dona', unit_price: 5000, quantity: 100, reorder_level: 20, category: 'Antibiotik' },
    // Infuzion eritmalar
    { name: 'NaCl 0.9% 200ml', generic_name: 'Natriy xlorid', dosage_form: "Infuzion eritma", strength: '0.9%', unit: 'shisha', unit_price: 8000, quantity: 200, reorder_level: 40, category: "Infuzion eritma", manufacturer: 'O\'zbekiston' },
    { name: 'NaCl 0.9% 400ml', generic_name: 'Natriy xlorid', dosage_form: "Infuzion eritma", strength: '0.9%', unit: 'shisha', unit_price: 12000, quantity: 150, reorder_level: 30, category: "Infuzion eritma" },
    { name: "Glyukoza 5% 200ml", generic_name: 'Glyukoza', dosage_form: "Infuzion eritma", strength: '5%', unit: 'shisha', unit_price: 9000, quantity: 200, reorder_level: 40, category: "Infuzion eritma" },
    { name: "Glyukoza 10% 200ml", generic_name: 'Glyukoza', dosage_form: "Infuzion eritma", strength: '10%', unit: 'shisha', unit_price: 11000, quantity: 100, reorder_level: 20, category: "Infuzion eritma" },
    { name: "Ringer laktati 400ml", generic_name: "Ringer laktati", dosage_form: "Infuzion eritma", strength: 'standart', unit: 'shisha', unit_price: 14000, quantity: 100, reorder_level: 20, category: "Infuzion eritma" },
    // Vitaminlar
    { name: 'Vitamin D3 (Akvadetrima) 15ml', generic_name: 'Xolekaltseferol', dosage_form: "Og'iz tomchisi", strength: '500 IU/tomchi', unit: 'shisha', unit_price: 35000, quantity: 60, reorder_level: 10, category: 'Vitamin', manufacturer: 'Polsha' },
    { name: 'Vitamin C 500mg', generic_name: 'Askorbin kislotasi', dosage_form: 'Tabletka', strength: '500mg', unit: 'quti', unit_price: 8000, quantity: 100, reorder_level: 20, category: 'Vitamin' },
    { name: 'Kaltsiy D3 Nikomed', generic_name: 'Kaltsiy+Vitamin D3', dosage_form: "Chaynab yeyiladigan tabletka", strength: '500mg/200IU', unit: 'quti', unit_price: 45000, quantity: 50, reorder_level: 10, category: 'Vitamin', manufacturer: 'Norvegiya' },
    // Antiallergik
    { name: 'Suprastin 25mg', generic_name: 'Xloropiramin', dosage_form: 'Tabletka', strength: '25mg', unit: 'quti', unit_price: 12000, quantity: 80, reorder_level: 15, category: 'Antiallergik' },
    { name: "Loratadin 10mg", generic_name: 'Loratadin', dosage_form: 'Tabletka', strength: '10mg', unit: 'quti', unit_price: 10000, quantity: 80, reorder_level: 15, category: 'Antiallergik' },
    // Boshqa
    { name: "Deksametazon 4mg/ml (ampula)", generic_name: 'Deksametazon', dosage_form: "In'eksiya", strength: '4mg/ml', unit: 'ampula', unit_price: 4000, quantity: 100, reorder_level: 20, category: 'Kortikosteroid' },
    { name: "No-shpa 40mg (ampula)", generic_name: 'Drotaverin', dosage_form: "In'eksiya", strength: '40mg/2ml', unit: 'ampula', unit_price: 5000, quantity: 100, reorder_level: 20, category: 'Spazmalyotik' },
    { name: "Dimedrol 1% (ampula)", generic_name: 'Difengidromin', dosage_form: "In'eksiya", strength: '1%', unit: 'ampula', unit_price: 3000, quantity: 80, reorder_level: 20, category: 'Antiallergik' },
    { name: 'Laktusan sirop 200ml', generic_name: 'Laktuloza', dosage_form: 'Sirop', strength: '670mg/ml', unit: 'shisha', unit_price: 25000, quantity: 40, reorder_level: 10, category: 'Ich suruvchi' },
  ]
  for (const m of medicinesData) {
    await Medicine.create({ ...m, status: 'active' })
    console.log(`  ✓ ${m.name} (${m.quantity} ${m.unit})`)
  }

  // ── 10. AmbulatorRooms + Beds ─────────────────────────────────────
  console.log('\n🏥 Xonalar va karavotlar...')
  const roomsData = [
    { room_number: '101', room_name: 'Pediatr muolaja xonasi', department: 'ambulator', floor: 1, capacity: 3 },
    { room_number: '102', room_name: 'Allergolog xonasi', department: 'ambulator', floor: 1, capacity: 2 },
    { room_number: '103', room_name: 'Fizioterapiya xonasi', department: 'ambulator', floor: 1, capacity: 4 },
    { room_number: '201', room_name: 'Statsionar palatasi #1', department: 'inpatient', floor: 2, capacity: 3 },
    { room_number: '202', room_name: 'Statsionar palatasi #2', department: 'inpatient', floor: 2, capacity: 3 },
  ]
  for (const r of roomsData) {
    const room = await AmbulatorRoom.create({ ...r, status: 'available' })
    const bedCount = r.capacity
    const dailyPrice = r.department === 'inpatient' ? 80000 : 50000
    console.log(`  ✓ Xona ${r.room_number} — ${r.room_name} (${r.department})`)
    for (let b = 1; b <= bedCount; b++) {
      await Bed.create({ room_id: room._id, bed_number: b, daily_price: dailyPrice, status: 'available' })
      console.log(`    ✓ Karavot #${b}`)
    }
  }

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('✅ Seed muvaffaqiyatli yakunlandi!\n')
  console.log('📋 Login ma\'lumotlari (parol: Test1234):')
  console.log('  admin         → Akbar Mirzayev (admin)')
  console.log('  bosh_shifokor → Sherzod Rahimov (chief_doctor)')
  console.log('  abdullayev    → Jasur Abdullayev (doctor, Pediatriya)')
  console.log('  nazarova_d    → Dilnoza Nazarova (doctor, Allergologiya)')
  console.log('  kamolov       → Firdavs Kamolov (doctor, Nevrologiya)')
  console.log('  toshmatova_s  → Sarvinoz Toshmatova (doctor, Dermatologiya)')
  console.log('  hamshira      → Zulfiya Karimova (nurse)')
  console.log('  qabulxona     → Nilufar Yusupova (receptionist)')
  console.log('  laborant      → Bobur Xolmatov (laborant)')
  console.log('  bosh_laborant → Malika Saidova (chef_laborant)')
  console.log('  massozhchi    → Feruza Ismoilova (masseur)')
  console.log('  logoped       → Muazzam Ergasheva (speech_therapist)')
  console.log('  sanitar       → Baxtiyor Tursunov (sanitar)')

  await mongoose.disconnect()
}

seed().catch(e => { console.error('❌ Xato:', e.message, e.stack); process.exit(1) })
