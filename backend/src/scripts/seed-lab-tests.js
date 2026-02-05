import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LabTest from '../models/LabTest.js';

dotenv.config();

const labTests = [
  {
    name: 'Umumiy qon tahlili',
    code: 'CBC',
    category: 'hematology',
    description: 'To\'liq qon tahlili - eritrotsitlar, leykotsitlar, trombotsitlar',
    price: 50000,
    duration_minutes: 30,
    sample_type: 'blood',
    preparation_instructions: 'Och qoringa',
    normal_range: 'Eritrotsitlar: 4.5-5.5 mln/mkl',
    is_active: true
  },
  {
    name: 'Qon shakar',
    code: 'GLU',
    category: 'biochemistry',
    description: 'Qondagi glyukoza miqdori',
    price: 30000,
    duration_minutes: 20,
    sample_type: 'blood',
    preparation_instructions: 'Och qoringa, 8-12 soat ovqatlanmaslik',
    normal_range: '3.3-5.5 mmol/l',
    is_active: true
  },
  {
    name: 'Umumiy siydik tahlili',
    code: 'UA',
    category: 'urine',
    description: 'Siydik tahlili - fizik, kimyoviy va mikroskopik tekshiruv',
    price: 40000,
    duration_minutes: 30,
    sample_type: 'urine',
    preparation_instructions: 'Ertalabki birinchi siydik',
    normal_range: 'Oqsil: yo\'q, Glyukoza: yo\'q',
    is_active: true
  },
  {
    name: 'Jigar fermentlari (ALT, AST)',
    code: 'LFT',
    category: 'biochemistry',
    description: 'Jigar faoliyatini baholash',
    price: 80000,
    duration_minutes: 60,
    sample_type: 'blood',
    preparation_instructions: 'Och qoringa',
    normal_range: 'ALT: 0-40 U/l, AST: 0-40 U/l',
    is_active: true
  },
  {
    name: 'Buyrak funksiyasi (Kreatinin, Urea)',
    code: 'RFT',
    category: 'biochemistry',
    description: 'Buyrak faoliyatini baholash',
    price: 70000,
    duration_minutes: 45,
    sample_type: 'blood',
    preparation_instructions: 'Och qoringa',
    normal_range: 'Kreatinin: 60-110 mkmol/l, Urea: 2.5-8.3 mmol/l',
    is_active: true
  },
  {
    name: 'Lipid profili',
    code: 'LIPID',
    category: 'biochemistry',
    description: 'Xolesterin va triglitseridlar',
    price: 90000,
    duration_minutes: 60,
    sample_type: 'blood',
    preparation_instructions: 'Och qoringa, 12 soat ovqatlanmaslik',
    normal_range: 'Umumiy xolesterin: <5.2 mmol/l',
    is_active: true
  },
  {
    name: 'Qalqonsimon bez gormonlari (TSH, T3, T4)',
    code: 'TFT',
    category: 'immunology',
    description: 'Qalqonsimon bez faoliyati',
    price: 120000,
    duration_minutes: 90,
    sample_type: 'blood',
    preparation_instructions: 'Maxsus tayyorgarlik talab qilinmaydi',
    normal_range: 'TSH: 0.4-4.0 mU/l',
    is_active: true
  },
  {
    name: 'Gemoglobin A1c',
    code: 'HBA1C',
    category: 'biochemistry',
    description: '3 oylik qon shakar nazorati',
    price: 100000,
    duration_minutes: 60,
    sample_type: 'blood',
    preparation_instructions: 'Maxsus tayyorgarlik talab qilinmaydi',
    normal_range: '<5.7% - normal',
    is_active: true
  },
  {
    name: 'Qon guruhi va Rh faktor',
    code: 'BG',
    category: 'hematology',
    description: 'Qon guruhi va Rh faktorni aniqlash',
    price: 60000,
    duration_minutes: 30,
    sample_type: 'blood',
    preparation_instructions: 'Maxsus tayyorgarlik talab qilinmaydi',
    normal_range: 'A, B, AB, O; Rh+ yoki Rh-',
    is_active: true
  },
  {
    name: 'Najas tahlili',
    code: 'STOOL',
    category: 'microbiology',
    description: 'Najas mikroskopik va bakteriologik tekshiruvi',
    price: 50000,
    duration_minutes: 120,
    sample_type: 'stool',
    preparation_instructions: 'Toza idishda yig\'ish',
    normal_range: 'Parazitlar: topilmadi',
    is_active: true
  }
];

async function seedLabTests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing lab tests...');
    await LabTest.deleteMany({});

    console.log('📝 Creating lab tests...');
    for (const testData of labTests) {
      const test = new LabTest(testData);
      await test.save();
      console.log(`✅ Created test: ${test.name} (${test.code})`);
    }

    console.log('\n✅ All lab tests seeded successfully!');
    console.log(`Total tests: ${labTests.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding lab tests:', error);
    process.exit(1);
  }
}

seedLabTests();
