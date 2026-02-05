import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import model
import AmbulatorRoom from '../models/AmbulatorRoom.js';

const seedRooms = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing inpatient rooms
    console.log('Clearing existing inpatient rooms...');
    await AmbulatorRoom.deleteMany({ department: 'inpatient' });

    // Create inpatient rooms
    console.log('Creating inpatient rooms...');
    const roomsData = [
      // Floor 1 - General wards
      { room_number: '101', room_name: 'Umumiy palata 101', capacity: 4, floor: 1, status: 'available', department: 'inpatient' },
      { room_number: '102', room_name: 'Umumiy palata 102', capacity: 4, floor: 1, status: 'available', department: 'inpatient' },
      { room_number: '103', room_name: 'Umumiy palata 103', capacity: 6, floor: 1, status: 'available', department: 'inpatient' },
      { room_number: '104', room_name: 'Umumiy palata 104', capacity: 4, floor: 1, status: 'available', department: 'inpatient' },
      
      // Floor 2 - Semi-private
      { room_number: '201', room_name: 'Yarim shaxsiy 201', capacity: 2, floor: 2, status: 'available', department: 'inpatient' },
      { room_number: '202', room_name: 'Yarim shaxsiy 202', capacity: 2, floor: 2, status: 'available', department: 'inpatient' },
      { room_number: '203', room_name: 'Yarim shaxsiy 203', capacity: 2, floor: 2, status: 'available', department: 'inpatient' },
      { room_number: '204', room_name: 'Yarim shaxsiy 204', capacity: 2, floor: 2, status: 'available', department: 'inpatient' },
      
      // Floor 3 - Private/VIP
      { room_number: '301', room_name: 'VIP Palata 301', capacity: 1, floor: 3, status: 'available', department: 'inpatient' },
      { room_number: '302', room_name: 'VIP Palata 302', capacity: 1, floor: 3, status: 'available', department: 'inpatient' },
      { room_number: '303', room_name: 'Shaxsiy palata 303', capacity: 1, floor: 3, status: 'available', department: 'inpatient' },
      { room_number: '304', room_name: 'Shaxsiy palata 304', capacity: 1, floor: 3, status: 'available', department: 'inpatient' }
    ];

    const rooms = await AmbulatorRoom.insertMany(roomsData);
    console.log(`✅ Created ${rooms.length} inpatient rooms`);
    
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    console.log(`Total bed capacity: ${totalCapacity} beds`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding rooms:', error);
    process.exit(1);
  }
};

seedRooms();
