import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import LabTest from '../src/models/LabTest.js';
import LabOrder from '../src/models/LabOrder.js';

async function checkTestParameters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all tests
    const tests = await LabTest.find().lean();
    console.log(`\n📊 Total tests: ${tests.length}`);
    
    // Check which tests have test_parameters
    const testsWithParams = tests.filter(t => t.test_parameters && t.test_parameters.length > 0);
    console.log(`✅ Tests with parameters: ${testsWithParams.length}`);
    
    if (testsWithParams.length > 0) {
      console.log('\n📋 Tests with parameters:');
      testsWithParams.forEach(test => {
        console.log(`\n  Test: ${test.name}`);
        console.log(`  ID: ${test._id}`);
        console.log(`  Parameters count: ${test.test_parameters.length}`);
        console.log(`  Parameters:`);
        test.test_parameters.forEach((param, index) => {
          console.log(`    ${index + 1}. ${param.name} (${param.unit}) - ${param.normal_range}`);
        });
      });
    }
    
    // Check recent orders
    console.log('\n\n📦 Checking recent orders...');
    const recentOrders = await LabOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log(`\n📊 Recent ${recentOrders.length} orders:`);
    for (const order of recentOrders) {
      console.log(`\n  Order: ${order.order_number}`);
      console.log(`  Test name: ${order.test_name}`);
      console.log(`  Test ID: ${order.test_id || 'MISSING!'}`);
      console.log(`  Status: ${order.status}`);
      
      if (order.test_id) {
        const test = await LabTest.findById(order.test_id).lean();
        if (test) {
          console.log(`  ✅ Test found in database`);
          console.log(`  Test has parameters: ${test.test_parameters && test.test_parameters.length > 0 ? 'YES (' + test.test_parameters.length + ')' : 'NO'}`);
        } else {
          console.log(`  ❌ Test NOT found in database (orphaned test_id)`);
        }
      } else {
        console.log(`  ⚠️  No test_id in order`);
      }
    }
    
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkTestParameters();
