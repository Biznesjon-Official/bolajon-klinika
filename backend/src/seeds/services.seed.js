import mongoose from 'mongoose'
import dotenv from 'dotenv'
import LabTest from '../models/LabTest.js'
import Service from '../models/Service.js'

dotenv.config()

// Laboratory tests from price list
const labTests = [
  // Qon tahlili (Blood tests)
  { name: "Umumiy qon tahlili", category: "Qon tahlili", price: 45000, sample_type: "blood" },
  { name: "Umumiy qon tahlili + leykoformula", category: "Qon tahlili", price: 55000, sample_type: "blood" },
  { name: "Qondagi glyukoza miqdori (shakar)", category: "Qon tahlili", price: 30000, sample_type: "blood" },
  { name: "Gemoglobin", category: "Qon tahlili", price: 20000, sample_type: "blood" },
  { name: "Qon ivish vaqti (VSK)", category: "Qon tahlili", price: 5000, sample_type: "blood" },
  { name: "Qon guruhini aniqlash", category: "Qon tahlili", price: 30000, sample_type: "blood" },
  { name: "Qonda gijjani aniqlash", category: "Qon tahlili", price: 80000, sample_type: "blood" },
  { name: "Koagulogramma", category: "Qon tahlili", price: 70000, sample_type: "blood" },

  // Siydik tahlili (Urine tests)
  { name: "Umumiy siydik tahlili", category: "Siydik tahlili", price: 25000, sample_type: "urine" },

  // Najas tahlili (Stool tests)
  { name: "Umumiy najas tahlili", category: "Najas tahlili", price: 25000, sample_type: "stool" },
  { name: "Najasda gijja tuxumlarini aniqlash", category: "Najas tahlili", price: 20000, sample_type: "stool" },
  { name: "Najasni yashirin qonga tekshirish", category: "Najas tahlili", price: 25000, sample_type: "stool" },

  // Biokimyo (Biochemistry)
  { name: "ALT, AST, Bilirubin", category: "Biokimyo", price: 60000, sample_type: "blood" },
  { name: "Kaltsiy", category: "Biokimyo", price: 30000, sample_type: "blood" },
  { name: "Mochevina", category: "Biokimyo", price: 30000, sample_type: "blood" },
  { name: "Kaliy", category: "Biokimyo", price: 30000, sample_type: "blood" },
  { name: "Kreatinin", category: "Biokimyo", price: 30000, sample_type: "blood" },
  { name: "Revmatoidli omil (revmo faktor)", category: "Biokimyo", price: 30000, sample_type: "blood" },
  { name: "Revmo proba", category: "Biokimyo", price: 60000, sample_type: "blood" },
  { name: "S-reaktiv oqsil", category: "Biokimyo", price: 25000, sample_type: "blood" },
  { name: "Antistreptolisin-O (ASLO)", category: "Biokimyo", price: 25000, sample_type: "blood" },
  { name: "Vitamin D", category: "Biokimyo", price: 125000, sample_type: "blood" },
  { name: "Gepatit B, C", category: "Biokimyo", price: 60000, sample_type: "blood" },
  { name: "Gormonlar", category: "Biokimyo", price: 80000, sample_type: "blood" },
]

