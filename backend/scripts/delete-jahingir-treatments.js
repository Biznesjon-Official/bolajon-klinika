import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function deleteTreatments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB\'ga ulandi');
    
    // Find patient by name
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
    const patient = await Patient.findOne({ 
      $or: [
        { first_name: /jahingir/i, last_name: /raxmatullayev/i },
        { first_name: /jahongir/i, last_name: /raxmatulloyev/i },
        { full_name: /jahingir.*raxmatullayev/i },
        { full_name: /jahongir.*raxmatulloyev/i }
      ]
    });
    
    if (!patient) {
      console.log('❌ Bemor topilmadi');
      console.log('Barcha bemorlarni ko\'rsatish...');
      const allPatients = await Patient.find({}).select('first_name last_name full_name').limit(10);
      allPatients.forEach(p => {
        console.log(`  - ${p.first_name} ${p.last_name} (${p.full_name})`);
      });
      process.exit(0);
    }
    
    console.log('✅ Bemor topildi:', patient.first_name, patient.last_name, '- ID:', patient._id);
    
    // Delete Tasks
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
    const deletedTasks = await Task.deleteMany({ patient_id: patient._id });
    console.log('🗑️ O\'chirilgan Task\'lar:', deletedTasks.deletedCount);
    
    // Delete TreatmentSchedules
    const TreatmentSchedule = mongoose.model('TreatmentSchedule', new mongoose.Schema({}, { strict: false }));
    const deletedSchedules = await TreatmentSchedule.deleteMany({ patient_id: patient._id });
    console.log('🗑️ O\'chirilgan TreatmentSchedule\'lar:', deletedSchedules.deletedCount);
    
    console.log('✅ Barcha muolajalar o\'chirildi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Xatolik:', err);
    process.exit(1);
  }
}

deleteTreatments();
