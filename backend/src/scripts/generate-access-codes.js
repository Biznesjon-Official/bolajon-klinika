import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Patient from '../models/Patient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function generateAccessCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Access code bo'lmagan bemorlarni topish
    const patientsWithoutCode = await Patient.find({
      $or: [
        { access_code: { $exists: false } },
        { access_code: null },
        { access_code: '' }
      ]
    });
    
    console.log(`\n📋 ${patientsWithoutCode.length} ta bemorga access_code generatsiya qilinmoqda...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const patient of patientsWithoutCode) {
      try {
        // 8-xonali unique kod generatsiya qilish
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          code = Math.floor(10000000 + Math.random() * 90000000).toString();
          const existing = await Patient.findOne({ access_code: code });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (!isUnique) {
          console.log(`❌ ${patient.first_name} ${patient.last_name} - Unique kod topilmadi`);
          errorCount++;
          continue;
        }
        
        // Access code ni saqlash
        patient.access_code = code;
        await patient.save();
        
        console.log(`✅ ${patient.first_name} ${patient.last_name} - ${code}`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${patient.first_name} ${patient.last_name} - Xatolik: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Natija:`);
    console.log(`   Muvaffaqiyatli: ${successCount}`);
    console.log(`   Xatolik: ${errorCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

generateAccessCodes();
