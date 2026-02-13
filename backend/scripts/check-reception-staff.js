import mongoose from 'mongoose';
import Staff from './src/models/Staff.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function checkStaff() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const staff = await Staff.findOne({ username: 'reception' });
    
    if (staff) {
      console.log('Staff found:');
      console.log('Username:', staff.username);
      console.log('Role:', staff.role);
      console.log('Status:', staff.status);
      console.log('Name:', staff.first_name, staff.last_name);
    } else {
      console.log('❌ Staff not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStaff();
