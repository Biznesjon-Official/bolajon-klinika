import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './backend/.env' });

async function checkPatientPassword() {
  try {
    console.log('=== CHECKING PATIENT PASSWORD ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find patient
    const patient = await Patient.findOne({ username: 'mironshox' }).select('+password');
    
    if (!patient) {
      console.log('❌ Patient not found');
      return;
    }
    
    console.log('✓ Patient found:');
    console.log('  Patient Number:', patient.patient_number);
    console.log('  Username:', patient.username);
    console.log('  Password Hash:', patient.password);
    console.log('  Status:', patient.status);
    console.log('\n');
    
    // Test different passwords
    const testPasswords = ['123456', 'password', 'mironshox', '1234', '12345678'];
    
    for (const pwd of testPasswords) {
      const isMatch = await patient.comparePassword(pwd);
      console.log(`  Testing "${pwd}": ${isMatch ? '✓ MATCH' : '✗ No match'}`);
    }
    
    console.log('\n--- Updating password to "123456" ---');
    patient.password = '123456';
    await patient.save();
    console.log('✓ Password updated successfully\n');
    
    // Verify new password
    const updatedPatient = await Patient.findOne({ username: 'mironshox' }).select('+password');
    const isNewPasswordCorrect = await updatedPatient.comparePassword('123456');
    console.log('✓ New password verification:', isNewPasswordCorrect ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

checkPatientPassword();
