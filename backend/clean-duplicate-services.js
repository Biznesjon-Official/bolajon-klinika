import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/Service.js';

dotenv.config();

const cleanDuplicateServices = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all services
    const allServices = await Service.find({});
    console.log(`\n📊 Total services: ${allServices.length}`);

    // Group by name
    const servicesByName = {};
    allServices.forEach(service => {
      const name = service.name.toLowerCase().trim();
      if (!servicesByName[name]) {
        servicesByName[name] = [];
      }
      servicesByName[name].push(service);
    });

    // Find duplicates
    const duplicates = Object.entries(servicesByName).filter(([name, services]) => services.length > 1);
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate services found!');
    } else {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate service names:`);
      
      for (const [name, services] of duplicates) {
        console.log(`\n📝 "${name}" - ${services.length} copies:`);
        
        // Keep the newest one, delete others
        services.sort((a, b) => b.createdAt - a.createdAt);
        const keepService = services[0];
        const deleteServices = services.slice(1);
        
        console.log(`   ✓ Keeping: ${keepService._id} (${keepService.price} so'm) - Created: ${keepService.createdAt}`);
        
        for (const service of deleteServices) {
          console.log(`   ✗ Deleting: ${service._id} (${service.price} so'm) - Created: ${service.createdAt}`);
          await Service.findByIdAndDelete(service._id);
        }
      }
      
      console.log('\n✅ Duplicates cleaned!');
    }

    // List all remaining services
    const remainingServices = await Service.find({}).sort({ category: 1, name: 1 });
    console.log(`\n📋 Remaining services (${remainingServices.length}):`);
    
    const byCategory = {};
    remainingServices.forEach(service => {
      const cat = service.category || 'Boshqa';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(service);
    });
    
    for (const [category, services] of Object.entries(byCategory)) {
      console.log(`\n  ${category}:`);
      services.forEach(service => {
        console.log(`    - ${service.name} (${service.price} so'm) [${service._id}] ${service.is_active ? '✓' : '✗'}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanDuplicateServices();
