import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/Service.js';

dotenv.config();

const defaultServices = [
  // Shifokor ko'rigi
  {
    name: "Shifokor ko'rigi",
    category: "Shifokor ko'rigi",
    price: 0,
    description: "Umumiy shifokor ko'rigi xizmati",
    is_active: true
  },
  {
    name: "Terapevt ko'rigi",
    category: "Shifokor ko'rigi",
    price: 50000,
    description: "Terapevt shifokor ko'rigi",
    is_active: true
  },
  {
    name: "Pediatr ko'rigi",
    category: "Shifokor ko'rigi",
    price: 60000,
    description: "Bolalar shifokori ko'rigi",
    is_active: true
  },
  
  // Kunduzgi muolaja
  {
    name: "Kunduzgi muolaja (1 kun)",
    category: "Kunduzgi muolaja",
    price: 150000,
    description: "Kunduzgi statsionar muolajasi",
    is_active: true
  },
  {
    name: "Tomchi qo'yish",
    category: "Kunduzgi muolaja",
    price: 30000,
    description: "Intravenoz tomchi qo'yish",
    is_active: true
  },
  
  // Laboratoriya xizmatlari
  {
    name: "Umumiy qon tahlili",
    category: "Laboratoriya xizmatlari",
    price: 25000,
    description: "Umumiy qon tahlili (CBC)",
    is_active: true
  },
  {
    name: "Siydik tahlili",
    category: "Laboratoriya xizmatlari",
    price: 20000,
    description: "Umumiy siydik tahlili",
    is_active: true
  },
  {
    name: "Biokimyoviy qon tahlili",
    category: "Laboratoriya xizmatlari",
    price: 80000,
    description: "Biokimyoviy qon tahlili (to'liq)",
    is_active: true
  },
  
  // Fizioterapiya xizmatlari
  {
    name: "Massaj (1 seans)",
    category: "Fizioterapiya xizmatlari",
    price: 40000,
    description: "Tibbiy massaj xizmati",
    is_active: true
  },
  {
    name: "Fizioterapiya (1 seans)",
    category: "Fizioterapiya xizmatlari",
    price: 35000,
    description: "Fizioterapiya muolajasi",
    is_active: true
  }
];

const createDefaultServices = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📝 Creating default services...');
    
    for (const serviceData of defaultServices) {
      // Check if service already exists
      const existing = await Service.findOne({ 
        name: serviceData.name,
        category: serviceData.category 
      });
      
      if (existing) {
        console.log(`⏭️  Skipping "${serviceData.name}" - already exists`);
      } else {
        const service = new Service(serviceData);
        await service.save();
        console.log(`✅ Created "${serviceData.name}" - ${serviceData.price} so'm`);
      }
    }

    // List all services
    const allServices = await Service.find({}).sort({ category: 1, name: 1 });
    console.log(`\n📋 Total services: ${allServices.length}`);
    
    const byCategory = {};
    allServices.forEach(service => {
      const cat = service.category || 'Boshqa';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(service);
    });
    
    for (const [category, services] of Object.entries(byCategory)) {
      console.log(`\n  ${category}:`);
      services.forEach(service => {
        console.log(`    - ${service.name} (${service.price} so'm) [${service._id}]`);
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

createDefaultServices();
