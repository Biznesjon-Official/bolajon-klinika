import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../src/models/Task.js';
import TreatmentSchedule from '../src/models/TreatmentSchedule.js';
import Patient from '../src/models/Patient.js';

dotenv.config();

async function checkNurseData() {
  try {
    console.log('=== CONNECTING TO DATABASE ===');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n=== CHECKING TASKS ===');
    const totalTasks = await Task.countDocuments();
    console.log('Total Tasks:', totalTasks);
    
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    console.log('Pending Tasks:', pendingTasks);
    
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    console.log('Completed Tasks:', completedTasks);
    
    if (totalTasks > 0) {
      console.log('\n--- Sample Tasks ---');
      const sampleTasks = await Task.find()
        .populate('patient_id', 'first_name last_name')
        .limit(3)
        .lean();
      
      sampleTasks.forEach((task, i) => {
        console.log(`\nTask ${i + 1}:`);
        console.log('  ID:', task._id);
        console.log('  Title:', task.title);
        console.log('  Status:', task.status);
        console.log('  Patient:', task.patient_id ? `${task.patient_id.first_name} ${task.patient_id.last_name}` : 'N/A');
        console.log('  Medication:', task.medication_name || 'N/A');
        console.log('  Dosage:', task.dosage || 'N/A');
        console.log('  Scheduled Time:', task.scheduled_time);
      });
    }
    
    console.log('\n=== CHECKING TREATMENT SCHEDULES ===');
    const totalSchedules = await TreatmentSchedule.countDocuments();
    console.log('Total TreatmentSchedules:', totalSchedules);
    
    const pendingSchedules = await TreatmentSchedule.countDocuments({ status: 'pending' });
    console.log('Pending TreatmentSchedules:', pendingSchedules);
    
    const completedSchedules = await TreatmentSchedule.countDocuments({ status: 'completed' });
    console.log('Completed TreatmentSchedules:', completedSchedules);
    
    if (totalSchedules > 0) {
      console.log('\n--- Sample TreatmentSchedules ---');
      const sampleSchedules = await TreatmentSchedule.find()
        .populate('patient_id', 'first_name last_name')
        .populate('prescription_id', 'prescription_number medications')
        .limit(3)
        .lean();
      
      sampleSchedules.forEach((schedule, i) => {
        console.log(`\nSchedule ${i + 1}:`);
        console.log('  ID:', schedule._id);
        console.log('  Status:', schedule.status);
        console.log('  Patient:', schedule.patient_id ? `${schedule.patient_id.first_name} ${schedule.patient_id.last_name}` : 'N/A');
        console.log('  Medication:', schedule.medication_name || 'N/A');
        console.log('  Dosage:', schedule.dosage || 'N/A');
        console.log('  Scheduled Time:', schedule.scheduled_time);
        console.log('  Total Doses:', schedule.total_doses);
        console.log('  Completed Doses:', schedule.completed_doses);
        if (schedule.prescription_id?.medications?.length > 0) {
          console.log('  Prescription Medication:', schedule.prescription_id.medications[0].medication_name);
        }
      });
    }
    
    console.log('\n=== CHECKING PATIENTS ===');
    const totalPatients = await Patient.countDocuments();
    console.log('Total Patients:', totalPatients);
    
    console.log('\n=== SUMMARY ===');
    console.log('Total Tasks:', totalTasks);
    console.log('Total TreatmentSchedules:', totalSchedules);
    console.log('Total Treatments:', totalTasks + totalSchedules);
    console.log('Pending Treatments:', pendingTasks + pendingSchedules);
    console.log('Completed Treatments:', completedTasks + completedSchedules);
    
    if (totalTasks === 0 && totalSchedules === 0) {
      console.log('\n⚠️  WARNING: No treatments found in database!');
      console.log('This is why the Nurse panel shows no data.');
      console.log('\nTo fix this, you need to:');
      console.log('1. Create prescriptions for patients');
      console.log('2. Prescriptions will automatically create Tasks or TreatmentSchedules');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkNurseData();
