import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteInvalidTreatments() {
  try {
    console.log('=== CONNECTING TO DATABASE ===');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define schemas
    const TaskSchema = new mongoose.Schema({}, { strict: false });
    const TreatmentScheduleSchema = new mongoose.Schema({}, { strict: false });
    
    const Task = mongoose.model('Task', TaskSchema, 'tasks');
    const TreatmentSchedule = mongoose.model('TreatmentSchedule', TreatmentScheduleSchema, 'treatment_schedules');
    
    console.log('\n=== DELETING INVALID TASKS ===');
    const tasksResult = await Task.deleteMany({
      $or: [
        { patient_id: null },
        { patient_id: { $exists: false } }
      ]
    });
    console.log('✅ Deleted', tasksResult.deletedCount, 'tasks without patient_id');
    
    console.log('\n=== DELETING INVALID TREATMENT SCHEDULES ===');
    const schedulesResult = await TreatmentSchedule.deleteMany({
      $or: [
        { patient_id: null },
        { patient_id: { $exists: false } }
      ]
    });
    console.log('✅ Deleted', schedulesResult.deletedCount, 'schedules without patient_id');
    
    console.log('\n=== SUMMARY ===');
    console.log('Total deleted:', tasksResult.deletedCount + schedulesResult.deletedCount);
    console.log('\n✅ Database cleaned!');
    console.log('Now refresh the Nurse panel to see valid treatments only.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deleteInvalidTreatments();
