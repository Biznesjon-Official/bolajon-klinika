import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/Service.js';

dotenv.config();

const CATEGORIES = {
  'Shifokor ko\'rigi': ['konsultatsiya', 'ko\'rik', 'qabul', 'shifokor', 'terapevt', 'pediatr', 'nevropatolog'],
  'Kunduzgi muolaja': ['statsionar', 'yotqizish', 'koyka', 'kunduzgi', 'muolaja'],
  'Laboratoriya xizmatlari': ['tahlil', 'qon', 'siydik', 'laboratoriya', 'analiz', 'test'],
  'Fizioterapiya xizmatlari': ['fizioterapiya', 'massaj', 'terapiya', 'reabilitatsiya', 'gimnastika'],
  'Boshqa': []
};

async function updateServiceCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const services = await Service.find({});
    console.log(`\n📋 Found ${services.length} services\n`);

    let updated = 0;
    let unchanged = 0;

    for (const service of services) {
      const serviceName = service.name.toLowerCase();
      let newCategory = 'Boshqa';

      // Check which category matches
      for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (category === 'Boshqa') continue;
        
        const matches = keywords.some(keyword => serviceName.includes(keyword));
        if (matches) {
          newCategory = category;
          break;
        }
      }

      // Update if category changed
      if (service.category !== newCategory) {
        const oldCategory = service.category;
        service.category = newCategory;
        await service.save();
        console.log(`✏️  Updated: "${service.name}"`);
        console.log(`   ${oldCategory} → ${newCategory}\n`);
        updated++;
      } else {
        unchanged++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Updated: ${updated} services`);
    console.log(`⏭️  Unchanged: ${unchanged} services`);
    console.log('='.repeat(50) + '\n');

    // Show services by category
    console.log('📊 Services by category:\n');
    for (const category of Object.keys(CATEGORIES)) {
      const count = await Service.countDocuments({ category, is_active: { $ne: false } });
      console.log(`   ${category}: ${count} ta xizmat`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateServiceCategories();