// Services: procedures and physiotherapy only (consultations are managed via DoctorService)
const services = [
  // Muolaja (procedures)
  { name: "Kapelnitsa (osma) bolalarga", category: "Muolaja", price: 30000, procedure_type: "kapelnitsa" },
  { name: "Kapelnitsa kattalarga (1 donasi)", category: "Muolaja", price: 30000, procedure_type: "kapelnitsa" },
  { name: "Kapelnitsa kattalarga (2 donasi)", category: "Muolaja", price: 40000, procedure_type: "kapelnitsa" },
  { name: "Ukol (antibiotik proba)", category: "Muolaja", price: 15000, procedure_type: "ukol" },
  { name: "Ukol", category: "Muolaja", price: 10000, procedure_type: "ukol" },
  { name: "Ingalyatsiya", category: "Muolaja", price: 10000 },
  { name: "Klizma bolalarga", category: "Muolaja", price: 30000 },

  // Bolalar fizioterapiyasi
  { name: "Bolalar massaji", category: "Bolalar fizioterapiyasi", price: 50000, procedure_type: "massaj" },
  { name: "Raxit, skolioz, valgus/varus, O-shakl, X-shakl deformatsiya, yassi oyoq, maymok oyoq (30 daqiqa)", category: "Bolalar fizioterapiyasi", price: 80000, procedure_type: "massaj" },
  { name: "Logomassaj, nutqida muammolar", category: "Bolalar fizioterapiyasi", price: 80000, procedure_type: "massaj" },
  { name: "Gelmenterapiya (gijjalarni tushurish)", category: "Bolalar fizioterapiyasi", price: 50000 },
  { name: "Magnitoterapiya", category: "Bolalar fizioterapiyasi", price: 25000 },
  { name: "UZT, lazer", category: "Bolalar fizioterapiyasi", price: 25000 },
  { name: "Darsonval", category: "Bolalar fizioterapiyasi", price: 25000 },
  { name: "Parafin", category: "Bolalar fizioterapiyasi", price: 25000 },

  // Ayollar fizioterapiyasi - Massaj
  { name: "Ayollar massaji (30 daqiqa)", category: "Ayollar fizioterapiyasi", price: 80000, procedure_type: "massaj" },
  { name: "Ozdiruvchi massaj", category: "Ayollar fizioterapiyasi", price: 300000, procedure_type: "massaj" },
  { name: "Limfodrenaj", category: "Ayollar fizioterapiyasi", price: 300000, procedure_type: "massaj" },
  { name: "Relaks-massaj (1 soat)", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },
  { name: "Olovli massaj", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },
  { name: "Shokoladli massaj", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },
  { name: "Asalli massaj", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },
  { name: "Skrabirovengan massaj", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },
  { name: "Bankali massaj", category: "Ayollar fizioterapiyasi", price: 150000, procedure_type: "massaj" },

  // Ayollar fizioterapiyasi - Xijoma
  { name: "Xijoma (1 banka)", category: "Ayollar fizioterapiyasi", price: 15000, procedure_type: "xijoma", is_cups_based: true, price_per_cup: 15000 },
  { name: "Chertma", category: "Ayollar fizioterapiyasi", price: 100000, procedure_type: "xijoma" },
  { name: "Kosmetik yuz xijomasi", category: "Ayollar fizioterapiyasi", price: 100000, procedure_type: "xijoma" },

  // Ayollar fizioterapiyasi - Boshqa terapiyalar
  { name: "Obertyvanie", category: "Ayollar fizioterapiyasi", price: 300000 },
  { name: "Osteopatiya", category: "Ayollar fizioterapiyasi", price: 500000 },
  { name: "Manual terapiya", category: "Ayollar fizioterapiyasi", price: 50000 },
  { name: "Soch o'stiradigon skrab, maska", category: "Ayollar fizioterapiyasi", price: 150000 },
  { name: "Zulluk", category: "Ayollar fizioterapiyasi", price: 45000 },
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Seed lab tests
  let labInserted = 0
  for (const test of labTests) {
    const exists = await LabTest.findOne({ name: test.name })
    if (!exists) {
      await LabTest.create(test)
      labInserted++
    }
  }
  console.log(`Lab tests: ${labInserted} inserted, ${labTests.length - labInserted} skipped`)

  // Seed services
  let svcInserted = 0
  for (const svc of services) {
    const exists = await Service.findOne({ name: svc.name })
    if (!exists) {
      await Service.create({ ...svc, base_price: svc.price })
      svcInserted++
    }
  }
  console.log(`Services: ${svcInserted} inserted, ${services.length - svcInserted} skipped`)

  await mongoose.disconnect()
  console.log('Done!')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
