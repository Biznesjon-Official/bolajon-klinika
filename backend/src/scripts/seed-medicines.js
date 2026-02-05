import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

const sampleMedicines = [
  {
    name: 'Paracetamol',
    generic_name: 'Acetaminophen',
    manufacturer: 'PharmaCorp',
    category: 'tablet',
    dosage_form: 'Tablet',
    strength: '500mg',
    unit_price: 500,
    quantity: 1000,
    reorder_level: 100,
    floor: 1,
    shelf_location: 'A1',
    status: 'available'
  },
  {
    name: 'Amoxicillin',
    generic_name: 'Amoxicillin',
    manufacturer: 'MediPharm',
    category: 'tablet',
    dosage_form: 'Capsule',
    strength: '250mg',
    unit_price: 1500,
    quantity: 500,
    reorder_level: 50,
    floor: 1,
    shelf_location: 'A2',
    status: 'available'
  },
  {
    name: 'Ibuprofen',
    generic_name: 'Ibuprofen',
    manufacturer: 'HealthMed',
    category: 'tablet',
    dosage_form: 'Tablet',
    strength: '400mg',
    unit_price: 800,
    quantity: 750,
    reorder_level: 75,
    floor: 1,
    shelf_location: 'A3',
    status: 'available'
  },
  {
    name: 'Cough Syrup',
    generic_name: 'Dextromethorphan',
    manufacturer: 'SyrupCo',
    category: 'syrup',
    dosage_form: 'Syrup',
    strength: '100ml',
    unit_price: 5000,
    quantity: 200,
    reorder_level: 20,
    floor: 1,
    shelf_location: 'B1',
    status: 'available'
  },
  {
    name: 'Insulin Injection',
    generic_name: 'Insulin',
    manufacturer: 'DiabetesCare',
    category: 'injection',
    dosage_form: 'Injection',
    strength: '100IU/ml',
    unit_price: 25000,
    quantity: 50,
    reorder_level: 10,
    floor: 1,
    shelf_location: 'C1',
    status: 'available'
  }
];

async function seedMedicines() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Clear existing medicines
    await Medicine.deleteMany({});
    console.log('🗑️  Cleared existing medicines\n');
    
    // Insert sample medicines
    await Medicine.insertMany(sampleMedicines);
    console.log(`✅ Inserted ${sampleMedicines.length} sample medicines\n`);
    
    console.log('Sample medicines:');
    sampleMedicines.forEach((med, i) => {
      console.log(`  ${i + 1}. ${med.name} (${med.strength}) - ${med.quantity} units`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedMedicines();
