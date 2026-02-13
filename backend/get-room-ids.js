import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function getRoomIds() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    console.log('URI:', uri.substring(0, 30) + '...');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected');

    const InpatientRoom = mongoose.model('InpatientRoom', new mongoose.Schema({
      room_number: String,
      floor: Number
    }), 'inpatient_rooms');

    const rooms = await InpatientRoom.find({ room_number: { $in: ['101', '102'] } });
    
    console.log('\n=== ROOMS TO DELETE ===');
    rooms.forEach(room => {
      console.log(`Room ${room.room_number}: ${room._id}`);
      console.log(`DELETE: http://localhost:5001/api/v1/ambulator-inpatient/rooms/${room._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getRoomIds();
