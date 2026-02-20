import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Staff from './src/models/Staff.js';

dotenv.config();

async function fixReceptionFinal() {naqa
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    const username = 'reception';
    const password = 'reception123';
    
    console.log('🔍 Finding user:', username);
    let user = await Staff.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found! Creating new user...\n');
      
      user = new Staff({
        username: 'reception',
        password: password, // Will be hashed by pre-save hook
        email: 'reception@clinic.uz',
        first_name: 'Malika',
        last_name: 'Rahimova',
        phone: '+998901111111',
        role: 'receptionist',
        specialization: 'Qabulxona xodimi',
        status: 'active',
        salary: 3000000,
        hire_date: new Date()
      });
      
      await user.save();
      console.log('✅ User created!');
    } else {
      console.log('✅ User found:', user.first_name, user.last_name);
      console.log('   Username:', user.username);
      console.log('   Role:', user.role);
      console.log('   Status:', user.status);
      
      // Update password manually (bypass pre-save hook)
      console.log('\n🔐 Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Use updateOne to bypass pre-save hook
      await Staff.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            status: 'active'
          }
        }
      );
      
      console.log('✅ Password updated!');
    }
    
    // Test password
    console.log('\n🧪 Testing login...');
    const testUser = await Staff.findOne({ username: username.toLowerCase() });
    
    if (!testUser) {
      console.log('❌ User not found after update!');
      process.exit(1);
    }
    
    const isValid = await testUser.comparePassword(password);
    
    console.log('   Username:', testUser.username);
    console.log('   Password test:', isValid ? '✅ VALID' : '❌ INVALID');
    console.log('   Status:', testUser.status);
    console.log('   Role:', testUser.role);
    
    if (isValid) {
      console.log('\n🎉 SUCCESS! You can now login with:');
      console.log('   Username: reception');
      console.log('   Password: reception123');
    } else {
      console.log('\n❌ FAILED! Password still not working.');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixReceptionFinal();
