import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import Staff from '../models/Staff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function checkQueuePatients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Oxirgi 10 ta navbatni olish
    const queues = await Queue.find()
      .populate('patient_id', 'first_name last_name patient_number access_code')
      .populate('doctor_id', 'first_name last_name')
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    
    console.log(`📊 Oxirgi ${queues.length} ta navbat:\n`);
    
    queues.forEach((queue, index) => {
      const patient = queue.patient_id;
      console.log(`${index + 1}. Navbat #${queue.queue_number}`);
      console.log(`   Bemor: ${patient?.first_name} ${patient?.last_name}`);
      console.log(`   Patient Number: ${patient?.patient_number}`);
      console.log(`   Access Code: ${patient?.access_code || 'YO\'Q'}`);
      console.log(`   Shifokor: ${queue.doctor_id?.first_name} ${queue.doctor_id?.last_name}`);
      console.log(`   Status: ${queue.status}`);
      console.log(`   Sana: ${new Date(queue.created_at).toLocaleString('uz-UZ')}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkQueuePatients();
