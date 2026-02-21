/**
 * Database Seed Script
 * Cleans ALL collections and creates interconnected test data
 * Usage: node scripts/seed.js
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

// Models
import Staff from '../src/models/Staff.js'
import Patient from '../src/models/Patient.js'
import Service from '../src/models/Service.js'
import ServiceCategory from '../src/models/ServiceCategory.js'
import Medicine from '../src/models/Medicine.js'
import LabTest from '../src/models/LabTest.js'
import AmbulatorRoom from '../src/models/AmbulatorRoom.js'
import Bed from '../src/models/Bed.js'
import Queue from '../src/models/Queue.js'
import Prescription from '../src/models/Prescription.js'
import Invoice from '../src/models/Invoice.js'
import Admission from '../src/models/Admission.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0'
const PASSWORD = 'test123'

// ==================== DATA ====================

const staffData = [
  // Admin - 1
  { username: 'admin', first_name: 'Admin', last_name: 'Adminov', role: 'admin', phone: '+998901000001', department: 'Boshqaruv', salary: 5000000, shift: 'morning' },
  // Chief Doctor - 1
  { username: 'chief_doctor', first_name: 'Sardor', last_name: 'Bosh Shifokor', role: 'chief_doctor', phone: '+998901000002', department: 'Boshqaruv', specialization: 'Pediatriya', license_number: 'LIC-001', salary: 8000000, shift: 'morning' },
  // Doctors - 3
  { username: 'doctor1', first_name: 'Aziz', last_name: 'Karimov', role: 'doctor', phone: '+998901000003', department: 'Pediatriya', specialization: 'Pediatr', license_number: 'LIC-002', salary: 5000000, commission_rate: 10, shift: 'morning' },
  { username: 'doctor2', first_name: 'Dilnoza', last_name: 'Rashidova', role: 'doctor', phone: '+998901000004', department: 'Nevrologiya', specialization: 'Nevrolog', license_number: 'LIC-003', salary: 5000000, commission_rate: 10, shift: 'morning' },
  { username: 'doctor3', first_name: 'Bobur', last_name: 'Aliyev', role: 'doctor', phone: '+998901000005', department: 'Terapiya', specialization: 'Terapevt', license_number: 'LIC-004', salary: 4500000, commission_rate: 8, shift: 'evening' },
  // Nurses - 3
  { username: 'nurse1', first_name: 'Gulnora', last_name: 'Hamidova', role: 'nurse', phone: '+998901000006', department: 'Pediatriya', salary: 2500000, shift: 'morning' },
  { username: 'nurse2', first_name: 'Malika', last_name: 'Saidova', role: 'nurse', phone: '+998901000007', department: 'Nevrologiya', salary: 2500000, shift: 'evening' },
  { username: 'nurse3', first_name: 'Zarina', last_name: 'Umarova', role: 'nurse', phone: '+998901000008', department: 'Terapiya', salary: 2500000, shift: 'night' },
  // Receptionists - 2
  { username: 'receptionist1', first_name: 'Nodira', last_name: 'Toshpulatova', role: 'receptionist', phone: '+998901000009', department: 'Qabulxona', salary: 2000000, shift: 'morning' },
  { username: 'receptionist2', first_name: 'Shahlo', last_name: 'Mirzayeva', role: 'receptionist', phone: '+998901000010', department: 'Qabulxona', salary: 2000000, shift: 'evening' },
  // Laborants - 2
  { username: 'laborant1', first_name: 'Rustam', last_name: 'Qodirov', role: 'laborant', phone: '+998901000011', department: 'Laboratoriya', salary: 3000000, shift: 'morning' },
  { username: 'laborant2', first_name: 'Laziz', last_name: 'Normatov', role: 'laborant', phone: '+998901000012', department: 'Laboratoriya', salary: 3000000, shift: 'evening' },
  // Sanitars - 2
  { username: 'sanitar1', first_name: 'Olim', last_name: 'Yusupov', role: 'sanitar', phone: '+998901000013', department: 'Tozalik', salary: 1500000, shift: 'morning' },
  { username: 'sanitar2', first_name: 'Jasur', last_name: 'Ergashev', role: 'sanitar', phone: '+998901000014', department: 'Tozalik', salary: 1500000, shift: 'evening' },
  // Masseurs - 2
  { username: 'masseur1', first_name: 'Sherzod', last_name: 'Tursunov', role: 'masseur', phone: '+998901000015', department: 'Fizioterapiya', salary: 3000000, shift: 'morning' },
  { username: 'masseur2', first_name: 'Akbar', last_name: 'Xolmatov', role: 'masseur', phone: '+998901000016', department: 'Fizioterapiya', salary: 3000000, shift: 'evening' },
  // Speech Therapists - 2
  { username: 'speech1', first_name: 'Barno', last_name: 'Kamalova', role: 'speech_therapist', phone: '+998901000017', department: 'Logopediya', salary: 3500000, shift: 'morning' },
  { username: 'speech2', first_name: 'Kamola', last_name: 'Rahimova', role: 'speech_therapist', phone: '+998901000018', department: 'Logopediya', salary: 3500000, shift: 'evening' },
]

const patientData = [
  { first_name: 'Murod', last_name: 'Toshmatov', date_of_birth: new Date('2020-03-15'), gender: 'male', phone: '+998901100001', blood_type: 'A+', address: 'Toshkent, Yunusobod', city: 'Toshkent' },
  { first_name: 'Sevinch', last_name: 'Karimova', date_of_birth: new Date('2019-07-22'), gender: 'female', phone: '+998901100002', blood_type: 'B+', address: 'Toshkent, Chilonzor', city: 'Toshkent' },
  { first_name: 'Jasur', last_name: 'Aliyev', date_of_birth: new Date('2021-01-10'), gender: 'male', phone: '+998901100003', blood_type: 'O+', address: 'Samarqand, Registon', city: 'Samarqand', allergies: ['Penisilin'] },
  { first_name: 'Madina', last_name: 'Rahimova', date_of_birth: new Date('2018-11-05'), gender: 'female', phone: '+998901100004', blood_type: 'AB+', address: 'Buxoro, Markaz', city: 'Buxoro' },
  { first_name: 'Otabek', last_name: 'Yusupov', date_of_birth: new Date('2022-06-30'), gender: 'male', phone: '+998901100005', blood_type: 'A-', address: 'Toshkent, Sergeli', city: 'Toshkent', chronic_conditions: ['Astma'] },
  { first_name: 'Nilufar', last_name: 'Saidova', date_of_birth: new Date('2020-09-18'), gender: 'female', phone: '+998901100006', blood_type: 'B-', address: 'Namangan, Markaz', city: 'Namangan' },
  { first_name: 'Sardor', last_name: 'Mirzayev', date_of_birth: new Date('2017-04-25'), gender: 'male', phone: '+998901100007', blood_type: 'O-', address: 'Andijon, Markaz', city: 'Andijon' },
  { first_name: 'Zulfiya', last_name: 'Normatova', date_of_birth: new Date('2023-02-14'), gender: 'female', phone: '+998901100008', blood_type: 'AB-', address: 'Fargona, Markaz', city: 'Fargona' },
  { first_name: 'Davron', last_name: 'Ergashev', date_of_birth: new Date('2019-12-01'), gender: 'male', phone: '+998901100009', blood_type: 'A+', address: 'Toshkent, Mirzo Ulugbek', city: 'Toshkent' },
  { first_name: 'Laylo', last_name: 'Hamidova', date_of_birth: new Date('2021-08-08'), gender: 'female', phone: '+998901100010', blood_type: 'O+', address: 'Toshkent, Yakkasaroy', city: 'Toshkent' },
]

const serviceCategoryData = [
  { name: 'Konsultatsiya', description: 'Shifokor konsultatsiyalari' },
  { name: 'Diagnostika', description: 'Diagnostika xizmatlari' },
  { name: 'Fizioterapiya', description: 'Fizioterapiya muolajalari' },
  { name: 'Laboratoriya', description: 'Laboratoriya tekshiruvlari' },
  { name: 'Protsedura', description: 'Tibbiy protseduralar' },
]

const serviceData = [
  // Konsultatsiya (3)
  { name: 'Pediatr konsultatsiyasi', category: 'Konsultatsiya', price: 100000, code: 'CONS-001' },
  { name: 'Nevrolog konsultatsiyasi', category: 'Konsultatsiya', price: 120000, code: 'CONS-002' },
  { name: 'Logoped konsultatsiyasi', category: 'Konsultatsiya', price: 80000, code: 'CONS-003' },
  // Diagnostika (3)
  { name: 'UZI tekshiruv', category: 'Diagnostika', price: 150000, code: 'DIAG-001' },
  { name: 'EKG', category: 'Diagnostika', price: 80000, code: 'DIAG-002' },
  { name: 'Rentgen', category: 'Diagnostika', price: 120000, code: 'DIAG-003' },
  // Fizioterapiya (3)
  { name: 'Massaj (umumiy)', category: 'Fizioterapiya', price: 100000, code: 'PHYS-001' },
  { name: 'Elektroforez', category: 'Fizioterapiya', price: 70000, code: 'PHYS-002' },
  { name: 'Parafin applikatsiya', category: 'Fizioterapiya', price: 60000, code: 'PHYS-003' },
  // Laboratoriya (3)
  { name: 'Umumiy qon tahlili', category: 'Laboratoriya', price: 50000, code: 'LAB-001' },
  { name: 'Umumiy siydik tahlili', category: 'Laboratoriya', price: 40000, code: 'LAB-002' },
  { name: 'Biokimyoviy tahlil', category: 'Laboratoriya', price: 200000, code: 'LAB-003' },
  // Protsedura (3)
  { name: 'Tomchi qo\'yish (kapelnitsa)', category: 'Protsedura', price: 50000, code: 'PROC-001' },
  { name: 'Ukol qilish', category: 'Protsedura', price: 20000, code: 'PROC-002' },
  { name: 'Yaraga ishlov berish', category: 'Protsedura', price: 80000, code: 'PROC-003' },
]

const medicineData = [
  // Tablets (10)
  { name: 'Paracetamol 500mg', generic_name: 'Paracetamol', manufacturer: 'Nobel Pharma', category: 'tablet', strength: '500mg', unit: 'dona', unit_price: 1000, quantity: 500, batch_number: 'BT-001' },
  { name: 'Ibuprofen 200mg', generic_name: 'Ibuprofen', manufacturer: 'Jurabek Labs', category: 'tablet', strength: '200mg', unit: 'dona', unit_price: 1500, quantity: 300, batch_number: 'BT-002' },
  { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', manufacturer: 'Nobel Pharma', category: 'tablet', strength: '250mg', unit: 'dona', unit_price: 2000, quantity: 200, batch_number: 'BT-003' },
  { name: 'Cetirizin 10mg', generic_name: 'Cetirizin', manufacturer: 'Nika Pharm', category: 'tablet', strength: '10mg', unit: 'dona', unit_price: 800, quantity: 400, batch_number: 'BT-004' },
  { name: 'Metronidazol 250mg', generic_name: 'Metronidazol', manufacturer: 'Jurabek Labs', category: 'tablet', strength: '250mg', unit: 'dona', unit_price: 1200, quantity: 250, batch_number: 'BT-005' },
  { name: 'Vitamin C 500mg', generic_name: 'Ascorbic Acid', manufacturer: 'Dori-Darmon', category: 'tablet', strength: '500mg', unit: 'dona', unit_price: 500, quantity: 1000, batch_number: 'BT-006' },
  { name: 'Calcium D3', generic_name: 'Calcium + Vitamin D3', manufacturer: 'Nycomed', category: 'tablet', strength: '500mg/200IU', unit: 'dona', unit_price: 3000, quantity: 150, batch_number: 'BT-007' },
  { name: 'Ferro-Folgamma', generic_name: 'Iron + Folic Acid', manufacturer: 'Werwag', category: 'tablet', strength: '37mg', unit: 'dona', unit_price: 4000, quantity: 120, batch_number: 'BT-008' },
  { name: 'Enalapril 10mg', generic_name: 'Enalapril', manufacturer: 'Nobel Pharma', category: 'tablet', strength: '10mg', unit: 'dona', unit_price: 1800, quantity: 180, batch_number: 'BT-009' },
  { name: 'Omeprazol 20mg', generic_name: 'Omeprazol', manufacturer: 'Nika Pharm', category: 'tablet', strength: '20mg', unit: 'dona', unit_price: 2500, quantity: 200, batch_number: 'BT-010' },
  // Syrups (5)
  { name: 'Paracetamol sirop 120mg/5ml', generic_name: 'Paracetamol', manufacturer: 'Nobel Pharma', category: 'syrup', strength: '120mg/5ml', unit: 'shisha', unit_price: 15000, quantity: 80, batch_number: 'BS-001' },
  { name: 'Ibuprofen sirop 100mg/5ml', generic_name: 'Ibuprofen', manufacturer: 'Jurabek Labs', category: 'syrup', strength: '100mg/5ml', unit: 'shisha', unit_price: 18000, quantity: 60, batch_number: 'BS-002' },
  { name: 'Ambroxol sirop', generic_name: 'Ambroxol', manufacturer: 'Nobel Pharma', category: 'syrup', strength: '15mg/5ml', unit: 'shisha', unit_price: 12000, quantity: 100, batch_number: 'BS-003' },
  { name: 'Cetirizin sirop', generic_name: 'Cetirizin', manufacturer: 'Nika Pharm', category: 'syrup', strength: '5mg/5ml', unit: 'shisha', unit_price: 14000, quantity: 70, batch_number: 'BS-004' },
  { name: 'Multivitamin sirop', generic_name: 'Multivitamin', manufacturer: 'Dori-Darmon', category: 'syrup', strength: '5ml', unit: 'shisha', unit_price: 25000, quantity: 50, batch_number: 'BS-005' },
  // Injections (5)
  { name: 'Ceftriaxon 1g', generic_name: 'Ceftriaxon', manufacturer: 'Nobel Pharma', category: 'injection', strength: '1g', unit: 'ampula', unit_price: 8000, quantity: 200, batch_number: 'BI-001' },
  { name: 'Diklofenak 75mg', generic_name: 'Diklofenak', manufacturer: 'Jurabek Labs', category: 'injection', strength: '75mg/3ml', unit: 'ampula', unit_price: 5000, quantity: 150, batch_number: 'BI-002' },
  { name: 'Deksametazon 4mg', generic_name: 'Deksametazon', manufacturer: 'Nika Pharm', category: 'injection', strength: '4mg/ml', unit: 'ampula', unit_price: 3000, quantity: 300, batch_number: 'BI-003' },
  { name: 'No-Shpa 40mg', generic_name: 'Drotaverin', manufacturer: 'Sanofi', category: 'injection', strength: '40mg/2ml', unit: 'ampula', unit_price: 6000, quantity: 100, batch_number: 'BI-004' },
  { name: 'Analgin 50%', generic_name: 'Metamizol', manufacturer: 'Dori-Darmon', category: 'injection', strength: '50%/2ml', unit: 'ampula', unit_price: 2000, quantity: 250, batch_number: 'BI-005' },
  // Creams (5)
  { name: 'Levomekol krem', generic_name: 'Chloramphenicol+Methyluracil', manufacturer: 'Nika Pharm', category: 'cream', strength: '40g', unit: 'dona', unit_price: 10000, quantity: 80, batch_number: 'BC-001' },
  { name: 'Gidrokortizon 1%', generic_name: 'Gidrokortizon', manufacturer: 'Nobel Pharma', category: 'cream', strength: '1%/15g', unit: 'dona', unit_price: 8000, quantity: 60, batch_number: 'BC-002' },
  { name: 'Klotrimazol krem', generic_name: 'Klotrimazol', manufacturer: 'Jurabek Labs', category: 'cream', strength: '1%/20g', unit: 'dona', unit_price: 7000, quantity: 90, batch_number: 'BC-003' },
  { name: 'Bepantan krem', generic_name: 'Dexpanthenol', manufacturer: 'Bayer', category: 'cream', strength: '5%/30g', unit: 'dona', unit_price: 35000, quantity: 40, batch_number: 'BC-004' },
  { name: 'Fenistil gel', generic_name: 'Dimetindene', manufacturer: 'Novartis', category: 'cream', strength: '0.1%/30g', unit: 'dona', unit_price: 28000, quantity: 50, batch_number: 'BC-005' },
  // Drops (5)
  { name: 'Nazivin 0.01%', generic_name: 'Oxymetazoline', manufacturer: 'Merck', category: 'drops', strength: '0.01%/5ml', unit: 'shisha', unit_price: 18000, quantity: 100, batch_number: 'BD-001' },
  { name: 'Otipax tomchi', generic_name: 'Lidocaine+Phenazone', manufacturer: 'Biocodex', category: 'drops', strength: '15ml', unit: 'shisha', unit_price: 35000, quantity: 40, batch_number: 'BD-002' },
  { name: 'Albucid 20%', generic_name: 'Sulfacetamide', manufacturer: 'Dori-Darmon', category: 'drops', strength: '20%/10ml', unit: 'shisha', unit_price: 5000, quantity: 120, batch_number: 'BD-003' },
  { name: 'Aqua Maris', generic_name: 'Sea water', manufacturer: 'Jadran', category: 'drops', strength: '30ml', unit: 'shisha', unit_price: 25000, quantity: 60, batch_number: 'BD-004' },
  { name: 'Vibrocil tomchi', generic_name: 'Dimethindene+Phenylephrine', manufacturer: 'Novartis', category: 'drops', strength: '15ml', unit: 'shisha', unit_price: 30000, quantity: 45, batch_number: 'BD-005' },
]

const labTestData = [
  { name: 'Umumiy qon tahlili (OAK)', code: 'CBC', category: 'Gematologiya', price: 50000, sample_type: 'blood', duration_minutes: 30,
    test_parameters: [
      { name: 'Hemoglobin', unit: 'g/L', normal_range: '110-140' },
      { name: 'Eritrotsitlar', unit: '10^12/L', normal_range: '3.5-5.5' },
      { name: 'Leykotsitlar', unit: '10^9/L', normal_range: '4.0-9.0' },
      { name: 'Trombotsitlar', unit: '10^9/L', normal_range: '150-400' },
      { name: 'SOE', unit: 'mm/soat', normal_range: '2-15' },
    ]},
  { name: 'Umumiy siydik tahlili (OAM)', code: 'UA', category: 'Klinik', price: 40000, sample_type: 'urine', duration_minutes: 20,
    test_parameters: [
      { name: 'Rangi', unit: '', normal_range: 'Somon sariq' },
      { name: 'Tiniqlik', unit: '', normal_range: 'Tiniq' },
      { name: 'pH', unit: '', normal_range: '5.0-7.0' },
      { name: 'Oqsil', unit: 'g/L', normal_range: '0-0.033' },
      { name: 'Glyukoza', unit: 'mmol/L', normal_range: 'Manfiy' },
    ]},
  { name: 'Qon guruhi va Rezus faktor', code: 'BG-RH', category: 'Gematologiya', price: 60000, sample_type: 'blood', duration_minutes: 45,
    test_parameters: [
      { name: 'Qon guruhi', unit: '', normal_range: 'O/A/B/AB' },
      { name: 'Rezus faktor', unit: '', normal_range: '+/-' },
    ]},
  { name: 'Biokimyoviy qon tahlili', code: 'BIOCHEM', category: 'Biokimya', price: 200000, sample_type: 'blood', duration_minutes: 60,
    test_parameters: [
      { name: 'Glyukoza', unit: 'mmol/L', normal_range: '3.3-5.5' },
      { name: 'Umumiy oqsil', unit: 'g/L', normal_range: '65-85' },
      { name: 'Bilirubin', unit: 'mkmol/L', normal_range: '3.4-20.5' },
      { name: 'ALT', unit: 'U/L', normal_range: '0-40' },
      { name: 'AST', unit: 'U/L', normal_range: '0-40' },
      { name: 'Kreatinin', unit: 'mkmol/L', normal_range: '44-97' },
    ]},
  { name: 'Qondagi shakar (glyukoza)', code: 'GLU', category: 'Biokimya', price: 30000, sample_type: 'blood', duration_minutes: 15,
    test_parameters: [
      { name: 'Glyukoza', unit: 'mmol/L', normal_range: '3.3-5.5' },
    ]},
  { name: 'CRP (C-reaktiv oqsil)', code: 'CRP', category: 'Immunologiya', price: 80000, sample_type: 'blood', duration_minutes: 30,
    test_parameters: [
      { name: 'CRP', unit: 'mg/L', normal_range: '0-5' },
    ]},
  { name: 'Tireoid gormonlar (TSH, T3, T4)', code: 'THYROID', category: 'Gormonlar', price: 250000, sample_type: 'blood', duration_minutes: 120,
    test_parameters: [
      { name: 'TSH', unit: 'mIU/L', normal_range: '0.4-4.0' },
      { name: 'T3', unit: 'nmol/L', normal_range: '1.2-2.7' },
      { name: 'T4', unit: 'nmol/L', normal_range: '60-120' },
    ]},
  { name: 'Koprologiya (najas tahlili)', code: 'COPRO', category: 'Klinik', price: 35000, sample_type: 'stool', duration_minutes: 30,
    test_parameters: [
      { name: 'Rangi', unit: '', normal_range: 'Jigarrang' },
      { name: 'Konsistensiya', unit: '', normal_range: 'Yumshoq' },
      { name: 'Parazitlar', unit: '', normal_range: 'Topilmadi' },
    ]},
  { name: 'Allergiya paneli (IgE)', code: 'IGE', category: 'Immunologiya', price: 300000, sample_type: 'blood', duration_minutes: 180,
    test_parameters: [
      { name: 'Umumiy IgE', unit: 'IU/mL', normal_range: '0-100' },
    ]},
  { name: 'Burun surtmasi (mazok)', code: 'NASAL', category: 'Mikrobiologiya', price: 45000, sample_type: 'swab', duration_minutes: 45,
    test_parameters: [
      { name: 'Eozinofillar', unit: '%', normal_range: '0-5' },
      { name: 'Neytrofillar', unit: '%', normal_range: '40-70' },
    ]},
]

const roomData = [
  // Ambulator rooms
  { room_number: 'A-101', room_name: 'Pediatr kabineti', floor: 1, capacity: 1, department: 'ambulator', equipment: ['Stetoskop', 'Otoskop', 'Tarozi'] },
  { room_number: 'A-102', room_name: 'Nevrolog kabineti', floor: 1, capacity: 1, department: 'ambulator', equipment: ['Neyroskop', 'Refleks bolg\'achi'] },
  { room_number: 'A-103', room_name: 'Protsedura xonasi', floor: 1, capacity: 3, department: 'ambulator', equipment: ['Kapelnitsa stoykalari', 'Sterilizator'] },
  // Inpatient rooms
  { room_number: 'S-201', room_name: 'Statsionar 1-xona', floor: 2, capacity: 3, department: 'inpatient', equipment: ['Kislorod apparati', 'Monitor'] },
  { room_number: 'S-202', room_name: 'Statsionar 2-xona', floor: 2, capacity: 2, department: 'inpatient', equipment: ['Kislorod apparati'] },
  { room_number: 'S-203', room_name: 'Statsionar 3-xona', floor: 2, capacity: 3, department: 'inpatient', equipment: ['Kislorod apparati', 'Infuziya pompasi'] },
]

// ==================== MAIN SEED ====================

async function seed() {
  console.log('========================================')
  console.log('  DATABASE SEED SCRIPT')
  console.log('========================================\n')

  try {
    // 1. Connect
    console.log('1. MongoDB ga ulanmoqda...')
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
    console.log('   ✅ Ulandi:', mongoose.connection.db.databaseName)

    // 2. Clean ALL collections
    console.log('\n2. Barcha kolleksiyalar tozalanmoqda...')
    const collections = await mongoose.connection.db.listCollections().toArray()
    for (const col of collections) {
      await mongoose.connection.db.collection(col.name).deleteMany({})
      console.log(`   🗑️  ${col.name} tozalandi`)
    }
    console.log(`   ✅ ${collections.length} ta kolleksiya tozalandi`)

    // 3. Staff
    console.log('\n3. Staff (xodimlar) yaratilmoqda...')
    const hashedPassword = await bcrypt.hash(PASSWORD, 10)
    const staffDocs = staffData.map(s => ({
      ...s,
      password: hashedPassword,
      plain_password: PASSWORD,
      email: `${s.username}@klinika.uz`,
      status: 'active',
    }))
    const staff = await Staff.insertMany(staffDocs)
    console.log(`   ✅ ${staff.length} ta xodim yaratildi`)

    // Index staff by role
    const doctors = staff.filter(s => s.role === 'doctor')
    const nurses = staff.filter(s => s.role === 'nurse')
    const admin = staff.find(s => s.role === 'admin')
    const receptionist = staff.find(s => s.role === 'receptionist')

    // 4. Patients
    console.log('\n4. Bemorlar yaratilmoqda...')
    const patients = []
    for (const p of patientData) {
      const patient = await Patient.create({
        ...p,
        username: p.phone.replace('+998', ''),
        password: PASSWORD,
        emergency_contact: { name: 'Ota-ona', phone: p.phone.slice(0, -1) + '0', relationship: 'Ota/Ona' },
      })
      patients.push(patient)
    }
    console.log(`   ✅ ${patients.length} ta bemor yaratildi`)

    // 5. Service Categories
    console.log('\n5. Xizmat kategoriyalari yaratilmoqda...')
    const categories = await ServiceCategory.insertMany(serviceCategoryData)
    console.log(`   ✅ ${categories.length} ta kategoriya yaratildi`)

    // 6. Services
    console.log('\n6. Xizmatlar (muolaja turlari) yaratilmoqda...')
    const services = await Service.insertMany(serviceData.map(s => ({
      ...s,
      is_active: true,
      description: `${s.name} - ${s.category} xizmati`,
    })))
    console.log(`   ✅ ${services.length} ta xizmat yaratildi`)

    // 7. Medicines
    console.log('\n7. Dorilar yaratilmoqda...')
    const expiryDate = new Date('2027-12-31')
    const medicines = await Medicine.insertMany(medicineData.map(m => ({
      ...m,
      expiry_date: expiryDate,
      status: 'available',
      floor: 1,
      shelf_location: `Javon-${m.batch_number}`,
      description: `${m.generic_name} - ${m.manufacturer}`,
    })))
    console.log(`   ✅ ${medicines.length} ta dori yaratildi`)

    // 8. Lab Tests
    console.log('\n8. Laboratoriya testlari yaratilmoqda...')
    const labTests = await LabTest.insertMany(labTestData)
    console.log(`   ✅ ${labTests.length} ta test yaratildi`)

    // 9. Rooms
    console.log('\n9. Xonalar yaratilmoqda...')
    const rooms = await AmbulatorRoom.insertMany(roomData)
    console.log(`   ✅ ${rooms.length} ta xona yaratildi`)

    // 10. Beds
    console.log('\n10. Karavotlar yaratilmoqda...')
    const bedDocs = []
    for (const room of rooms) {
      const bedCount = room.department === 'inpatient' ? room.capacity : 1
      const dailyPrice = room.department === 'inpatient' ? 150000 : 0
      for (let i = 1; i <= bedCount; i++) {
        bedDocs.push({
          room_id: room._id,
          bed_number: i,
          daily_price: dailyPrice,
          status: 'available',
        })
      }
    }
    const beds = await Bed.insertMany(bedDocs)
    console.log(`   ✅ ${beds.length} ta karavot yaratildi`)

    // 11. Queues (5 ta - bemorlar navbatda)
    console.log('\n11. Navbatlar yaratilmoqda...')
    const queueDocs = [
      { patient_id: patients[0]._id, doctor_id: doctors[0]._id, queue_number: 1, queue_type: 'NORMAL', status: 'WAITING' },
      { patient_id: patients[1]._id, doctor_id: doctors[0]._id, queue_number: 2, queue_type: 'NORMAL', status: 'WAITING' },
      { patient_id: patients[2]._id, doctor_id: doctors[1]._id, queue_number: 1, queue_type: 'URGENT', status: 'IN_PROGRESS', called_at: new Date() },
      { patient_id: patients[3]._id, doctor_id: doctors[1]._id, queue_number: 2, queue_type: 'NORMAL', status: 'WAITING' },
      { patient_id: patients[4]._id, doctor_id: doctors[2]._id, queue_number: 1, queue_type: 'APPOINTMENT', status: 'WAITING' },
    ]
    const queues = await Queue.insertMany(queueDocs)
    console.log(`   ✅ ${queues.length} ta navbat yaratildi`)

    // 12. Prescriptions (3 ta)
    console.log('\n12. Retseptlar yaratilmoqda...')
    const prescriptions = []
    const prescData = [
      {
        patient_id: patients[2]._id, doctor_id: doctors[1]._id, nurse_id: nurses[1]._id, queue_id: queues[2]._id,
        diagnosis: 'ORVI - o\'tkir respirator virusli infeksiya',
        medications: [
          { medication_name: 'Paracetamol sirop', dosage: '5ml', frequency: 'Kuniga 3 marta', frequency_per_day: 3, duration_days: 5, instructions: 'Ovqatdan keyin' },
          { medication_name: 'Ambroxol sirop', dosage: '2.5ml', frequency: 'Kuniga 2 marta', frequency_per_day: 2, duration_days: 7, instructions: 'Ovqatdan oldin' },
        ],
      },
      {
        patient_id: patients[4]._id, doctor_id: doctors[0]._id,
        diagnosis: 'Bronxial astma - yengil darajali',
        prescription_type: 'CHRONIC',
        medications: [
          { medication_name: 'Cetirizin sirop', dosage: '5ml', frequency: 'Kuniga 1 marta', frequency_per_day: 1, duration_days: 14, instructions: 'Kechqurun' },
          { medication_name: 'Vitamin C 500mg', dosage: '1 tabletka', frequency: 'Kuniga 1 marta', frequency_per_day: 1, duration_days: 30, instructions: 'Ertalab ovqatdan keyin' },
        ],
      },
      {
        patient_id: patients[6]._id, doctor_id: doctors[2]._id,
        diagnosis: 'Gastrit - oshqozon yallig\'lanishi',
        medications: [
          { medication_name: 'Omeprazol 20mg', dosage: '1 tabletka', frequency: 'Kuniga 1 marta', frequency_per_day: 1, duration_days: 14, instructions: 'Ertalab ovqatdan 30 min oldin' },
          { medication_name: 'Amoxicillin 250mg', dosage: '1 tabletka', frequency: 'Kuniga 3 marta', frequency_per_day: 3, duration_days: 7, instructions: 'Ovqatdan keyin' },
          { medication_name: 'Metronidazol 250mg', dosage: '1 tabletka', frequency: 'Kuniga 2 marta', frequency_per_day: 2, duration_days: 7, instructions: 'Ovqat bilan' },
        ],
      },
    ]
    for (const p of prescData) {
      const presc = await Prescription.create(p)
      prescriptions.push(presc)
    }
    console.log(`   ✅ ${prescriptions.length} ta retsept yaratildi`)

    // 13. Invoices (3 ta)
    console.log('\n13. Hisob-fakturalar yaratilmoqda...')
    const invoiceDocs = [
      {
        patient_id: patients[0]._id,
        invoice_number: 'INV-2026-00001',
        items: [
          { item_type: 'service', description: 'Pediatr konsultatsiyasi', quantity: 1, unit_price: 100000, total_price: 100000 },
          { item_type: 'service', description: 'Umumiy qon tahlili', quantity: 1, unit_price: 50000, total_price: 50000 },
        ],
        total_amount: 150000,
        paid_amount: 150000,
        balance: 0,
        status: 'paid',
        payment_status: 'paid',
        payment_method: 'cash',
        created_by: receptionist._id,
        metadata: { doctor_name: `${doctors[0].first_name} ${doctors[0].last_name}`, doctor_id: doctors[0]._id },
      },
      {
        patient_id: patients[2]._id,
        invoice_number: 'INV-2026-00002',
        items: [
          { item_type: 'service', description: 'Nevrolog konsultatsiyasi', quantity: 1, unit_price: 120000, total_price: 120000 },
          { item_type: 'service', description: 'UZI tekshiruv', quantity: 1, unit_price: 150000, total_price: 150000 },
          { item_type: 'service', description: 'Biokimyoviy tahlil', quantity: 1, unit_price: 200000, total_price: 200000 },
        ],
        total_amount: 470000,
        paid_amount: 200000,
        balance: 270000,
        status: 'partial',
        payment_status: 'partial',
        payment_method: 'card',
        created_by: receptionist._id,
        metadata: { doctor_name: `${doctors[1].first_name} ${doctors[1].last_name}`, doctor_id: doctors[1]._id },
      },
      {
        patient_id: patients[4]._id,
        invoice_number: 'INV-2026-00003',
        items: [
          { item_type: 'service', description: 'Pediatr konsultatsiyasi', quantity: 1, unit_price: 100000, total_price: 100000 },
          { item_type: 'service', description: 'Allergiya paneli (IgE)', quantity: 1, unit_price: 300000, total_price: 300000 },
        ],
        total_amount: 400000,
        paid_amount: 0,
        balance: 400000,
        status: 'pending',
        payment_status: 'pending',
        created_by: receptionist._id,
        metadata: { doctor_name: `${doctors[0].first_name} ${doctors[0].last_name}`, doctor_id: doctors[0]._id },
      },
    ]
    const invoices = await Invoice.insertMany(invoiceDocs)
    console.log(`   ✅ ${invoices.length} ta hisob-faktura yaratildi`)

    // 14. Admissions (2 ta)
    console.log('\n14. Statsionar qabullar yaratilmoqda...')
    const inpatientRooms = rooms.filter(r => r.department === 'inpatient')
    const inpatientBeds = beds.filter(b => inpatientRooms.some(r => r._id.equals(b.room_id)))

    const admissionDocs = [
      {
        patient_id: patients[5]._id,
        room_id: inpatientRooms[0]._id,
        bed_number: 1,
        bed_id: inpatientBeds[0]._id,
        admission_type: 'inpatient',
        diagnosis: 'Pnevmoniya - o\'pka yallig\'lanishi',
        admitted_by: doctors[0]._id,
        bed_daily_price: 150000,
        notes: 'Antibiotik terapiya boshlandi',
      },
      {
        patient_id: patients[8]._id,
        room_id: inpatientRooms[1]._id,
        bed_number: 1,
        bed_id: inpatientBeds.find(b => b.room_id.equals(inpatientRooms[1]._id))?._id,
        admission_type: 'inpatient',
        diagnosis: 'Degidratsiya - suvsizlanish',
        admitted_by: doctors[2]._id,
        bed_daily_price: 150000,
        notes: 'Infuzion terapiya',
      },
    ]
    const admissions = await Admission.insertMany(admissionDocs)

    // Update beds status
    for (const adm of admissions) {
      await Bed.findByIdAndUpdate(adm.bed_id, {
        status: 'occupied',
        current_patient_id: adm.patient_id,
        current_admission_id: adm._id,
        occupied_at: new Date(),
      })
    }
    console.log(`   ✅ ${admissions.length} ta qabul yaratildi (karavotlar yangilandi)`)

    // ==================== SUMMARY ====================
    console.log('\n========================================')
    console.log('  ✅ SEED MUVAFFAQIYATLI YAKUNLANDI!')
    console.log('========================================')
    console.log(`  Staff:        ${staff.length} ta`)
    console.log(`  Bemorlar:     ${patients.length} ta`)
    console.log(`  Kategoriyalar:${categories.length} ta`)
    console.log(`  Xizmatlar:    ${services.length} ta`)
    console.log(`  Dorilar:      ${medicines.length} ta`)
    console.log(`  Lab testlar:  ${labTests.length} ta`)
    console.log(`  Xonalar:      ${rooms.length} ta`)
    console.log(`  Karavotlar:   ${beds.length} ta`)
    console.log(`  Navbatlar:    ${queues.length} ta`)
    console.log(`  Retseptlar:   ${prescriptions.length} ta`)
    console.log(`  Fakturalar:   ${invoices.length} ta`)
    console.log(`  Qabullar:     ${admissions.length} ta`)
    console.log('========================================')
    console.log('\n  Login: admin / test123')
    console.log('  Barcha parollar: test123')
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ XATO:', error.message)
    console.error(error)
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB uzildi.')
    process.exit(0)
  }
}

seed()
