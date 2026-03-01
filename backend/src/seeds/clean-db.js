import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected to MongoDB')

const db = mongoose.connection.db

// Collections to completely wipe
const toWipe = [
  'patients',
  'billing',        // invoices
  'billingitems',
  'transactions',
  'cashierreports',
  'queues',
  'admissions',
  'beds',
  'ambulatorrooms',
  'ambulatorprocedures',
  'ambulatorcheckinlogs',
  'ambulatorpatientcalls',
  'ambulatorqrtickets',
  'ambulatordoctornotifications',
  'ambulatorcomplaints',
  'medicalrecords',
  'prescriptions',
  'laborders',
  'treatmentschedules',
  'patientnurses',
  'roomcleanings',
  'attendances',
  'bonuses',
  'penalties',
  'monthlypayrolls',
  'staffsalaries',
  'communications',
  'tasks',
  'expenses',
  'pharmacytransactions',
  'pharmacyrequests',
  'labreagentusages',
  'ondutyDoctors',
]

// Keep admin only in staff
const Staff = (await import('../models/Staff.js')).default
const Role = (await import('../models/Role.js')).default

const adminRole = await Role.findOne({ name: { $regex: /admin/i } })
console.log('Admin role:', adminRole?.name)

// Delete all staff except admin
const deleted = await Staff.deleteMany({
  $and: [
    { role: { $ne: adminRole?._id } },
    // also keep if username === 'admin' as fallback
  ]
})
console.log(`Deleted ${deleted.deletedCount} staff (non-admin)`)

// Wipe all collections
for (const col of toWipe) {
  try {
    const result = await db.collection(col).deleteMany({})
    if (result.deletedCount > 0) console.log(`Wiped ${col}: ${result.deletedCount} docs`)
  } catch (e) {
    // collection may not exist
  }
}

// Reset AmbulatorRoom statuses if collection still has data
try {
  await db.collection('ambulatorrooms').updateMany({}, {
    $set: { status: 'available' },
    $unset: { current_patient_id: 1, current_queue_id: 1 }
  })
} catch {}

console.log('\n✅ DB cleaned. Only admin staff remains.')
await mongoose.disconnect()
