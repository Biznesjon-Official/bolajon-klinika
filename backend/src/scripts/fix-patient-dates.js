import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Patient from '../models/Patient.js';

const fixPatientDates = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all patients without created_at
    const patientsWithoutDate = await Patient.find({
      $or: [
        { created_at: { $exists: false } },
        { created_at: null }
      ]
    });

    console.log(`\nFound ${patientsWithoutDate.length} patients without created_at`);

    if (patientsWithoutDate.length > 0) {
      // Set created_at to random dates in the last 60 days
      const now = new Date();
      
      for (let i = 0; i < patientsWithoutDate.length; i++) {
        const patient = patientsWithoutDate[i];
        
        // Random date between 60 days ago and now
        const daysAgo = Math.floor(Math.random() * 60);
        const createdDate = new Date(now);
        createdDate.setDate(createdDate.getDate() - daysAgo);
        
        await Patient.findByIdAndUpdate(patient._id, {
          created_at: createdDate,
          updated_at: createdDate
        });
        
        console.log(`Updated ${patient.patient_number}: ${patient.first_name} ${patient.last_name} - Created: ${createdDate.toLocaleDateString()}`);
      }
      
      console.log('\n✅ All patients updated with created_at dates');
    }

    // Verify
    const totalPatients = await Patient.countDocuments();
    const patientsWithDate = await Patient.countDocuments({ created_at: { $exists: true } });
    
    console.log(`\nTotal patients: ${totalPatients}`);
    console.log(`Patients with created_at: ${patientsWithDate}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixPatientDates();
