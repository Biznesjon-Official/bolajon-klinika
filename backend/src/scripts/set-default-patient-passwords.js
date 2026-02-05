import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';

dotenv.config({ path: './backend/.env' });

async function setDefaultPasswords() {
  try {
    console.log('=== SETTING DEFAULT PATIENT PASSWORDS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find all active patients
    const patients = await Patient.find({ status: 'active' });
    
    console.log(`Found ${patients.length} active patients\n`);
    
    let updated = 0;
    
    for (const patient of patients) {
      // Set default password to "123456"
      patient.password = '123456';
      
      // Ensure username is set (use patient_number if not)
      if (!patient.username) {
        patient.username = patient.patient_number.toLowerCase();
      }
      
      await patient.save();
      
      console.log(`✓ Updated: ${patient.patient_number} (${patient.username}) - ${patient.full_name}`);
      updated++;
    }
    
    console.log(`\n✓ Updated ${updated} patients`);
    console.log('\nDefault credentials:');
    console.log('  Username: patient_number or username');
    console.log('  Password: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

setDefaultPasswords();
