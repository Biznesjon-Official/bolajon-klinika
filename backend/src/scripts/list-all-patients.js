import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';

dotenv.config({ path: './backend/.env' });

async function listAllPatients() {
  try {
    console.log('=== BARCHA BEMORLAR RO\'YXATI ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const patients = await Patient.find({ status: 'active' }).select('+password');
    
    console.log(`Jami ${patients.length} ta aktiv bemor:\n`);
    
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.full_name}`);
      console.log(`   Patient Number: ${patient.patient_number}`);
      console.log(`   Username: ${patient.username || 'yo\'q'}`);
      console.log(`   Phone: ${patient.phone}`);
      console.log(`   Has Password: ${patient.password ? 'Ha' : 'Yo\'q'}`);
      console.log('');
    });
    
    console.log('Login uchun:');
    console.log('  Username: patient_number yoki username');
    console.log('  Password: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

listAllPatients();
