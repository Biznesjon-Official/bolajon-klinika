import mongoose from 'mongoose';
import Staff from './src/models/Staff.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function recreateReception() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Delete existing
    await Staff.deleteMany({ username: 'reception' });
    console.log('🗑️  Deleted existing reception staff\n');

    // Create new
    const newStaff = new Staff({
      username: 'reception',
      password: 'reception123',  // Will be hashed by pre-save hook
      email: 'reception@clinic.uz',
      first_name: 'Qabulxona',
      last_name: 'Xodimi',
      phone: '+998901234568',
      role: 'receptionist',
      status: 'active',
      department: 'Qabulxona'
    });

    await newStaff.save();
    console.log('✅ Created new reception staff');
    console.log('Username: reception');
    console.log('Password: reception123');
    console.log('Role:', newStaff.role);
    console.log('Status:', newStaff.status);

    // Test password
    const isValid = await newStaff.comparePassword('reception123');
    console.log('\nPassword test:', isValid ? '✅ Valid' : '❌ Invalid');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

recreateReception();
