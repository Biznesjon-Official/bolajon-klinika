import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LabOrder from '../models/LabOrder.js';
import LabTest from '../models/LabTest.js';
import Patient from '../models/Patient.js';
import Staff from '../models/Staff.js';

dotenv.config({ path: './backend/.env' });

async function seedLabOrders() {
  try {
    console.log('=== SEEDING LAB ORDERS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Get test data
    const patients = await Patient.find({ status: 'active' }).limit(3);
    const doctor = await Staff.findOne({ role: 'doctor' });
    const laborant = await Staff.findOne({ role: 'laborant' });
    const tests = await LabTest.find({ is_active: true }).limit(5);
    
    if (patients.length === 0) {
      console.log('❌ No patients found');
      return;
    }
    
    if (tests.length === 0) {
      console.log('❌ No lab tests found. Creating sample tests...\n');
      
      const sampleTests = [
        {
          name: 'Umumiy qon tahlili',
          code: 'CBC',
          category: 'Hematologiya',
          description: 'To\'liq qon tahlili',
          price: 50000,
          duration_minutes: 30,
          sample_type: 'Qon',
          is_active: true
        },
        {
          name: 'Qandli diabet tahlili',
          code: 'GLU',
          category: 'Biokimyo',
          description: 'Qon shakar darajasi',
          price: 30000,
          duration_minutes: 20,
          sample_type: 'Qon',
          is_active: true
        },
        {
          name: 'Siydik tahlili',
          code: 'UA',
          category: 'Klinik',
          description: 'Umumiy siydik tahlili',
          price: 25000,
          duration_minutes: 25,
          sample_type: 'Siydik',
          is_active: true
        }
      ];
      
      for (const testData of sampleTests) {
        const test = new LabTest(testData);
        await test.save();
        tests.push(test);
        console.log(`✓ Created test: ${test.name}`);
      }
      console.log('');
    }
    
    console.log(`Found ${patients.length} patients`);
    console.log(`Found ${tests.length} tests`);
    console.log('');
    
    // Delete existing orders
    await LabOrder.deleteMany({});
    console.log('✓ Cleared existing orders\n');
    
    // Create sample orders
    const orders = [];
    const statuses = ['pending', 'sample_collected', 'in_progress', 'completed'];
    
    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length];
      const test = tests[i % tests.length];
      const status = statuses[i % statuses.length];
      
      const order = new LabOrder({
        patient_id: patient._id,
        doctor_id: doctor?._id,
        test_type: test.category,
        test_name: test.name,
        priority: i % 3 === 0 ? 'urgent' : 'normal',
        sample_type: test.sample_type,
        notes: `Test order ${i + 1}`,
        price: test.price,
        status: status
      });
      
      // Add sample collection time for non-pending orders
      if (status !== 'pending') {
        order.sample_collected_at = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      }
      
      // Add completion data for completed orders
      if (status === 'completed') {
        order.laborant_id = laborant?._id;
        order.completed_at = new Date();
        order.results = [
          {
            parameter_name: 'Hemoglobin',
            value: '140',
            unit: 'g/L',
            normal_range: '120-160',
            is_normal: true
          },
          {
            parameter_name: 'Eritrotsitlar',
            value: '4.5',
            unit: '10^12/L',
            normal_range: '4.0-5.5',
            is_normal: true
          }
        ];
      }
      
      await order.save();
      orders.push(order);
      
      console.log(`✓ Created order ${order.order_number} - ${status} - ${test.name}`);
    }
    
    console.log(`\n✓ Created ${orders.length} lab orders`);
    console.log('\nOrder statuses:');
    console.log(`  Pending: ${orders.filter(o => o.status === 'pending').length}`);
    console.log(`  Sample collected: ${orders.filter(o => o.status === 'sample_collected').length}`);
    console.log(`  In progress: ${orders.filter(o => o.status === 'in_progress').length}`);
    console.log(`  Completed: ${orders.filter(o => o.status === 'completed').length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

seedLabOrders();
