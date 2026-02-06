import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import Task from '../models/Task.js';
import TreatmentSchedule from '../models/TreatmentSchedule.js';
import Patient from '../models/Patient.js';
import Staff from '../models/Staff.js';
import Admission from '../models/Admission.js';
import Medicine from '../models/Medicine.js';
import PharmacyTransaction from '../models/PharmacyTransaction.js';
import Invoice from '../models/Invoice.js';
import BillingItem from '../models/BillingItem.js';
import Service from '../models/Service.js';

const router = express.Router();

/**
 * Get available medicines
 * GET /api/v1/nurse/medicines
 */
router.get('/medicines', authenticate, async (req, res) => {
  try {
    const { floor, admission_type } = req.query;
    
    console.log('=== GET NURSE MEDICINES ===');
    console.log('Floor filter:', floor);
    console.log('Admission type:', admission_type);
    
    const query = {
      quantity: { $gt: 0 }
    };
    
    // Determine floor based on admission type
    let targetFloor;
    if (floor) {
      targetFloor = parseInt(floor);
    } else if (admission_type === 'inpatient') {
      targetFloor = 3; // Stasionar - 3-qavat
    } else {
      targetFloor = 2; // Ambulatorxona - 2-qavat (default)
    }
    
    query.floor = targetFloor;
    
    console.log('Target floor:', targetFloor);
    console.log('Query:', JSON.stringify(query));
    
    const medicines = await Medicine.find(query)
      .select('name generic_name unit quantity unit_price floor category')
      .sort({ name: 1 })
      .lean();
    
    console.log('✅ Found medicines:', medicines.length);
    if (medicines.length > 0) {
      console.log('Sample medicine:', medicines[0]);
    }
    
    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Dorilarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get nurse statistics
 * GET /api/v1/nurse/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id;
    
    const [pendingTasks, overdueTasks, activePatients] = await Promise.all([
      Task.countDocuments({
        nurse_id: nurseId,
        status: 'pending'
      }),
      Task.countDocuments({
        nurse_id: nurseId,
        status: 'pending',
        scheduled_time: { $lt: new Date() }
      }),
      Task.distinct('patient_id', {
        nurse_id: nurseId,
        status: { $in: ['pending', 'in_progress'] }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        pending_treatments: pendingTasks,
        overdue_treatments: overdueTasks,
        total_patients: activePatients.length,
        active_calls: 0
      }
    });
  } catch (error) {
    console.error('Get nurse stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get nurse treatments/tasks
 * GET /api/v1/nurse/treatments
 */
router.get('/treatments', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id;
    const { status, floor } = req.query;
    
    console.log('=== GET NURSE TREATMENTS ===');
    console.log('Nurse ID:', nurseId);
    console.log('Status filter:', status);
    
    // YANGI: Barcha muolajalarni olish (nurse_id filter yo'q)
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Get both Tasks (urgent/emergency) and TreatmentSchedules (regular)
    const [tasks, treatmentSchedules] = await Promise.all([
      Task.find(query)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('assigned_by', 'first_name last_name')
        .populate('nurse_id', 'first_name last_name')
        .populate('admission_id')
        .populate('prescription_id')
        .sort({ scheduled_time: 1 })
        .lean(),
      TreatmentSchedule.find(query)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name')
        .populate('admission_id')
        .populate('prescription_id')
        .sort({ scheduled_time: 1 })
        .lean()
    ]);
    
    console.log('📋 Found Tasks:', tasks.length);
    console.log('📋 Found TreatmentSchedules:', treatmentSchedules.length);
    
    if (tasks.length > 0) {
      console.log('Sample Task:', JSON.stringify(tasks[0], null, 2));
      console.log('All Task IDs:', tasks.map(t => t._id.toString()));
    }
    if (treatmentSchedules.length > 0) {
      console.log('Sample TreatmentSchedule:', JSON.stringify(treatmentSchedules[0], null, 2));
      console.log('All TreatmentSchedule IDs:', treatmentSchedules.map(t => t._id.toString()));
      console.log('All TreatmentSchedule medicines:', treatmentSchedules.map(t => `${t.medication_name} (${t.dosage})`));
      console.log('TreatmentSchedule admission_ids:', treatmentSchedules.map(t => t.admission_id?._id || t.admission_id));
    }
    
    // Transform Tasks
    const transformedTasks = await Promise.all(tasks.map(async (task) => {
      let prescriptionType = task.task_type === 'emergency' ? 'URGENT' : 'REGULAR';
      let admissionInfo = {
        is_admitted: false,
        admission_type: null,
        room_info: null
      };
      
      // Get prescription type if task has prescription_id
      if (task.prescription_id) {
        prescriptionType = task.prescription_id.prescription_type || 'URGENT';
      }
      
      // Check if patient is admitted
      if (task.admission_id) {
        const admission = task.admission_id;
        admissionInfo.is_admitted = true;
        admissionInfo.admission_type = admission.admission_type || 'inpatient';
        
        // Get room info if inpatient
        if (admission.admission_type === 'inpatient') {
          try {
            console.log('  Loading bed info for inpatient admission:', admission._id);
            console.log('  Bed ID:', admission.bed_id);
            console.log('  Room ID:', admission.room_id);
            
            if (admission.bed_id) {
              // Use bed_id to get full info
              const Bed = mongoose.model('Bed');
              const bed = await Bed.findById(admission.bed_id).populate('room_id').lean();
              
              console.log('  Bed found:', bed ? 'YES' : 'NO');
              if (bed) {
                console.log('  Bed number:', bed.bed_number);
                console.log('  Room populated:', bed.room_id ? 'YES' : 'NO');
              }
              
              if (bed && bed.room_id) {
                admissionInfo.room_info = {
                  room_number: bed.room_id.room_number,
                  room_name: bed.room_id.name || bed.room_id.room_name,
                  bed_number: bed.bed_number,
                  floor: bed.room_id.floor
                };
                console.log('  ✅ Room info created:', admissionInfo.room_info);
              }
            } else if (admission.room_id) {
              // Fallback: use room_id directly
              const AmbulatorRoom = mongoose.model('AmbulatorRoom');
              const room = await AmbulatorRoom.findById(admission.room_id).lean();
              
              console.log('  Room found (fallback):', room ? 'YES' : 'NO');
              
              if (room) {
                admissionInfo.room_info = {
                  room_number: room.room_number,
                  room_name: room.name || room.room_name,
                  bed_number: admission.bed_number || 'N/A',
                  floor: room.floor
                };
                console.log('  ✅ Room info created (fallback):', admissionInfo.room_info);
              }
            }
          } catch (error) {
            console.error('Error loading bed info for task:', error);
          }
        } else if (admission.admission_type === 'outpatient' && admission.room_id) {
          try {
            const AmbulatorRoom = mongoose.model('AmbulatorRoom');
            const room = await AmbulatorRoom.findById(admission.room_id).lean();
            
            admissionInfo.room_info = {
              room_name: room?.room_name || 'Ambulator xona',
              room_number: room?.room_number || 'N/A',
              bed_number: admission.bed_number || null
            };
          } catch (error) {
            console.error('Error loading room info for task:', error);
          }
        }
      }
      
      return {
        ...task,
        id: task._id.toString(),
        patient_name: task.patient_id ? `${task.patient_id.first_name} ${task.patient_id.last_name}` : 'N/A',
        medicine_name: task.medication_name || 'N/A',
        medicine_dosage: task.dosage || 'N/A',
        prescription_type: prescriptionType,
        admission_info: admissionInfo,
        source: 'task',
        completed_at: task.completed_at,
        completion_notes: task.completion_notes
      };
    }));
    
    // Transform TreatmentSchedules
    const transformedSchedules = await Promise.all(treatmentSchedules.map(async (schedule) => {
      let prescriptionType = 'REGULAR';
      let admissionInfo = {
        is_admitted: false,
        admission_type: null,
        room_info: null
      };
      
      // Get prescription type
      if (schedule.prescription_id) {
        prescriptionType = schedule.prescription_id.prescription_type || 'REGULAR';
      }
      
      // Check if patient is admitted
      if (schedule.admission_id) {
        const admission = schedule.admission_id;
        admissionInfo.is_admitted = true;
        admissionInfo.admission_type = admission.admission_type || 'inpatient';
        
        // Get room info if inpatient
        if (admission.admission_type === 'inpatient') {
          try {
            console.log('  [Schedule] Loading bed info for inpatient admission:', admission._id);
            console.log('  [Schedule] Bed ID:', admission.bed_id);
            console.log('  [Schedule] Room ID:', admission.room_id);
            
            if (admission.bed_id) {
              // Use bed_id to get full info
              const Bed = mongoose.model('Bed');
              const bed = await Bed.findById(admission.bed_id).populate('room_id').lean();
              
              console.log('  [Schedule] Bed found:', bed ? 'YES' : 'NO');
              if (bed) {
                console.log('  [Schedule] Bed number:', bed.bed_number);
                console.log('  [Schedule] Room populated:', bed.room_id ? 'YES' : 'NO');
              }
              
              if (bed && bed.room_id) {
                admissionInfo.room_info = {
                  room_number: bed.room_id.room_number,
                  room_name: bed.room_id.name || bed.room_id.room_name,
                  bed_number: bed.bed_number,
                  floor: bed.room_id.floor
                };
                console.log('  [Schedule] ✅ Room info created:', admissionInfo.room_info);
              }
            } else if (admission.room_id) {
              // Fallback: use room_id directly (for old admissions without bed_id)
              const AmbulatorRoom = mongoose.model('AmbulatorRoom');
              const room = await AmbulatorRoom.findById(admission.room_id).lean();
              
              console.log('  [Schedule] Room found (fallback):', room ? 'YES' : 'NO');
              
              if (room) {
                admissionInfo.room_info = {
                  room_number: room.room_number,
                  room_name: room.name || room.room_name,
                  bed_number: admission.bed_number || 'N/A',
                  floor: room.floor
                };
                console.log('  [Schedule] ✅ Room info created (fallback):', admissionInfo.room_info);
              }
            }
          } catch (error) {
            console.error('Error loading bed info for schedule:', error);
          }
        } else if (admission.admission_type === 'outpatient' && admission.room_id) {
          try {
            const AmbulatorRoom = mongoose.model('AmbulatorRoom');
            const room = await AmbulatorRoom.findById(admission.room_id).lean();
            
            admissionInfo.room_info = {
              room_name: room?.room_name || 'Ambulator xona',
              room_number: room?.room_number || 'N/A',
              bed_number: admission.bed_number || null
            };
          } catch (error) {
            console.error('Error loading room info for schedule:', error);
          }
        }
      }
      
      return {
        ...schedule,
        id: schedule._id.toString(),
        patient_name: schedule.patient_id ? `${schedule.patient_id.first_name} ${schedule.patient_id.last_name}` : 'N/A',
        medicine_name: schedule.medication_name || 'N/A',
        medicine_dosage: schedule.dosage || 'N/A',
        medication_name: schedule.medication_name,
        dosage: schedule.dosage,
        prescription_type: prescriptionType,
        admission_info: admissionInfo,
        source: 'schedule',
        completed_at: schedule.completed_at,
        completion_notes: schedule.completion_notes || schedule.notes,
        total_doses: schedule.total_doses || 0,
        completed_doses: schedule.completed_doses || 0,
        dose_history: schedule.dose_history || []
      };
    }));
    
    // Combine and sort by scheduled_time
    const allTreatments = [...transformedTasks, ...transformedSchedules]
      .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    
    console.log('✅ Total treatments:', allTreatments.length);
    console.log('   - Tasks:', transformedTasks.length);
    console.log('   - Schedules:', transformedSchedules.length);
    
    if (allTreatments.length > 0) {
      console.log('Sample combined treatment:', JSON.stringify(allTreatments[0], null, 2));
    }
    
    res.json({
      success: true,
      data: allTreatments
    });
  } catch (error) {
    console.error('=== GET TREATMENTS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Muolajalarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Complete treatment
 * POST /api/v1/nurse/treatments/:id/complete
 */
router.post('/treatments/:id/complete', authenticate, async (req, res) => {
  try {
    const { notes, used_medicines } = req.body; // used_medicines: [{ medicine_id, name, quantity, unit, unit_price }]
    const nurseId = req.user._id || req.user.id;
    
    console.log('=== COMPLETE TREATMENT ===');
    console.log('Treatment ID:', req.params.id);
    console.log('Notes:', notes);
    console.log('Used medicines:', used_medicines);
    
    // Try to find as Task first
    let task = await Task.findById(req.params.id)
      .populate('patient_id', 'first_name last_name patient_number')
      .populate('nurse_id', 'first_name last_name');
    
    let treatmentSchedule = null;
    let isTask = true;
    
    // If not found as Task, try TreatmentSchedule
    if (!task) {
      console.log('Not found as Task, trying TreatmentSchedule...');
      treatmentSchedule = await TreatmentSchedule.findById(req.params.id)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name');
      
      if (!treatmentSchedule) {
        console.log('❌ Treatment not found in both Task and TreatmentSchedule');
        return res.status(404).json({
          success: false,
          message: 'Topshiriq topilmadi'
        });
      }
      
      isTask = false;
      console.log('✅ Found as TreatmentSchedule');
    } else {
      console.log('✅ Found as Task');
    }
    
    const treatment = isTask ? task : treatmentSchedule;
    
    // For TreatmentSchedule, increment completed_doses instead of marking as completed
    if (!isTask && treatmentSchedule) {
      console.log('=== PROCESSING TREATMENT SCHEDULE DOSE ===');
      console.log('Current completed_doses:', treatmentSchedule.completed_doses);
      console.log('Total doses:', treatmentSchedule.total_doses);
      
      // Increment completed doses
      treatmentSchedule.completed_doses += 1;
      
      // Add to dose history
      treatmentSchedule.dose_history.push({
        completed_at: new Date(),
        completed_by: nurseId,
        notes: notes,
        used_medicines: used_medicines || []
      });
      
      // Check if all doses completed
      if (treatmentSchedule.completed_doses >= treatmentSchedule.total_doses) {
        treatmentSchedule.status = 'completed';
        treatmentSchedule.completed_at = new Date();
        console.log('✅ All doses completed! Marking treatment as completed.');
      } else {
        console.log(`✅ Dose ${treatmentSchedule.completed_doses}/${treatmentSchedule.total_doses} completed`);
      }
      
      await treatmentSchedule.save();
    } else {
      // For Task, mark as completed immediately
      treatment.status = 'completed';
      treatment.completed_at = new Date();
      treatment.completion_notes = notes;
      await treatment.save();
    }
    
    console.log('✅ Treatment status updated');
    
    // Process used medicines
    if (used_medicines && used_medicines.length > 0) {
      console.log('=== PROCESSING USED MEDICINES ===');
      console.log('Total medicines:', used_medicines.length);
      
      let totalAmount = 0;
      const processedMedicines = [];
      
      for (const usedMed of used_medicines) {
        console.log(`Processing: ${usedMed.name} - Quantity: ${usedMed.quantity}`);
        
        // Find medicine
        const medicine = await Medicine.findById(usedMed.medicine_id);
        
        if (!medicine) {
          console.log(`⚠️  Medicine not found: ${usedMed.medicine_id}`);
          continue;
        }
        
        console.log(`✅ Medicine found: ${medicine.name}`);
        console.log(`   Current quantity: ${medicine.quantity} ${medicine.unit}`);
        console.log(`   Quantity to deduct: ${usedMed.quantity} ${usedMed.unit}`);
        
        // Check if enough stock
        if (medicine.quantity < usedMed.quantity) {
          console.log(`⚠️  Not enough stock for ${medicine.name}`);
          return res.status(400).json({
            success: false,
            message: `Dorixonada yetarli ${medicine.name} yo'q. Mavjud: ${medicine.quantity} ${medicine.unit}, Kerak: ${usedMed.quantity} ${usedMed.unit}`
          });
        }
        
        // Deduct from stock
        medicine.quantity -= usedMed.quantity;
        
        // Update status if out of stock
        if (medicine.quantity === 0) {
          medicine.status = 'out_of_stock';
        }
        
        await medicine.save();
        console.log(`✅ Medicine quantity updated: ${medicine.quantity} ${medicine.unit}`);
        
        // Calculate amount
        const amount = usedMed.quantity * (usedMed.unit_price || medicine.unit_price || 0);
        totalAmount += amount;
        
        // Create pharmacy transaction
        const transaction = await PharmacyTransaction.create({
          medicine_id: medicine._id,
          medicine_name: medicine.name,
          transaction_type: 'out',
          quantity: usedMed.quantity,
          unit_price: usedMed.unit_price || medicine.unit_price || 0,
          total_amount: amount,
          patient_id: treatment.patient_id?._id || treatment.patient_id,
          staff_id: nurseId,
          task_id: treatment._id,
          notes: `Hamshira tomonidan berildi: ${notes || 'Muolaja yakunlandi'}`,
          floor: medicine.floor || 2
        });
        
        console.log(`✅ Transaction created: ${transaction._id}`);
        
        processedMedicines.push({
          medicine_id: medicine._id,
          name: medicine.name,
          quantity: usedMed.quantity,
          unit: medicine.unit,
          unit_price: usedMed.unit_price || medicine.unit_price || 0,
          total_amount: amount
        });
      }
      
      // Create invoice if medicines were used
      if (processedMedicines.length > 0 && totalAmount > 0) {
        console.log('💰 Creating invoice for medicines...');
        console.log('Total amount:', totalAmount, 'so\'m');
        
        // Generate invoice number
        const invoiceCount = await Invoice.countDocuments();
        const invoiceNumber = `INV${new Date().getFullYear()}${String(invoiceCount + 1).padStart(6, '0')}`;
        
        // Create invoice
        const invoice = await Invoice.create({
          patient_id: treatment.patient_id?._id || treatment.patient_id,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          paid_amount: 0,
          discount_amount: 0,
          payment_status: 'pending',
          notes: `Hamshira muolajasi - ${processedMedicines.length} ta dori`,
          created_by: nurseId
        });
        
        console.log('✅ Invoice created:', invoice._id, invoice.invoice_number);
        
        // Create billing items for each medicine
        for (const med of processedMedicines) {
          // Find or create service
          let service = await Service.findOne({ 
            name: { $regex: new RegExp(`^${med.name}$`, 'i') },
            category: 'medication'
          });
          
          if (!service) {
            service = await Service.create({
              name: med.name,
              category: 'medication',
              price: med.unit_price,
              description: `Dori: ${med.name}`,
              status: 'active'
            });
          }
          
          await BillingItem.create({
            billing_id: invoice._id,
            service_id: service._id,
            service_name: med.name,
            quantity: med.quantity,
            unit_price: med.unit_price,
            total_price: med.total_amount
          });
        }
        
        console.log('✅ Billing items created');
        console.log('💰 Total invoice amount:', totalAmount, 'so\'m');
      }
    }
    
    // ===== AMBULATORXONADA AVTOMATIK CHIQARISH =====
    if (treatment.patient_id) {
      const patientId = treatment.patient_id._id || treatment.patient_id;
      
      // Bemorning faol admission'ini topish
      const activeAdmission = await Admission.findOne({
        patient_id: patientId,
        status: 'active'
      });
      
      if (activeAdmission && activeAdmission.admission_type === 'outpatient') {
        console.log('=== CHECKING FOR AUTO-DISCHARGE (AMBULATORXONA) ===');
        console.log('Patient ID:', patientId);
        console.log('Admission ID:', activeAdmission._id);
        
        // Bemorning barcha pending muolajalarini tekshirish
        const [pendingTasks, pendingSchedules] = await Promise.all([
          Task.countDocuments({
            patient_id: patientId,
            status: 'pending'
          }),
          TreatmentSchedule.countDocuments({
            patient_id: patientId,
            status: 'pending'
          })
        ]);
        
        const totalPending = pendingTasks + pendingSchedules;
        console.log('Pending treatments:', totalPending);
        
        if (totalPending === 0) {
          console.log('✅ All treatments completed! Auto-discharging patient from ambulatorxona...');
          
          // Bemorni chiqarish
          const dischargeDate = new Date();
          const admissionDate = new Date(activeAdmission.admission_date);
          const hoursDiff = (dischargeDate - admissionDate) / (1000 * 60 * 60);
          
          let totalDays = 0;
          if (hoursDiff < 12) {
            totalDays = 0;
          } else if (hoursDiff <= 24) {
            totalDays = 1;
          } else {
            totalDays = 1 + Math.ceil((hoursDiff - 24) / 24);
          }
          
          activeAdmission.status = 'discharged';
          activeAdmission.discharge_date = dischargeDate;
          activeAdmission.total_days = totalDays;
          activeAdmission.discharge_notes = 'Avtomatik chiqarildi - barcha muolajalar yakunlandi';
          await activeAdmission.save();
          
          // Koykani bo'shatish
          if (activeAdmission.bed_id) {
            const Bed = mongoose.model('Bed');
            const bed = await Bed.findById(activeAdmission.bed_id);
            if (bed) {
              bed.status = 'available';
              bed.current_patient_id = null;
              bed.current_admission_id = null;
              bed.released_at = dischargeDate;
              await bed.save();
              console.log('✅ Bed released:', bed.bed_number);
            }
          }
          
          // Xonani yangilash
          if (activeAdmission.room_id) {
            const AmbulatorRoom = mongoose.model('AmbulatorRoom');
            const room = await AmbulatorRoom.findById(activeAdmission.room_id);
            if (room) {
              const Bed = mongoose.model('Bed');
              const allBeds = await Bed.find({ room_id: room._id });
              const anyAvailable = allBeds.some(b => b.status === 'available');
              if (anyAvailable) {
                room.status = 'available';
                room.current_patient_id = null;
                await room.save();
                console.log('✅ Room status updated to available');
              }
            }
          }
          
          console.log('✅ Patient auto-discharged from ambulatorxona');
        }
      }
    }
    
    res.json({
      success: true,
      data: treatment,
      message: used_medicines && used_medicines.length > 0 
        ? 'Muolaja yakunlandi, dorilar dorixonadan ayirildi va kassaga qarz qo\'shildi'
        : 'Muolaja yakunlandi'
    });
  } catch (error) {
    console.error('=== COMPLETE TREATMENT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Muolajani yakunlashda xatolik',
      error: error.message
    });
  }
});
    
/**
 * Get nurse patients
 * GET /api/v1/nurse/patients
 */
router.get('/patients', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id;
    const { floor } = req.query;
    
    // Get unique patient IDs from active tasks
    const patientIds = await Task.distinct('patient_id', {
      nurse_id: nurseId,
      status: { $in: ['pending', 'in_progress'] }
    });
    
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select('first_name last_name patient_number phone')
      .lean();
    
    // Transform data to include id field and patient_name
    const transformedPatients = patients.map(patient => ({
      ...patient,
      id: patient._id.toString(),
      patient_name: `${patient.first_name} ${patient.last_name}`
    }));
    
    res.json({
      success: true,
      data: transformedPatients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Bemorlarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get calls (placeholder)
 * GET /api/v1/nurse/calls
 */
router.get('/calls', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Chaqiruvlarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get treatment history
 * GET /api/v1/nurse/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id;
    
    const history = await Task.find({
      nurse_id: nurseId,
      status: 'completed'
    })
      .populate('patient_id', 'first_name last_name patient_number')
      .sort({ completed_at: -1 })
      .limit(50)
      .lean();
    
    // Transform data to include id field and patient_name
    const transformedHistory = history.map(task => ({
      ...task,
      id: task._id.toString(),
      patient_name: task.patient_id ? `${task.patient_id.first_name} ${task.patient_id.last_name}` : 'N/A',
      medicine_name: task.medication_name || 'N/A',
      dosage: task.dosage || 'N/A'
    }));
    
    res.json({
      success: true,
      data: transformedHistory
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Tarixni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get medicine cabinets (placeholder)
 * GET /api/v1/nurse/medicine-cabinets
 */
router.get('/medicine-cabinets', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get medicine cabinets error:', error);
    res.status(500).json({
      success: false,
      message: 'Dori shkaflari olishda xatolik',
      error: error.message
    });
  }
});

export default router;
