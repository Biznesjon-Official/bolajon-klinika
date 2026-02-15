import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Prescription from '../models/Prescription.js';

const router = express.Router();

/**
 * Create prescription
 * POST /api/v1/prescriptions
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patient_id,
      queue_id,
      diagnosis,
      prescription_type,
      medications,
      notes,
      nurse_id
    } = req.body;
    
    console.log('=== CREATE PRESCRIPTION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    // Validate required fields
    if (!patient_id) {
      console.log('❌ Missing patient_id');
      return res.status(400).json({
        success: false,
        message: 'Bemor ID majburiy'
      });
    }
    
    if (!diagnosis) {
      console.log('❌ Missing diagnosis');
      return res.status(400).json({
        success: false,
        message: 'Tashxis majburiy'
      });
    }
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      console.log('❌ Missing or invalid medications');
      return res.status(400).json({
        success: false,
        message: 'Kamida bitta dori kiritish majburiy'
      });
    }
    
    // Validate each medication
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.medication_name) {
        console.log(`❌ Medication ${i + 1} missing medication_name`);
        return res.status(400).json({
          success: false,
          message: `Dori ${i + 1}: Dori nomi majburiy`
        });
      }
      if (!med.dosage) {
        console.log(`❌ Medication ${i + 1} missing dosage`);
        return res.status(400).json({
          success: false,
          message: `Dori ${i + 1}: Dozasi majburiy`
        });
      }
    }
    
    // Get doctor ID from authenticated user
    const doctorId = req.user._id || req.user.id;
    
    console.log('Doctor ID:', doctorId);
    
    if (!doctorId) {
      console.log('❌ Missing doctor ID');
      return res.status(400).json({
        success: false,
        message: 'Shifokor ID topilmadi'
      });
    }
    
    // Create prescription
    const prescription = new Prescription({
      patient_id,
      doctor_id: doctorId,
      nurse_id: nurse_id || null,
      queue_id,
      diagnosis,
      prescription_type: prescription_type || 'REGULAR',
      medications,
      notes,
      issued_date: new Date()
    });
    
    await prescription.save();
    
    console.log('✅ Prescription created:', prescription._id);
    
    // Create treatment schedules for medications with schedule_times
    try {
      const TreatmentSchedule = (await import('../models/TreatmentSchedule.js')).default;
      const Admission = (await import('../models/Admission.js')).default;
      const PatientNurse = (await import('../models/PatientNurse.js')).default;
      
      // Get active admission for patient
      const admission = await Admission.findOne({ 
        patient_id, 
        status: 'active' 
      }).lean();
      
      console.log('Active admission:', admission?._id);
      
      // Get assigned nurse for patient
      let assignedNurseId = nurse_id;
      if (!assignedNurseId && admission) {
        const nurseAssignment = await PatientNurse.findOne({
          patient_id,
          admission_id: admission._id,
          status: 'active'
        }).lean();
        assignedNurseId = nurseAssignment?.nurse_id;
      }
      
      console.log('Assigned nurse ID:', assignedNurseId);
      
      // Create schedules for each medication
      for (const med of medications) {
        console.log('Creating schedule for medication:', med.medication_name);
        
        // Har bir dori uchun hamshirani aniqlash
        // 1. Dori uchun maxsus hamshira
        // 2. Retsept uchun umumiy hamshira
        // 3. Bemorga biriktirilgan hamshira
        const medicationNurseId = med.nurse_id || assignedNurseId;
        
        // Har bir dori uchun faqat 1 ta TreatmentSchedule yaratamiz
        // Barcha jadval ma'lumotlari shu yerda saqlanadi
        const startDate = new Date();
        
        // Calculate total doses
        const totalDoses = (med.frequency_per_day || 1) * (med.duration_days || 1);
        
        const schedule = new TreatmentSchedule({
          prescription_id: prescription._id,
          patient_id,
          admission_id: admission?._id,
          nurse_id: medicationNurseId,
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency_per_day: med.frequency_per_day || null,
          schedule_times: med.schedule_times || [],
          duration_days: med.duration_days || null,
          total_doses: totalDoses,
          completed_doses: 0,
          scheduled_time: startDate,
          scheduled_date: startDate,
          instructions: med.instructions || '',
          status: 'pending'
        });
        
        await schedule.save();
        
        console.log(`✅ ${med.medication_name} uchun TreatmentSchedule yaratildi (Jami: ${totalDoses} marta)${medicationNurseId ? ' - Hamshira tayinlandi' : ''}`);
      }
    } catch (scheduleError) {
      console.error('Treatment schedule creation error:', scheduleError);
      console.error('Error stack:', scheduleError.stack);
      // Don't fail the whole request if schedule creation fails
      console.log('⚠️  Prescription created but treatment schedules failed');
    }
    
    // Return without populate to avoid errors
    res.json({
      success: true,
      data: {
        _id: prescription._id,
        prescription_number: prescription.prescription_number,
        patient_id: prescription.patient_id,
        doctor_id: prescription.doctor_id,
        diagnosis: prescription.diagnosis,
        prescription_type: prescription.prescription_type,
        medications: prescription.medications,
        notes: prescription.notes,
        status: prescription.status,
        issued_date: prescription.issued_date
      },
      message: 'Retsept muvaffaqiyatli yaratildi'
    });
  } catch (error) {
    console.error('=== CREATE PRESCRIPTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi: ' + messages.join(', '),
        errors: error.errors
      });
    }
    
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu retsept raqami allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Retsept yaratishda xatolik: ' + error.message,
      error: error.message
    });
  }
});

/**
 * Get patient prescriptions
 * GET /api/v1/prescriptions/patient/:patientId
 */
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.find({ patient_id: patientId })
      .populate('doctor_id', 'first_name last_name specialization')
      .sort({ issued_date: -1 })
      .lean();
    
    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Retseptlarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get prescription by ID
 * GET /api/v1/prescriptions/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient_id', 'first_name last_name patient_number phone')
      .populate('doctor_id', 'first_name last_name specialization')
      .lean();
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Retsept topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Retseptni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get all prescriptions (with filters)
 * GET /api/v1/prescriptions
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      patient_id, 
      doctor_id, 
      prescription_type, 
      status,
      from_date,
      to_date,
      limit = 50,
      page = 1
    } = req.query;
    
    const query = {};
    
    if (patient_id) query.patient_id = patient_id;
    if (doctor_id) query.doctor_id = doctor_id;
    if (prescription_type) query.prescription_type = prescription_type;
    if (status) query.status = status;
    
    if (from_date || to_date) {
      query.issued_date = {};
      if (from_date) query.issued_date.$gte = new Date(from_date);
      if (to_date) query.issued_date.$lte = new Date(to_date);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('doctor_id', 'first_name last_name specialization')
        .sort({ issued_date: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Prescription.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Retseptlarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Update prescription status
 * PATCH /api/v1/prescriptions/:id/status
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri status'
      });
    }
    
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Retsept topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: prescription,
      message: 'Status yangilandi'
    });
  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Statusni yangilashda xatolik',
      error: error.message
    });
  }
});

export default router;
