import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/Service.js';

dotenv.config();

const SAMPLE_SERVICES = [
  // Shifokor ko'rigi
  { name: 'Terapevt konsultatsiyasi', category: 'Shifokor ko\'rigi', price: 50000 },
  { name: 'Pediatr ko\'rigi', category: 'Shifokor ko\'rigi', price: 60000 },
  { name: 'Nevropatolog qabuli', category: 'Shifokor ko\'rigi', price: 80000 },
  
  // Kunduzgi muolaja
  { name: 'Kunduzgi statsionar (1 kun)', category: 'Kunduzgi muolaja', price: 150000 },
  { name: 'Koykada yotqizish', category: 'Kunduzgi muolaja', price: 200000 },
  
  // Laboratoriya xizmatlari
  { name: 'Umumiy qon tahlili', category: 'Laboratoriya xizmatlari', price: 30000 },
  { name: 'Biokimyoviy qon tahlili', category: 'Laboratoriya xizmatlari', price: 50000 },
  { name: 'Umumiy siydik tahlili', category: 'Laboratoriya xizmatlari', price: 25000 },
  
  // Fizioterapiya xizmatlari
  { name: 'Massaj (1 seans)', category: 'Fizioterapiya xizmatlari', price: 40000 },
  { name: 'Fizioterapiya kursi', category: 'Fizioterapiya xizmatlari', price: 100000 },
  { name: 'Reabilitatsiya mashg\'uloti', category: 'Fizioterapiya xizmatlari', price: 70000 },
  
  // Boshqa
  { name: 'EKG', category: 'Boshqa', price: 35000 },
  { name: 'Ultratovush tekshiruvi', category: 'Boshqa', price: 80000 }
];

async function createSampleServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Delete existing services
    const deleteResult = await Service.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing services\n`);

    // Create new services
    console.log('📝 Creating sample services...\n');
    
    for (const serviceData of SAMPLE_SERVICES) {
      const service = await Service.create({
        ...serviceData,
        base_price: serviceData.price,
        is_active: true
      });
      console.log(`✅ Created: ${service.name} (${service.category}) - ${service.price.toLocaleString()} so'm`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Created ${SAMPLE_SERVICES.length} services`);
    console.log('='.repeat(60) + '\n');

    // Show services by category
    console.log('📊 Services by category:\n');
    const categories = [...new Set(SAMPLE_SERVICES.map(s => s.category))];
    for (const category of categories) {
      const count = await Service.countDocuments({ category });
      console.log(`   ${category}: ${count} ta xizmat`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSampleServices();
