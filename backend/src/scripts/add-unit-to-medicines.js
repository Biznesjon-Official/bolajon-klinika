import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Medicine from '../models/Medicine.js';

dotenv.config();

const addUnitToMedicines = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Adding unit field to medicines...');
    
    // Barcha dorilarni yangilash
    const result = await Medicine.updateMany(
      { unit: { $exists: false } }, // unit maydoni yo'q bo'lganlarni topish
      { $set: { unit: 'dona' } } // default qiymat
    );

    console.log(`✅ Updated ${result.modifiedCount} medicines with unit field`);

    // Natijani ko'rsatish
    const medicines = await Medicine.find().limit(10);
    console.log('\n📋 Sample medicines:');
    medicines.forEach(med => {
      console.log(`  - ${med.name}: ${med.quantity} ${med.unit}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

addUnitToMedicines();
