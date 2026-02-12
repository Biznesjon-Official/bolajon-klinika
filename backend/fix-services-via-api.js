import axios from 'axios';

const API_URL = 'http://localhost:5001/api/v1';

// You need to get a valid token first by logging in
const TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

const fixServices = async () => {
  try {
    console.log('🔍 Fetching current services...');
    
    // Get all services
    const servicesRes = await axios.get(`${API_URL}/billing/services`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    const services = servicesRes.data.data;
    console.log(`📊 Found ${services.length} services`);
    
    // Delete all old services
    for (const service of services) {
      console.log(`🗑️  Deleting: ${service.name} (${service._id})`);
      await axios.delete(`${API_URL}/billing/services/${service._id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
    }
    
    console.log('\n✅ All old services deleted!');
    
    // Create new services
    const newServices = [
      { name: "Shifokor ko'rigi", category: "Shifokor ko'rigi", price: 0, description: "Umumiy shifokor ko'rigi xizmati", is_active: true },
      { name: "Terapevt ko'rigi", category: "Shifokor ko'rigi", price: 50000, description: "Terapevt shifokor ko'rigi", is_active: true },
      { name: "Pediatr ko'rigi", category: "Shifokor ko'rigi", price: 60000, description: "Bolalar shifokori ko'rigi", is_active: true },
      { name: "Kunduzgi muolaja (1 kun)", category: "Kunduzgi muolaja", price: 150000, description: "Kunduzgi statsionar muolajasi", is_active: true },
      { name: "Tomchi qo'yish", category: "Kunduzgi muolaja", price: 30000, description: "Intravenoz tomchi qo'yish", is_active: true },
      { name: "Umumiy qon tahlili", category: "Laboratoriya xizmatlari", price: 25000, description: "Umumiy qon tahlili (CBC)", is_active: true },
      { name: "Siydik tahlili", category: "Laboratoriya xizmatlari", price: 20000, description: "Umumiy siydik tahlili", is_active: true },
      { name: "Biokimyoviy qon tahlili", category: "Laboratoriya xizmatlari", price: 80000, description: "Biokimyoviy qon tahlili (to'liq)", is_active: true },
      { name: "Massaj (1 seans)", category: "Fizioterapiya xizmatlari", price: 40000, description: "Tibbiy massaj xizmati", is_active: true },
      { name: "Fizioterapiya (1 seans)", category: "Fizioterapiya xizmatlari", price: 35000, description: "Fizioterapiya muolajasi", is_active: true }
    ];
    
    console.log('\n📝 Creating new services...');
    for (const service of newServices) {
      const res = await axios.post(`${API_URL}/billing/services`, service, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log(`✅ Created: ${service.name} - ${service.price} so'm`);
    }
    
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

console.log('⚠️  Please update TOKEN variable with your auth token first!');
console.log('You can get it from browser DevTools > Application > Local Storage > token');
// fixServices();
