import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function checkPatientQueue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // "fg gfh" bemorni topish
    const patient = await Patient.findOne({
      first_name: 'fg',
      last_name: 'gfh'
    });
    
    if (!patient) {
      console.log('❌ Bemor topilmadi');
      process.exit(1);
    }
    
    console.log('📋 Bemor ma\'lumotlari:');
    console.log(`   Ism: ${patient.first_name} ${patient.last_name}`);
    console.log(`   ID: ${patient._id}`);
    console.log(`   Patient Number: ${patient.patient_number}`);
    console.log(`   Access Code: ${patient.access_code}`);
    console.log('');
    
    // Bu bemorning navbatlarini topish
    const queues = await Queue.find({ patient_id: patient._id })
      .populate('doctor_id', 'first_name last_name')
      .populate('service_id', 'name')
      .sort({ created_at: -1 })
      .lean();
    
    console.log(`📊 Navbatlar soni: ${queues.length}\n`);
    
    if (queues.length > 0) {
      queues.forEach((queue, index) => {
        console.log(`${index + 1}. Navbat #${queue.queue_number}`);
        console.log(`   Status: ${queue.status}`);
        console.log(`   Shifokor: ${queue.doctor_id?.first_name} ${queue.doctor_id?.last_name}`);
        console.log(`   Xizmat: ${queue.service_id?.name || 'N/A'}`);
        console.log(`   Sana: ${new Date(queue.created_at).toLocaleString('uz-UZ')}`);
        console.log(`   Patient ID: ${queue.patient_id}`);
        console.log('');
      });
    } else {
      console.log('❌ Navbatlar topilmadi');
      
      // Barcha navbatlarni ko'rish
      const allQueues = await Queue.find().limit(5).lean();
      console.log(`\n📋 Database'dagi oxirgi 5 ta navbat:`);
      allQueues.forEach((q, i) => {
        console.log(`${i + 1}. Patient ID: ${q.patient_id}, Queue: ${q.queue_number}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkPatientQueue();
