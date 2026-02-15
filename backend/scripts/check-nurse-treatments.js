import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../src/models/Task.js';
import TreatmentSchedule from '../src/models/TreatmentSchedule.js';

dotenv.config();

async function checkTreatments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bolajon_klinik');
    console.log('✅ Connected to MongoDB');

    // Check Tasks
    console.log('\n=== CHECKING TASKS ===');
    const tasks = await Task.find()
      .populate('patient_id', 'first_name last_name')
      .populate('prescription_id')
      .limit(5)
      .lean();
    
    console.log(`Found ${tasks.length} tasks`);
    tasks.forEach((task, i) => {
      console.log(`\nTask ${i + 1}:`);
      console.log('  ID:', task._id);
      console.log('  Title:', task.title);
      console.log('  Medication Name:', task.medication_name);
      console.log('  Dosage:', task.dosage);
      console.log('  Patient:', task.patient_id ? `${task.patient_id.first_name} ${task.patient_id.last_name}` : 'N/A');
      console.log('  Status:', task.status);
      console.log('  Prescription ID:', task.prescription_id?._id);
    });

    // Check TreatmentSchedules
    console.log('\n=== CHECKING TREATMENT SCHEDULES ===');
    const schedules = await TreatmentSchedule.find()
      .populate('patient_id', 'first_name last_name')
      .populate('prescription_id')
      .limit(5)
      .lean();
    
    console.log(`Found ${schedules.length} schedules`);
    schedules.forEach((schedule, i) => {
      console.log(`\nSchedule ${i + 1}:`);
      console.log('  ID:', schedule._id);
      console.log('  Medication Name:', schedule.medication_name);
      console.log('  Dosage:', schedule.dosage);
      console.log('  Patient:', schedule.patient_id ? `${schedule.patient_id.first_name} ${schedule.patient_id.last_name}` : 'N/A');
      console.log('  Status:', schedule.status);
      console.log('  Prescription ID:', schedule.prescription_id?._id);
      console.log('  Prescription Number:', schedule.prescription_id?.prescription_number);
      console.log('  Total Doses:', schedule.total_doses);
      console.log('  Completed Doses:', schedule.completed_doses);
    });

    // Check for missing data
    console.log('\n=== CHECKING FOR MISSING DATA ===');
    const tasksWithMissingData = await Task.countDocuments({
      $or: [
        { medication_name: { $exists: false } },
        { medication_name: null },
        { medication_name: '' },
        { dosage: { $exists: false } },
        { dosage: null },
        { dosage: '' }
      ]
    });
    console.log(`Tasks with missing medication/dosage: ${tasksWithMissingData}`);

    const schedulesWithMissingData = await TreatmentSchedule.countDocuments({
      $or: [
        { medication_name: { $exists: false } },
        { medication_name: null },
        { medication_name: '' },
        { dosage: { $exists: false } },
        { dosage: null },
        { dosage: '' }
      ]
    });
    console.log(`Schedules with missing medication/dosage: ${schedulesWithMissingData}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTreatments();
