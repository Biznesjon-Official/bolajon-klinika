/**
 * Create Reception User
 * Reception role bilan staff yaratish
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

// Staff schema
const staffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true },
  status: { type: String, default: 'active' },
  department: { type: String },
  specialization: { type: String }
}, { timestamps: true });

// Password comparison method
staffSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full_name
staffSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

const Staff = mongoose.model('Staff', staffSchema);

async function createReceptionUser() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if reception user exists
    const existingStaff = await Staff.findOne({ username: 'reception' });
    
    if (existingStaff) {
      console.log('⚠️  Reception staff allaqachon mavjud');
      console.log('Username:', existingStaff.username);
      console.log('Role:', existingStaff.role);
      console.log('Name:', existingStaff.first_name, existingStaff.last_name);
      console.log('Status:', existingStaff.status);
      
      // Update password and role if needed
      const hashedPassword = await bcrypt.hash('reception123', 10);
      existingStaff.password = hashedPassword;
      existingStaff.role = 'receptionist';  // 'reception' emas, 'receptionist'
      existingStaff.status = 'active';
      await existingStaff.save();
      console.log('✅ Password va role yangilandi: reception123');
    } else {
      // Create new reception staff
      const hashedPassword = await bcrypt.hash('reception123', 10);
      
      const receptionStaff = new Staff({
        username: 'reception',
        password: hashedPassword,
        email: 'reception@clinic.uz',
        first_name: 'Qabulxona',
        last_name: 'Xodimi',
        phone: '+998901234568',
        role: 'receptionist',  // 'reception' emas, 'receptionist'
        status: 'active',
        department: 'Qabulxona'
      });
      
      await receptionStaff.save();
      console.log('✅ Reception staff yaratildi!');
      console.log('Username: reception');
      console.log('Password: reception123');
      console.log('Role: receptionist');
    }

    await mongoose.disconnect();
    console.log('\n✅ Bajarildi!');
  } catch (error) {
    console.error('❌ Xato:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createReceptionUser();
