import mongoose from 'mongoose';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import Bed from '../models/Bed.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

async function createBedsForExistingRooms() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all rooms
    const rooms = await AmbulatorRoom.find();
    console.log(`📊 Found ${rooms.length} rooms`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const room of rooms) {
      console.log(`\n🏠 Processing room: ${room.room_number} (${room.capacity} beds)`);
      
      // Check if beds already exist for this room
      const existingBeds = await Bed.find({ room_id: room._id });
      
      if (existingBeds.length > 0) {
        console.log(`  ⏭️  Skipped - ${existingBeds.length} beds already exist`);
        skippedCount++;
        continue;
      }
      
      // Create beds for this room
      const beds = [];
      for (let i = 1; i <= room.capacity; i++) {
        beds.push({
          room_id: room._id,
          bed_number: i,
          status: 'available'
        });
      }
      
      await Bed.insertMany(beds);
      console.log(`  ✅ Created ${beds.length} beds`);
      createdCount += beds.length;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Created beds for ${createdCount} rooms`);
    console.log(`  ⏭️  Skipped ${skippedCount} rooms (already had beds)`);
    console.log(`\n✅ Migration completed successfully!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

createBedsForExistingRooms();
