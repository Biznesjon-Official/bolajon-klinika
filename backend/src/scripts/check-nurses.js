import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff.js';

dotenv.config();

const checkNurses = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Hamshiralarni topish - role to'g'ridan-to'g'ri string
    const nurses = await Staff.find({ role: 'nurse' });
    
    console.log(`\n📊 Total nurses: ${nurses.length}`);
    
    if (nurses.length === 0) {
      console.log('❌ No nurses found in database!');
      console.log('\n💡 Creating a test nurse...');
      
      const testNurse = new Staff({
        first_name: 'Test',
        last_name: 'Hamshira',
        username: 'test_nurse',
        password: 'password123',
        role: 'nurse',
        specialization: 'Umumiy hamshira',
        phone: '+998901234567',
        email: 'test.nurse@hospital.uz',
        status: 'active'
      });
      
      await testNurse.save();
      console.log('✅ Test nurse created!');
    } else {
      console.log('\n📋 Nurses list:');
      nurses.forEach((nurse, index) => {
        console.log(`  ${index + 1}. ${nurse.first_name} ${nurse.last_name}`);
        console.log(`     - Username: ${nurse.username}`);
        console.log(`     - Status: ${nurse.status}`);
        console.log(`     - Phone: ${nurse.phone || 'N/A'}`);
        console.log('');
      });
    }

    console.log('✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkNurses();
