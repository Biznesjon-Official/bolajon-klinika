import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db';

async function addAccessCodes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Barcha xodimlarni olish
    const allStaff = await Staff.find({});
    console.log(`📊 Found ${allStaff.length} staff members`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const staff of allStaff) {
      // Agar access_code allaqachon bo'lsa, o'tkazib yuborish
      if (staff.access_code) {
        console.log(`⏭️  Skipping ${staff.first_name} ${staff.last_name} - already has code: ${staff.access_code}`);
        skippedCount++;
        continue;
      }
      
      // Yangi access_code generatsiya qilish
      let accessCode;
      let isUnique = false;
      
      while (!isUnique) {
        // Generate 8-digit random number
        const randomNum = Math.floor(10000000 + Math.random() * 90000000);
        accessCode = `LI${randomNum}`;
        
        // Check if this code already exists
        const existing = await Staff.findOne({ access_code: accessCode });
        if (!existing) {
          isUnique = true;
        }
      }
      
      // Update staff with new access code
      staff.access_code = accessCode;
      staff.telegram_notifications_enabled = true;
      await staff.save();
      
      console.log(`✅ Updated ${staff.first_name} ${staff.last_name} - Code: ${accessCode}`);
      updatedCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} staff members`);
    console.log(`⏭️  Skipped: ${skippedCount} staff members (already had codes)`);
    console.log(`📝 Total: ${allStaff.length} staff members`);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAccessCodes();
