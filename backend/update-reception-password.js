import mongoose from 'mongoose';
import Staff from './src/models/Staff.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function updatePassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const staff = await Staff.findOne({ username: 'reception' });
    
    if (staff) {
      console.log('Staff found:', staff.username);
      console.log('Current role:', staff.role);
      
      // Set new password
      staff.password = 'reception123';
      await staff.save();
      
      console.log('✅ Password updated!');
      
      // Test password
      const isValid = await staff.comparePassword('reception123');
      console.log('Password test:', isValid ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('❌ Staff not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

updatePassword();
