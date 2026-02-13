import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function deleteRooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Room schema
    const InpatientRoom = mongoose.model('InpatientRoom', new mongoose.Schema({
      room_number: String,
      floor: Number,
      room_type: String,
      status: String
    }), 'inpatient_rooms');

    // Bed schema
    const Bed = mongoose.model('Bed', new mongoose.Schema({
      room_id: mongoose.Schema.Types.ObjectId,
      bed_number: Number,
      status: String,
      current_patient_id: mongoose.Schema.Types.ObjectId,
      current_admission_id: mongoose.Schema.Types.ObjectId
    }));

    // Admission schema
    const Admission = mongoose.model('Admission', new mongoose.Schema({
      room_id: mongoose.Schema.Types.ObjectId,
      bed_number: Number,
      patient_id: mongoose.Schema.Types.ObjectId,
      status: String
    }));

    // 101 va 102 xonalarni topish
    const rooms = await InpatientRoom.find({ room_number: { $in: ['101', '102'] } });
    console.log(`\nFound ${rooms.length} rooms to delete`);

    for (const room of rooms) {
      console.log(`\nDeleting room ${room.room_number}...`);
      
      // 1. Xonaga tegishli koykalarni o'chirish
      const beds = await Bed.find({ room_id: room._id });
      console.log(`  - Found ${beds.length} beds`);
      
      // 2. Koykalar bilan bog'liq admissionlarni o'chirish
      for (const bed of beds) {
        const admissions = await Admission.find({ 
          room_id: room._id, 
          bed_number: bed.bed_number 
        });
        
        if (admissions.length > 0) {
          await Admission.deleteMany({ 
            room_id: room._id, 
            bed_number: bed.bed_number 
          });
          console.log(`  - Deleted ${admissions.length} admissions for bed ${bed.bed_number}`);
        }
      }
      
      // 3. Koykalarni o'chirish
      await Bed.deleteMany({ room_id: room._id });
      console.log(`  - Deleted ${beds.length} beds`);
      
      // 4. Xonani o'chirish
      await InpatientRoom.deleteOne({ _id: room._id });
      console.log(`  ✅ Room ${room.room_number} deleted`);
    }

    console.log('\n✅ All rooms deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteRooms();
