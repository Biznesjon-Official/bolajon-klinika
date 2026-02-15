/**
 * Fix TreatmentSchedule records with missing medication_name and dosage
 * 
 * This script:
 * 1. Finds all TreatmentSchedule records with missing medication_name or dosage
 * 2. Populates prescription_id to get medications array
 * 3. Updates medication_name and dosage from prescription data
 */

import mongoose from 'mongoose';

// MongoDB URI - hardcoded for this script
const MONGODB_URI = 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.mongodb.net/clinic_db';

async function fixTreatmentSchedules() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Finding TreatmentSchedules with missing data...');
    
    // Get collections directly
    const TreatmentSchedule = mongoose.connection.collection('treatment_schedules');
    const Prescription = mongoose.connection.collection('prescriptions');
    
    // Find all TreatmentSchedules with missing medication_name or dosage
    const schedules = await TreatmentSchedule.find({
      $or: [
        { medication_name: { $exists: false } },
        { medication_name: null },
        { medication_name: '' },
        { dosage: { $exists: false } },
        { dosage: null },
        { dosage: '' }
      ]
    }).toArray();

    console.log(`Found ${schedules.length} TreatmentSchedules with missing data`);

    if (schedules.length === 0) {
      console.log('✅ No TreatmentSchedules need fixing!');
      return;
    }

    let fixed = 0;
    let failed = 0;

    for (const schedule of schedules) {
      try {
        console.log(`\n📋 Processing TreatmentSchedule ${schedule._id}...`);
        console.log(`   Current medication_name: "${schedule.medication_name}"`);
        console.log(`   Current dosage: "${schedule.dosage}"`);

        if (!schedule.prescription_id) {
          console.log('   ⚠️  No prescription_id - skipping');
          failed++;
          continue;
        }

        // Get prescription
        const prescription = await Prescription.findOne({ _id: schedule.prescription_id });
        
        if (!prescription) {
          console.log('   ⚠️  Prescription not found - skipping');
          failed++;
          continue;
        }

        console.log(`   Prescription ID: ${prescription._id}`);
        console.log(`   Medications count: ${prescription.medications?.length || 0}`);

        if (!prescription.medications || prescription.medications.length === 0) {
          console.log('   ⚠️  No medications in prescription - skipping');
          failed++;
          continue;
        }

        // Use first medication (most common case)
        const medication = prescription.medications[0];
        console.log(`   Medication data:`, {
          medication_name: medication.medication_name,
          dosage: medication.dosage
        });

        // Update schedule
        await TreatmentSchedule.updateOne(
          { _id: schedule._id },
          { 
            $set: { 
              medication_name: medication.medication_name,
              dosage: medication.dosage
            } 
          }
        );

        console.log(`   ✅ Fixed! New values:`, {
          medication_name: medication.medication_name,
          dosage: medication.dosage
        });
        fixed++;
      } catch (error) {
        console.error(`   ❌ Error fixing schedule ${schedule._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total found: ${schedules.length}`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Script error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixTreatmentSchedules();
