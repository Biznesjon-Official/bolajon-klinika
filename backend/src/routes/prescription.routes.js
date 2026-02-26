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
      complaint,
      diagnosis,
      disease_name,
      secondary_disease_name,
      recommendations,
      prescription_type,
      medications,
      notes,
      nurse_id
    } = req.body;
    
    
    // Validate required fields
    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'Bemor ID majburiy'
      });
    }
    
    if (!diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Tashxis majburiy'
      });
    }
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kamida bitta dori kiritish majburiy'
      });
    }
    
    // Validate each medication
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.medication_name) {
        return res.status(400).json({
          success: false,
          message: `Dori ${i + 1}: Dori nomi majburiy`
        });
      }
      if (!med.dosage && !med.per_dose_amount) {
        return res.status(400).json({
          success: false,
          message: `Dori ${i + 1}: Dozasi majburiy`
        });
      }
    }
    
    // Get doctor ID from authenticated user
    const doctorId = req.user._id || req.user.id;
    
    
    if (!doctorId) {
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
      complaint,
      diagnosis,
      disease_name,
      secondary_disease_name,
      recommendations: recommendations || [],
      prescription_type: prescription_type || 'REGULAR',
      medications,
      notes,
      issued_date: new Date()
    });
    
    await prescription.save();
    
    
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
      
      
      // Create schedules for each medication
      for (const med of medications) {
        
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
          dosage: med.per_dose_amount || med.dosage,
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
        
      }
    } catch (scheduleError) {
      // Don't fail the whole request if schedule creation fails
    }
    
    // Return without populate to avoid errors
    res.json({
      success: true,
      data: {
        _id: prescription._id,
        prescription_number: prescription.prescription_number,
        patient_id: prescription.patient_id,
        doctor_id: prescription.doctor_id,
        complaint: prescription.complaint,
        diagnosis: prescription.diagnosis,
        disease_name: prescription.disease_name,
        secondary_disease_name: prescription.secondary_disease_name,
        recommendations: prescription.recommendations,
        prescription_type: prescription.prescription_type,
        medications: prescription.medications,
        notes: prescription.notes,
        status: prescription.status,
        issued_date: prescription.issued_date
      },
      message: 'Retsept muvaffaqiyatli yaratildi'
    });
  } catch (error) {
    
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
      message: 'Server xatosi'
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

    const formatted = prescriptions.map(p => ({
      ...p,
      id: p._id,
      doctor_first_name: p.doctor_id?.first_name,
      doctor_last_name: p.doctor_id?.last_name,
      doctor_specialization: p.doctor_id?.specialization
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
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
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
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
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
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
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

export default router;
