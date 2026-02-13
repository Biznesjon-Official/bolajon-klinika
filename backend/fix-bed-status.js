import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixBedStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    const Bed = mongoose.model('Bed', new mongoose.Schema({
      room_id: mongoose.Schema.Types.ObjectId,
      bed_number: Number,
      status: String,
      current_patient_id: mongoose.Schema.Types.ObjectId,
      current_admission_id: mongoose.Schema.Types.ObjectId,
      occupied_at: Date,
      daily_price: Number
    }));

    // Barcha band koykalarni topish
    const occupiedBeds = await Bed.find({ status: 'occupied' });
    console.log(`\nFound ${occupiedBeds.length} occupied beds`);

    // Har bir koyka uchun admission borligini tekshirish
    for (const bed of occupiedBeds) {
      if (!bed.current_admission_id) {
        console.log(`\n⚠️ Bed ${bed.bed_number} in room ${bed.room_id} has no admission - freeing...`);
        
        bed.status = 'available';
        bed.current_patient_id = null;
        bed.current_admission_id = null;
        bed.occupied_at = null;
        
        await bed.save();
        console.log(`✅ Bed ${bed.bed_number} freed`);
      }
    }

    console.log('\n✅ All beds fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBedStatus();
