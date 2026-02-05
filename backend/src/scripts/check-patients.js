import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Patient from '../models/Patient.js';

const checkPatients = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const totalPatients = await Patient.countDocuments();
    console.log(`\nTotal patients in database: ${totalPatients}`);

    if (totalPatients > 0) {
      const recentPatients = await Patient.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('patient_number first_name last_name createdAt created_at')
        .lean();

      console.log('\nRecent patients:');
      recentPatients.forEach(p => {
        console.log(`- ${p.patient_number}: ${p.first_name} ${p.last_name}`);
        console.log(`  createdAt: ${p.createdAt}`);
        console.log(`  created_at: ${p.created_at}`);
      });

      // Check patients by date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPatients = await Patient.countDocuments({ 
        $or: [
          { createdAt: { $gte: today } },
          { created_at: { $gte: today } }
        ]
      });
      console.log(`\nPatients created today: ${todayPatients}`);

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const last30DaysPatients = await Patient.countDocuments({ 
        $or: [
          { createdAt: { $gte: last30Days } },
          { created_at: { $gte: last30Days } }
        ]
      });
      console.log(`Patients created in last 30 days: ${last30DaysPatients}`);
    } else {
      console.log('\n⚠️ No patients found in database!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkPatients();
