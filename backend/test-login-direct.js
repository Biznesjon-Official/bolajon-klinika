import mongoose from 'mongoose';
import Staff from './src/models/Staff.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const username = 'reception';
    const password = 'reception123';

    console.log('Testing login with:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log();

    // Find staff
    const staff = await Staff.findOne({ 
      username: username.toLowerCase(),
      status: 'active'
    });
    
    if (!staff) {
      console.log('❌ Staff not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Staff found:');
    console.log('  Username:', staff.username);
    console.log('  Role:', staff.role);
    console.log('  Status:', staff.status);
    console.log();

    // Test password
    console.log('Testing password...');
    const isValid = await staff.comparePassword(password);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
      console.log('\nPassword hash:', staff.password.substring(0, 30) + '...');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

testLogin();
