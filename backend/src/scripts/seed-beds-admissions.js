import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Bed from '../models/Bed.js';
import Admission from '../models/Admission.js';
import Patient from '../models/Patient.js';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import Staff from '../models/Staff.js';

const seedBedsAndAdmissions = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing beds and admissions...');
    await Bed.deleteMany({});
    await Admission.deleteMany({});

    // Get or create rooms
    let rooms = await AmbulatorRoom.find({ department: 'inpatient' }).limit(5);
    
    if (rooms.length === 0) {
      console.log('Creating sample rooms...');
      const roomsData = [
        { room_number: '101', room_name: 'Palata 101', capacity: 4, floor: 1, status: 'available', department: 'inpatient' },
        { room_number: '102', room_name: 'Palata 102', capacity: 4, floor: 1, status: 'available', department: 'inpatient' },
        { room_number: '201', room_name: 'Palata 201', capacity: 2, floor: 2, status: 'available', department: 'inpatient' },
        { room_number: '202', room_name: 'VIP Palata', capacity: 1, floor: 2, status: 'available', department: 'inpatient' },
        { room_number: '301', room_name: 'Palata 301', capacity: 6, floor: 3, status: 'available', department: 'inpatient' }
      ];
      rooms = await AmbulatorRoom.insertMany(roomsData);
      console.log(`Created ${rooms.length} rooms`);
    }

    // Create beds
    console.log('Creating beds...');
    const bedsData = [];
    
    for (const room of rooms) {
      for (let i = 1; i <= room.capacity; i++) {
        bedsData.push({
          room_id: room._id,
          bed_number: i,
          status: 'available'
        });
      }
    }

    const beds = await Bed.insertMany(bedsData);
    console.log(`Created ${beds.length} beds`);

    // Get some patients for admissions
    const patients = await Patient.find().limit(10);
    
    if (patients.length === 0) {
      console.log('No patients found. Please seed patients first.');
      process.exit(0);
    }

    // Get a doctor for admissions
    const doctor = await Staff.findOne({ role: 'doctor' });
    
    if (!doctor) {
      console.log('No doctor found. Please seed staff first.');
      process.exit(0);
    }

    // Create some active admissions (occupy some beds)
    console.log('Creating active admissions...');
    const admissionsData = [];
    const occupiedBeds = beds.slice(0, Math.min(5, patients.length));

    for (let i = 0; i < occupiedBeds.length; i++) {
      const bed = occupiedBeds[i];
      const patient = patients[i];
      
      // Random admission date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const admissionDate = new Date();
      admissionDate.setDate(admissionDate.getDate() - daysAgo);

      admissionsData.push({
        patient_id: patient._id,
        room_id: bed.room_id,
        bed_number: bed.bed_number,
        admission_date: admissionDate,
        status: 'active',
        diagnosis: [
          'Pnevmoniya',
          'Appenditsit',
          'Gastrit',
          'Bronxit',
          'Gripp'
        ][i % 5],
        notes: 'Test admission',
        admitted_by: doctor._id
      });

      // Update bed status
      await Bed.findByIdAndUpdate(bed._id, {
        status: 'occupied',
        current_patient_id: patient._id
      });
    }

    const admissions = await Admission.insertMany(admissionsData);
    console.log(`Created ${admissions.length} active admissions`);

    // Create some discharged admissions for statistics
    console.log('Creating discharged admissions...');
    const dischargedData = [];
    
    for (let i = 0; i < Math.min(10, patients.length); i++) {
      const patient = patients[i];
      const room = rooms[i % rooms.length];
      
      // Random admission date 60-90 days ago
      const admissionDate = new Date();
      admissionDate.setDate(admissionDate.getDate() - (60 + Math.floor(Math.random() * 30)));
      
      // Random discharge date 30-60 days ago
      const dischargeDate = new Date();
      dischargeDate.setDate(dischargeDate.getDate() - (30 + Math.floor(Math.random() * 30)));

      dischargedData.push({
        patient_id: patient._id,
        room_id: room._id,
        bed_number: Math.floor(Math.random() * room.capacity) + 1,
        admission_date: admissionDate,
        discharge_date: dischargeDate,
        status: 'discharged',
        diagnosis: [
          'Pnevmoniya',
          'Appenditsit',
          'Gastrit',
          'Bronxit',
          'Gripp',
          'Angina',
          'Otit',
          'Sinusit'
        ][i % 8],
        notes: 'Discharged - recovered',
        admitted_by: doctor._id
      });
    }

    await Admission.insertMany(dischargedData);
    console.log(`Created ${dischargedData.length} discharged admissions`);

    // Set some beds to cleaning status
    const cleaningBeds = beds.slice(occupiedBeds.length, occupiedBeds.length + 2);
    for (const bed of cleaningBeds) {
      await Bed.findByIdAndUpdate(bed._id, { status: 'cleaning' });
    }
    console.log(`Set ${cleaningBeds.length} beds to cleaning status`);

    console.log('\n✅ Beds and admissions seeded successfully!');
    console.log(`Total beds: ${beds.length}`);
    console.log(`Occupied beds: ${occupiedBeds.length}`);
    console.log(`Cleaning beds: ${cleaningBeds.length}`);
    console.log(`Available beds: ${beds.length - occupiedBeds.length - cleaningBeds.length}`);
    console.log(`Active admissions: ${admissions.length}`);
    console.log(`Discharged admissions: ${dischargedData.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding beds and admissions:', error);
    process.exit(1);
  }
};

seedBedsAndAdmissions();
