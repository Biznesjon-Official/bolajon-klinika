import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import Prescription from '../models/Prescription.js';
import Invoice from '../models/Invoice.js';
import LabOrder from '../models/LabOrder.js';
import Communication from '../models/Communication.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get patient dashboard data
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    // Get patient info
    const patient = await Patient.findById(patientId)
      .select('-password -refresh_token')
      .lean();
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    // Get statistics
    const [
      upcomingAppointments,
      activePrescriptions,
      pendingInvoices,
      pendingLabTests
    ] = await Promise.all([
      Queue.countDocuments({
        patient_id: patientId,
        status: { $in: ['waiting', 'called'] }
      }),
      Prescription.countDocuments({
        patient_id: patientId,
        status: 'ACTIVE'
      }),
      Invoice.countDocuments({
        patient_id: patientId,
        payment_status: { $in: ['pending', 'partial'] }
      }),
      LabOrder.countDocuments({
        patient_id: patientId,
        status: { $in: ['pending', 'in_progress', 'sample_collected'] }
      })
    ]);
    
    // Get recent appointments (queue entries)
    const recentAppointments = await Queue.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name specialization')
      .populate('service_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .lean();
    
    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          patient_number: patient.patient_number,
          full_name: patient.full_name,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone,
          email: patient.email,
          date_of_birth: patient.date_of_birth,
          blood_type: patient.blood_type,
          total_debt: patient.total_debt || 0
        },
        stats: {
          upcoming_appointments: upcomingAppointments,
          active_prescriptions: activePrescriptions,
          pending_invoices: pendingInvoices,
          pending_lab_tests: pendingLabTests
        },
        recent_appointments: recentAppointments.map(a => ({
          id: a._id,
          queue_number: a.queue_number,
          appointment_date: a.created_at,
          doctor_name: a.doctor_id ? `${a.doctor_id.first_name} ${a.doctor_id.last_name}` : 'Noma\'lum',
          specialization: a.doctor_id?.specialization,
          service_name: a.service_id?.name,
          status: a.status,
          complaint: a.complaint
        })),
        recent_prescriptions: recentPrescriptions.map(p => ({
          id: p._id,
          prescription_number: p.prescription_number,
          doctor_name: p.doctor_id ? `${p.doctor_id.first_name} ${p.doctor_id.last_name}` : 'Noma\'lum',
          medications: p.medications,
          status: p.status,
          created_at: p.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get patient dashboard error:', error);
    next(error);
  }
});

// Get patient appointments
router.get('/appointments', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const appointments = await Queue.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name specialization')
      .populate('service_id', 'name')
      .sort({ created_at: -1 })
      .lean();
    
    res.json({
      success: true,
      data: appointments.map(a => ({
        id: a._id,
        queue_number: a.queue_number,
        appointment_date: a.created_at,
        doctor_name: a.doctor_id ? `${a.doctor_id.first_name} ${a.doctor_id.last_name}` : 'Noma\'lum',
        specialization: a.doctor_id?.specialization,
        service_name: a.service_id?.name,
        status: a.status,
        complaint: a.complaint
      }))
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    next(error);
  }
});

// Get patient prescriptions
router.get('/prescriptions', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const prescriptions = await Prescription.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: prescriptions.map(p => ({
        id: p._id,
        prescription_number: p.prescription_number,
        doctor_name: p.doctor_id ? `${p.doctor_id.first_name} ${p.doctor_id.last_name}` : 'Noma\'lum',
        medications: p.medications,
        status: p.status,
        created_at: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    next(error);
  }
});

// Get patient invoices
router.get('/invoices', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const invoices = await Invoice.find({
      patient_id: patientId
    })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: invoices.map(i => ({
        id: i._id,
        invoice_number: i.invoice_number,
        total_amount: i.total_amount,
        paid_amount: i.paid_amount,
        payment_status: i.payment_status,
        created_at: i.createdAt
      }))
    });
  } catch (error) {
    console.error('Get patient invoices error:', error);
    next(error);
  }
});

// Get patient lab tests
router.get('/lab-tests', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const labTests = await LabOrder.find({
      patient_id: patientId
    })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: labTests.map(l => ({
        id: l._id,
        order_number: l.order_number,
        test_name: l.test_name,
        status: l.status,
        results: l.results,
        created_at: l.createdAt
      }))
    });
  } catch (error) {
    console.error('Get patient lab tests error:', error);
    next(error);
  }
});

export default router;


// Get patient profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const patient = await Patient.findById(patientId)
      .select('-password -refresh_token')
      .lean();
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: {
        patient_number: patient.patient_number,
        first_name: patient.first_name,
        last_name: patient.last_name,
        middle_name: patient.middle_name,
        phone: patient.phone,
        email: patient.email,
        birth_date: patient.date_of_birth,
        gender: patient.gender,
        blood_type: patient.blood_type,
        address: patient.address,
        emergency_contact: patient.emergency_contact,
        emergency_phone: patient.emergency_phone
      }
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    next(error);
  }
});

// Update patient profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    const { phone, email, address, emergency_contact, emergency_phone } = req.body;
    
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        phone,
        email,
        address,
        emergency_contact,
        emergency_phone
      },
      { new: true, runValidators: true }
    ).select('-password -refresh_token');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    res.json({
      success: true,
      message: 'Profil muvaffaqiyatli yangilandi',
      data: patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    next(error);
  }
});

// Change password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Joriy va yangi parol talab qilinadi'
      });
    }
    
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, patient.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(newPassword, salt);
    await patient.save();
    
    res.json({
      success: true,
      message: 'Parol muvaffaqiyatli o\'zgartirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
});

// Get current queue status
router.get('/queue', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    // Find active queue entry
    const queueEntry = await Queue.findOne({
      patient_id: patientId,
      status: { $in: ['waiting', 'called', 'in_progress'] }
    })
      .populate('doctor_id', 'first_name last_name specialization')
      .populate('service_id', 'name')
      .sort({ created_at: -1 })
      .lean();
    
    if (!queueEntry) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    res.json({
      success: true,
      data: {
        id: queueEntry._id,
        queue_number: queueEntry.queue_number,
        status: queueEntry.status,
        doctor_name: queueEntry.doctor_id ? `${queueEntry.doctor_id.first_name} ${queueEntry.doctor_id.last_name}` : 'Noma\'lum',
        specialization: queueEntry.doctor_id?.specialization,
        service_name: queueEntry.service_id?.name,
        complaint: queueEntry.complaint,
        created_at: queueEntry.created_at
      }
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    next(error);
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await Communication.find({
      patient_id: patientId,
      type: { $in: ['notification', 'sms', 'telegram'] }
    })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      data: notifications.map(n => ({
        id: n._id,
        title: n.title || 'Bildirishnoma',
        message: n.message,
        type: n.type,
        status: n.status,
        created_at: n.created_at,
        read: n.read || false
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    const notificationId = req.params.id;
    
    const notification = await Communication.findOneAndUpdate(
      {
        _id: notificationId,
        patient_id: patientId
      },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirishnoma topilmadi'
      });
    }
    
    res.json({
      success: true,
      message: 'Bildirishnoma o\'qilgan deb belgilandi'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    next(error);
  }
});

// Get lab results (alias for lab-tests)
router.get('/lab-results', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.patient_id || req.user.id;
    
    const labTests = await LabOrder.find({
      patient_id: patientId
    })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: labTests.map(l => ({
        id: l._id,
        order_number: l.order_number,
        test_name: l.test_name,
        status: l.status,
        results: l.results,
        created_at: l.createdAt
      }))
    });
  } catch (error) {
    console.error('Get lab results error:', error);
    next(error);
  }
});
