import mongoose from 'mongoose';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import Bed from '../models/Bed.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function fixMissingBeds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all rooms
    const rooms = await AmbulatorRoom.find();
    console.log(`📊 Checking ${rooms.length} rooms...\n`);
    
    let fixedCount = 0;
    
    for (const room of rooms) {
      const existingBeds = await Bed.find({ room_id: room._id }).sort({ bed_number: 1 });
      const existingBedNumbers = existingBeds.map(b => b.bed_number);
      
      if (existingBeds.length < room.capacity) {
        console.log(`🔧 Room ${room.room_number}: Has ${existingBeds.length}/${room.capacity} beds`);
        
        // Create missing beds
        const missingBeds = [];
        for (let i = 1; i <= room.capacity; i++) {
          if (!existingBedNumbers.includes(i)) {
            console.log(`  ➕ Creating bed ${i}`);
            missingBeds.push({
              room_id: room._id,
              bed_number: i,
              status: 'available'
            });
          }
        }
        
        if (missingBeds.length > 0) {
          await Bed.insertMany(missingBeds);
          console.log(`  ✅ Created ${missingBeds.length} missing beds\n`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n📊 Summary: Fixed ${fixedCount} rooms`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixMissingBeds();
