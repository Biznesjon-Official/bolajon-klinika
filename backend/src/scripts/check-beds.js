import mongoose from 'mongoose';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import Bed from '../models/Bed.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function checkBeds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find room 107
    const room = await AmbulatorRoom.findOne({ room_number: '107' });
    if (!room) {
      console.log('❌ Room 107 not found');
      return;
    }
    
    console.log('🏠 Room 107:');
    console.log('  ID:', room._id);
    console.log('  Capacity:', room.capacity);
    console.log('  Status:', room.status);
    console.log('  Department:', room.department);
    
    // Find beds for this room
    const beds = await Bed.find({ room_id: room._id }).sort({ bed_number: 1 });
    console.log('\n🛏️  Beds for Room 107:');
    console.log('  Total beds found:', beds.length);
    
    beds.forEach(bed => {
      console.log(`\n  Bed ${bed.bed_number}:`);
      console.log('    ID:', bed._id);
      console.log('    Status:', bed.status);
      console.log('    Patient:', bed.current_patient_id || 'None');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkBeds();
