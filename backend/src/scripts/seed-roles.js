import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';

dotenv.config();

const roles = [
  {
    name: 'admin',
    display_name: 'Administrator',
    description: 'Tizim administratori - to\'liq huquqlar',
    permissions: ['all'],
    is_active: true
  },
  {
    name: 'doctor',
    display_name: 'Shifokor',
    description: 'Shifokor - bemorlarni ko\'rish va davolash',
    permissions: ['view_patients', 'edit_patients', 'view_queue', 'view_reports'],
    is_active: true
  },
  {
    name: 'nurse',
    display_name: 'Hamshira',
    description: 'Hamshira - bemorlarni parvarish qilish',
    permissions: ['view_patients', 'view_queue', 'manage_admissions'],
    is_active: true
  },
  {
    name: 'laborant',
    display_name: 'Laborant',
    description: 'Laborant - tahlillar bilan ishlash',
    permissions: ['view_patients', 'manage_lab_tests'],
    is_active: true
  },
  {
    name: 'pharmacist',
    display_name: 'Dorixonachi',
    description: 'Dorixonachi - dorilar bilan ishlash',
    permissions: ['view_pharmacy', 'manage_pharmacy', 'dispense_medicine'],
    is_active: true
  },
  {
    name: 'sanitar',
    display_name: 'Tozalovchi',
    description: 'Sanitar xodim - tozalash va tartibga solish',
    permissions: ['view_rooms', 'manage_cleaning'],
    is_active: true
  }
];

async function seedRoles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing roles...');
    await Role.deleteMany({});

    console.log('📝 Creating roles...');
    for (const roleData of roles) {
      const role = new Role(roleData);
      await role.save();
      console.log(`✅ Created role: ${role.display_name} (${role.name})`);
    }

    console.log('\n✅ All roles seeded successfully!');
    console.log(`Total roles: ${roles.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles();
