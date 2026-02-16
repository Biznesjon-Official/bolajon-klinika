import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../src/models/Task.js';
import TreatmentSchedule from '../src/models/TreatmentSchedule.js';
import Patient from '../src/models/Patient.js';

dotenv.config();

async function checkPatientIds() {
  try {
    console.log('=== CONNECTING TO DATABASE ===');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n=== CHECKING TASKS ===');
    const totalTasks = await Task.countDocuments();
    console.log('Total Tasks:', totalTasks);
    
    const tasksWithoutPatient = await Task.countDocuments({ patient_id: null });
    console.log('Tasks without patient_id:', tasksWithoutPatient);
    
    const tasksWithPatient = await Task.countDocuments({ patient_id: { $ne: null } });
    console.log('Tasks with patient_id:', tasksWithPatient);
    
    if (totalTasks > 0) {
      console.log('\n--- Sample Tasks ---');
      const sampleTasks = await Task.find().limit(5).lean();
      
      for (let i = 0; i < sampleTasks.length; i++) {
        const task = sampleTasks[i];
        console.log(`\nTask ${i + 1}:`);
        console.log('  ID:', task._id);
        console.log('  Title:', task.title);
        console.log('  patient_id:', task.patient_id);
        console.log('  patient_id type:', typeof task.patient_id);
        console.log('  patient_id is null?', task.patient_id === null);
        console.log('  medication_name:', task.medication_name);
        console.log('  dosage:', task.dosage);
        
        if (task.patient_id) {
          const patient = await Patient.findById(task.patient_id).lean();
          if (patient) {
            console.log('  ✅ Patient found:', patient.first_name, patient.last_name);
          } else {
            console.log('  ❌ Patient NOT found in database!');
          }
        } else {
          console.log('  ⚠️  No patient_id');
        }
      }
    }
    
    console.log('\n=== CHECKING TREATMENT SCHEDULES ===');
    const totalSchedules = await TreatmentSchedule.countDocuments();
    console.log('Total TreatmentSchedules:', totalSchedules);
    
    const schedulesWithoutPatient = await TreatmentSchedule.countDocuments({ patient_id: null });
    console.log('Schedules without patient_id:', schedulesWithoutPatient);
    
    const schedulesWithPatient = await TreatmentSchedule.countDocuments({ patient_id: { $ne: null } });
    console.log('Schedules with patient_id:', schedulesWithPatient);
    
    if (totalSchedules > 0) {
      console.log('\n--- Sample TreatmentSchedules ---');
      const sampleSchedules = await TreatmentSchedule.find().limit(5).lean();
      
      for (let i = 0; i < sampleSchedules.length; i++) {
        const schedule = sampleSchedules[i];
        console.log(`\nSchedule ${i + 1}:`);
        console.log('  ID:', schedule._id);
        console.log('  patient_id:', schedule.patient_id);
        console.log('  patient_id type:', typeof schedule.patient_id);
        console.log('  patient_id is null?', schedule.patient_id === null);
        console.log('  medication_name:', schedule.medication_name);
        console.log('  dosage:', schedule.dosage);
        
        if (schedule.patient_id) {
          const patient = await Patient.findById(schedule.patient_id).lean();
          if (patient) {
            console.log('  ✅ Patient found:', patient.first_name, patient.last_name);
          } else {
            console.log('  ❌ Patient NOT found in database!');
          }
        } else {
          console.log('  ⚠️  No patient_id');
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Tasks without patient_id:', tasksWithoutPatient, '/', totalTasks);
    console.log('Schedules without patient_id:', schedulesWithoutPatient, '/', totalSchedules);
    
    if (tasksWithoutPatient > 0 || schedulesWithoutPatient > 0) {
      console.log('\n⚠️  WARNING: Some treatments have no patient_id!');
      console.log('This is why patient_name shows as "N/A" in the frontend.');
      console.log('\nTo fix this:');
      console.log('1. Delete treatments without patient_id');
      console.log('2. Or update them with correct patient_id');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkPatientIds();
