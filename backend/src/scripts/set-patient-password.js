import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';

dotenv.config({ path: './backend/.env' });

async function setPatientPassword() {
  try {
    const username = process.argv[2];
    const password = process.argv[3] || '123456';
    
    if (!username) {
      console.log('Usage: node set-patient-password.js <username> [password]');
      console.log('Example: node set-patient-password.js aaaaaaaa 123456');
      return;
    }
    
    console.log('=== SETTING PATIENT PASSWORD ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find patient by username or patient_number
    const patient = await Patient.findOne({
      $or: [
        { username: username.toLowerCase() },
        { patient_number: username.toUpperCase() }
      ]
    });
    
    if (!patient) {
      console.log(`❌ Patient not found: ${username}`);
      return;
    }
    
    console.log('✓ Patient found:');
    console.log(`  Name: ${patient.full_name}`);
    console.log(`  Patient Number: ${patient.patient_number}`);
    console.log(`  Username: ${patient.username || 'yo\'q'}`);
    console.log('');
    
    // Set password
    patient.password = password;
    await patient.save();
    
    console.log(`✓ Password set to: ${password}`);
    console.log('');
    console.log('Login credentials:');
    console.log(`  Username: ${patient.username || patient.patient_number}`);
    console.log(`  Password: ${password}`);
    console.log('');
    console.log('⚠️  Login sahifasida "Men bemor sifatida kirmoqchiman" checkboxni belgilang!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

setPatientPassword();
