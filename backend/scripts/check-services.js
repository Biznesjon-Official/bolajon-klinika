import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/Service.js';

dotenv.config();

async function checkServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const services = await Service.find({}).sort({ category: 1, name: 1 });
    console.log(`📋 Total services: ${services.length}\n`);

    // Group by category
    const grouped = {};
    services.forEach(service => {
      const cat = service.category || 'No category';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    });

    // Display
    for (const [category, items] of Object.entries(grouped)) {
      console.log(`\n📁 ${category} (${items.length} ta):`);
      items.forEach(s => {
        console.log(`   - ${s.name} (${s.price.toLocaleString()} so'm) ${s.is_active ? '✅' : '❌'}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkServices();
