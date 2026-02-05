import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Patient from '../models/Patient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '../../.env') });

async function checkAccessCodes() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI ? 'MongoDB configured' : 'MongoDB NOT configured');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Barcha bemorlarni olish
    const patients = await Patient.find()
      .select('patient_number first_name last_name access_code')
      .limit(10)
      .lean();
    
    console.log('\n📋 Bemorlar va ularning access_code lari:\n');
    
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.first_name} ${patient.last_name}`);
      console.log(`   Bemor raqami: ${patient.patient_number}`);
      console.log(`   Access code: ${patient.access_code || '❌ YO\'Q'}`);
      console.log('');
    });
    
    // Access code bo'lmagan bemorlar sonini hisoblash
    const withoutCode = await Patient.countDocuments({ access_code: { $exists: false } });
    const withCode = await Patient.countDocuments({ access_code: { $exists: true } });
    
    console.log(`\n📊 Statistika:`);
    console.log(`   Access code bor: ${withCode}`);
    console.log(`   Access code yo'q: ${withoutCode}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkAccessCodes();
