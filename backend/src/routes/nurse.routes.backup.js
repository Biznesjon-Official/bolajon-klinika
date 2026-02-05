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
    const { floor } = req.query;
    
    const query = {
      status: 'active',
      quantity: { $gt: 0 }
    };
    
    if (floor) {
      query.floor = parseInt(floor);
    }
    
    const medicines = await Medicine.find(query)
      .select('name unit quantity unit_price floor')
      .sort({ name: 1 })
      .lean();
    
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
    
    const query = { nurse_id: nurseId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Get both Tasks (urgent/emergency) and TreatmentSchedules (regular)
    const [tasks, treatmentSchedules] = await Promise.all([
      Task.find(query)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('assigned_by', 'first_name last_name')
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
    }
    if (treatmentSchedules.length > 0) {
      console.log('Sample TreatmentSchedule:', JSON.stringify(treatmentSchedules[0], null, 2));
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
            if (admission.bed_id) {
              // Use bed_id to get full info
              const Bed = mongoose.model('Bed');
              const bed = await Bed.findById(admission.bed_id).populate('room_id').lean();
              
              if (bed && bed.room_id) {
                admissionInfo.room_info = {
                  room_number: bed.room_id.room_number,
                  room_name: bed.room_id.name || bed.room_id.room_name,
                  bed_number: bed.bed_number,
                  floor: bed.room_id.floor
                };
              }
            } else if (admission.room_id) {
              // Fallback: use room_id directly
              const AmbulatorRoom = mongoose.model('AmbulatorRoom');
              const room = await AmbulatorRoom.findById(admission.room_id).lean();
              
              if (room) {
                admissionInfo.room_info = {
                  room_number: room.room_number,
                  room_name: room.name || room.room_name,
                  bed_number: admission.bed_number || 'N/A',
                  floor: room.floor
                };
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
        source: 'task'
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
            if (admission.bed_id) {
              // Use bed_id to get full info
              const Bed = mongoose.model('Bed');
              const bed = await Bed.findById(admission.bed_id).populate('room_id').lean();
              
              if (bed && bed.room_id) {
                admissionInfo.room_info = {
                  room_number: bed.room_id.room_number,
                  room_name: bed.room_id.name || bed.room_id.room_name,
                  bed_number: bed.bed_number,
                  floor: bed.room_id.floor
                };
              }
            } else if (admission.room_id) {
              // Fallback: use room_id directly (for old admissions without bed_id)
              const AmbulatorRoom = mongoose.model('AmbulatorRoom');
              const room = await AmbulatorRoom.findById(admission.room_id).lean();
              
              if (room) {
                admissionInfo.room_info = {
                  room_number: room.room_number,
                  room_name: room.name || room.room_name,
                  bed_number: admission.bed_number || 'N/A',
                  floor: room.floor
                };
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
        source: 'schedule'
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
    const { notes } = req.body;
    const nurseId = req.user._id || req.user.id;
    
    // Find task with full details
    const task = await Task.findById(req.params.id)
      .populate('patient_id', 'first_name last_name patient_number')
      .populate('nurse_id', 'first_name last_name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Topshiriq topilmadi'
      });
    }
    
    // Update task status
    task.status = 'completed';
    task.completed_at = new Date();
    task.completion_notes = notes;
    await task.save();
    
    // If task has medication, deduct from pharmacy and create transaction
    if (task.medication_name) {
      console.log('=== PROCESSING MEDICATION ===');
      console.log('Medication name:', task.medication_name);
      console.log('Dosage:', task.dosage);
      
      // Find medicine by name (case-insensitive)
      const medicine = await Medicine.findOne({
        name: { $regex: new RegExp(`^${task.medication_name}$`, 'i') }
      });
      
      if (medicine) {
        console.log('✅ Medicine found:', medicine.name);
        console.log('   Current quantity:', medicine.quantity);
        console.log('   Unit:', medicine.unit);
        
        // Parse dosage to get quantity
        // Dosage formatlar: "500mg", "2 tablets", "1 dona", "10ml", etc.
        let quantityToDeduct = 1; // Default: 1 dona
        
        // Agar dosage'da "dona", "tablet", "ampula", "shisha" kabi so'zlar bo'lsa
        const unitMatch = task.dosage?.match(/(\d+)\s*(dona|tablet|ampula|shisha|quti)/i);
        if (unitMatch) {
          quantityToDeduct = parseInt(unitMatch[1]);
        } else {
          // Agar faqat raqam bilan boshlanib, birlik (mg, ml, g) bo'lsa, 1 dona deb hisoblaymiz
          const mgMatch = task.dosage?.match(/^\d+\s*(mg|ml|g|mcg)/i);
          if (mgMatch) {
            quantityToDeduct = 1; // 500mg = 1 dona
          } else {
            // Agar boshqa format bo'lsa, birinchi raqamni olish
            const numberMatch = task.dosage?.match(/^(\d+)/);
            if (numberMatch) {
              const num = parseInt(numberMatch[1]);
              // Agar raqam 100 dan katta bo'lsa (masalan 500mg), 1 dona deb hisoblaymiz
              quantityToDeduct = num > 100 ? 1 : num;
            }
          }
        }
        
        console.log('   Quantity to deduct:', quantityToDeduct);
        
        // Check if enough stock
        if (medicine.quantity >= quantityToDeduct) {
          // Deduct from stock
          medicine.quantity -= quantityToDeduct;
          
          // Update status if out of stock
          if (medicine.quantity === 0) {
            medicine.status = 'out_of_stock';
          }
          
          await medicine.save();
          console.log('✅ Medicine quantity updated:', medicine.quantity);
          
          // Create pharmacy transaction (chiqim)
          const transaction = await PharmacyTransaction.create({
            medicine_id: medicine._id,
            medicine_name: medicine.name,
            transaction_type: 'out',
            quantity: quantityToDeduct,
            unit_price: medicine.unit_price || 0,
            total_amount: (medicine.unit_price || 0) * quantityToDeduct,
            patient_id: task.patient_id?._id || task.patient_id,
            staff_id: nurseId,
            task_id: task._id,
            notes: `Hamshira tomonidan berildi: ${notes || 'Muolaja yakunlandi'}`,
            floor: medicine.floor || 1
          });
          
          console.log('✅ Transaction created:', transaction._id);
          
          // Create invoice for medication (qarz)
          console.log('💰 Creating invoice for medication...');
          
          // Find or create medicine service
          let medicineService = await Service.findOne({ 
            name: { $regex: new RegExp(`^${medicine.name}$`, 'i') },
            category: 'medication'
          });
          
          if (!medicineService) {
            // Create service if not exists
            medicineService = await Service.create({
              name: medicine.name,
              category: 'medication',
              price: medicine.unit_price || 0,
              description: `Dori: ${medicine.name}`,
              status: 'active'
            });
            console.log('✅ Medicine service created:', medicineService._id);
          }
          
          // Generate invoice number
          const invoiceCount = await Invoice.countDocuments();
          const invoiceNumber = `INV${new Date().getFullYear()}${String(invoiceCount + 1).padStart(6, '0')}`;
          
          // Create invoice
          const invoice = await Invoice.create({
            patient_id: task.patient_id?._id || task.patient_id,
            invoice_number: invoiceNumber,
            total_amount: (medicine.unit_price || 0) * quantityToDeduct,
            paid_amount: 0,
            discount_amount: 0,
            payment_status: 'pending',
            notes: `Hamshira muolajasi: ${medicine.name} - ${task.dosage}`,
            created_by: nurseId
          });
          
          console.log('✅ Invoice created:', invoice._id, invoice.invoice_number);
          
          // Create billing item
          await BillingItem.create({
            billing_id: invoice._id,
            service_id: medicineService._id,
            service_name: medicine.name,
            quantity: quantityToDeduct,
            unit_price: medicine.unit_price || 0,
            total_price: (medicine.unit_price || 0) * quantityToDeduct
          });
          
          console.log('✅ Billing item created');
          console.log('💰 Invoice amount:', (medicine.unit_price || 0) * quantityToDeduct, 'so\'m');
        } else {
          console.log('⚠️  Not enough stock. Available:', medicine.quantity, 'Needed:', quantityToDeduct);
          return res.status(400).json({
            success: false,
            message: `Dorixonada yetarli dori yo'q. Mavjud: ${medicine.quantity} ${medicine.unit || 'dona'}, Kerak: ${quantityToDeduct} ${medicine.unit || 'dona'}`
          });
        }
      } else {
        console.log('⚠️  Medicine not found in database');
        // Don't fail the task completion, just log warning
      }
    }
    
    // ===== AMBULATORXONADA AVTOMATIK CHIQARISH =====
    // Agar bemor ambulatorxonada bo'lsa va barcha muolajalar tugagan bo'lsa, avtomatik chiqarish
    if (task.patient_id) {
      const patientId = task.patient_id._id || task.patient_id;
      
      // Bemorning faol admission'ini topish
      const Admission = mongoose.model('Admission');
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
          mongoose.model('TreatmentSchedule').countDocuments({
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
          
          // Kunlarni hisoblash
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
      data: task,
      message: 'Muolaja yakunlandi, dori dorixonadan ayirildi va kassaga qarz qo\'shildi'
    });
  } catch (error) {
    console.error('Complete treatment error:', error);
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
