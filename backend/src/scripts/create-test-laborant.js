import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff.js';

dotenv.config({ path: './backend/.env' });

async function createTestLaborant() {
  try {
    console.log('=== CREATING TEST LABORANT ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Check if laborant already exists
    const existing = await Staff.findOne({ username: 'laborant1' });
    
    if (existing) {
      console.log('✓ Laborant already exists');
      console.log('  Username:', existing.username);
      console.log('  Name:', existing.full_name);
      console.log('  Role:', existing.role);
      
      // Update password
      existing.password = '123456';
      await existing.save();
      console.log('✓ Password updated to: 123456\n');
    } else {
      // Create new laborant
      const laborant = new Staff({
        username: 'laborant1',
        password: '123456',
        first_name: 'Test',
        last_name: 'Laborant',
        email: 'laborant@test.com',
        phone: '+998901234567',
        role: 'laborant',
        department: 'Laboratoriya',
        status: 'active'
      });
      
      await laborant.save();
      
      console.log('✓ Test laborant created!');
      console.log('  Username: laborant1');
      console.log('  Password: 123456');
      console.log('  Name:', laborant.full_name);
      console.log('  Role:', laborant.role);
      console.log('');
    }
    
    console.log('Login credentials:');
    console.log('  Username: laborant1');
    console.log('  Password: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

createTestLaborant();
