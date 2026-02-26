import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Staff from '../models/Staff.js';
import Task from '../models/Task.js';

const router = express.Router();

/**
 * Get active nurses
 * GET /api/doctor-nurse/nurses/active
 */
router.get('/nurses/active', authenticate, async (req, res) => {
  try {
    // Faol hamshiralarni topish - role to'g'ridan-to'g'ri string
    const nurses = await Staff.find({
      role: 'nurse',
      status: 'active'
    })
    .select('first_name last_name full_name specialization phone email')
    .lean();
    
    // Har bir hamshira uchun faol topshiriqlar sonini hisoblash
    const nursesWithWorkload = await Promise.all(
      nurses.map(async (nurse) => {
        const activeTasks = await Task.countDocuments({
          nurse_id: nurse._id,
          status: { $in: ['pending', 'in_progress'] }
        });
        
        const activePatients = await Task.distinct('patient_id', {
          nurse_id: nurse._id,
          status: { $in: ['pending', 'in_progress'] }
        });
        
        return {
          id: nurse._id,
          full_name: nurse.full_name || `${nurse.first_name} ${nurse.last_name}`,
          specialization: nurse.specialization || 'Hamshira',
          phone: nurse.phone,
          email: nurse.email,
          pending_tasks: activeTasks,
          active_patients: activePatients.length
        };
      })
    );
    
    res.json({
      success: true,
      data: nursesWithWorkload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

/**
 * Get nurse workload
 * GET /api/doctor-nurse/nurses/:id/workload
 */
router.get('/nurses/:id/workload', authenticate, async (req, res) => {
  try {
    const nurseId = req.params.id;
    
    const activeTasks = await Task.countDocuments({
      nurse_id: nurseId,
      status: { $in: ['pending', 'in_progress'] }
    });
    
    const activePatients = await Task.distinct('patient_id', {
      nurse_id: nurseId,
      status: { $in: ['pending', 'in_progress'] }
    });
    
    res.json({
      success: true,
      data: {
        active_tasks: activeTasks,
        active_patients: activePatients.length
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
 * Assign task to nurse
 * POST /api/doctor-nurse/assign-task
 */
router.post('/assign-task', authenticate, async (req, res) => {
  try {
    const {
      patient_id,
      admission_id,
      nurse_id,
      task_type,
      medication_name,
      dosage,
      route,
      frequency,
      priority,
      instructions,
      scheduled_time
    } = req.body;
    
    // Validate required fields
    if (!patient_id || !nurse_id || !task_type) {
      return res.status(400).json({
        success: false,
        message: 'Bemor, hamshira va topshiriq turi majburiy'
      });
    }
    
    // If admission_id not provided, try to find active admission
    let finalAdmissionId = admission_id;
    if (!finalAdmissionId) {
      const Admission = (await import('../models/Admission.js')).default;
      const activeAdmission = await Admission.findOne({
        patient_id,
        status: 'active'
      }).lean();
      
      if (activeAdmission) {
        finalAdmissionId = activeAdmission._id;
      }
    }
    
    // Create task
    const task = new Task({
      patient_id,
      admission_id: finalAdmissionId,
      nurse_id,
      assigned_by: req.user.staffProfile?.id || req.user.id,
      task_type,
      medication_name,
      dosage,
      route: route || 'oral',
      frequency: frequency || 'once',
      priority: priority || 'NORMAL',
      instructions,
      scheduled_time: scheduled_time || new Date(),
      status: 'pending'
    });
    
    await task.save();
    
    res.json({
      success: true,
      data: task,
      message: 'Topshiriq hamshiraga yuborildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

/**
 * Assign patient to nurse
 * POST /api/doctor-nurse/assign-patient
 */
router.post('/assign-patient', authenticate, async (req, res) => {
  try {
    const { patient_id, nurse_id, notes } = req.body;
    
    if (!patient_id || !nurse_id) {
      return res.status(400).json({
        success: false,
        message: 'Bemor va hamshira majburiy'
      });
    }
    
    // Create assignment task
    const task = new Task({
      patient_id,
      nurse_id,
      assigned_by: req.user.staffProfile?.id || req.user.id,
      task_type: 'patient_care',
      priority: 'NORMAL',
      instructions: notes || 'Bemorga g\'amxo\'rlik qilish',
      scheduled_time: new Date(),
      status: 'pending'
    });
    
    await task.save();
    
    res.json({
      success: true,
      data: task,
      message: 'Bemor hamshiraga biriktirildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

/**
 * Get patient's nurse
 * GET /api/doctor-nurse/patients/:id/nurse
 */
router.get('/patients/:id/nurse', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Find most recent active task for this patient
    const task = await Task.findOne({
      patient_id: patientId,
      status: { $in: ['pending', 'in_progress'] }
    })
    .sort({ created_at: -1 })
    .populate('nurse_id', 'first_name last_name full_name specialization phone')
    .lean();
    
    if (!task || !task.nurse_id) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    res.json({
      success: true,
      data: {
        id: task.nurse_id._id,
        full_name: task.nurse_id.full_name || `${task.nurse_id.first_name} ${task.nurse_id.last_name}`,
        specialization: task.nurse_id.specialization,
        phone: task.nurse_id.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
});

export default router;
