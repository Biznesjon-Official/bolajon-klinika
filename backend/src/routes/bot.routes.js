import express from 'express';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import Prescription from '../models/Prescription.js';
import Invoice from '../models/Invoice.js';
import LabOrder from '../models/LabOrder.js';
import Communication from '../models/Communication.js';

const router = express.Router();

// Get patient by patient_number (for deep linking)
router.get('/patients/by-number/:patientNumber', async (req, res, next) => {
  try {
    const { patientNumber } = req.params;
    
    const patient = await Patient.findOne({ patient_number: patientNumber })
      .select('-password -refresh_token')
      .lean();
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    // MongoDB _id ni id sifatida qaytarish
    const patientData = {
      ...patient,
      id: patient._id.toString()
    };
    
    res.json({
      success: true,
      data: patientData
    });
  } catch (error) {
    console.error('Get patient by number error:', error);
    next(error);
  }
});

// Get patient by access_code (8-digit code for Telegram bot)
router.get('/patients/by-access-code/:accessCode', async (req, res, next) => {
  try {
    const { accessCode } = req.params;
    
    // Validate 8-digit code
    if (!/^\d{8}$/.test(accessCode)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kod formati. 8 xonali raqam bo\'lishi kerak.'
      });
    }
    
    const patient = await Patient.findOne({ access_code: accessCode })
      .select('-password -refresh_token')
      .lean();
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    // MongoDB _id ni id sifatida qaytarish
    const patientData = {
      ...patient,
      id: patient._id.toString()
    };
    
    res.json({
      success: true,
      data: patientData
    });
  } catch (error) {
    console.error('Get patient by access code error:', error);
    next(error);
  }
});

// Update patient telegram info
router.put('/patients/telegram/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { telegram_chat_id, telegram_username, telegram_notifications_enabled } = req.body;
    
    const patient = await Patient.findByIdAndUpdate(
      id,
      {
        telegram_chat_id,
        telegram_username,
        telegram_notifications_enabled
      },
      { new: true }
    ).select('-password -refresh_token');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Update telegram info error:', error);
    next(error);
  }
});

// Get patient queue - BARCHA navbatlar (hamma statuslar)
router.get('/queue/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    // Barcha navbatlarni olish (status filtrsiz)
    const queues = await Queue.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(20) // Oxirgi 20 ta navbat
      .lean();
    
    // Har bir navbat uchun haqiqiy pozitsiyani hisoblash
    const formattedQueues = await Promise.all(queues.map(async (q) => {
      let actualPosition = q.queue_number; // Default qiymat
      
      // Agar navbat kutayotgan bo'lsa, haqiqiy pozitsiyani hisoblash
      if (q.status === 'WAITING' || q.status === 'waiting') {
        // Bugungi kun uchun o'sha shifokorning kutayotgan navbatlarini olish
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const waitingQueues = await Queue.find({
          doctor_id: q.doctor_id?._id,
          status: { $in: ['WAITING', 'waiting'] },
          createdAt: { $gte: today, $lt: tomorrow }
        })
          .sort({ queue_number: 1 })
          .lean();
        
        // Bemorning pozitsiyasini topish
        const position = waitingQueues.findIndex(wq => wq._id.toString() === q._id.toString());
        if (position !== -1) {
          actualPosition = position + 1; // 1-dan boshlanadi
        }
      }
      
      return {
        ...q,
        doctor_name: q.doctor_id ? `${q.doctor_id.first_name} ${q.doctor_id.last_name}` : 'Noma\'lum',
        queue_number: actualPosition, // Haqiqiy pozitsiya
        original_queue_number: q.queue_number // Asl navbat raqami
      };
    }));
    
    res.json({
      success: true,
      data: formattedQueues
    });
  } catch (error) {
    console.error('Get patient queue error:', error);
    next(error);
  }
});

// Get patient prescriptions - BARCHA retseptlar
router.get('/prescriptions/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.find({
      patient_id: patientId
    })
      .populate('doctor_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(20) // Oxirgi 20 ta retsept
      .lean();
    
    const formattedPrescriptions = prescriptions.map(p => ({
      ...p,
      doctor_first_name: p.doctor_id?.first_name,
      doctor_last_name: p.doctor_id?.last_name
    }));
    
    res.json({
      success: true,
      data: formattedPrescriptions
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    next(error);
  }
});

// Get patient full info (for debts and lab results) - BARCHA ma'lumotlar
router.get('/patients/:patientId/full', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const [patient, invoices, labOrders] = await Promise.all([
      Patient.findById(patientId).select('-password -refresh_token').lean(),
      Invoice.find({ patient_id: patientId }).sort({ createdAt: -1 }).limit(10).lean(), // Oxirgi 10 ta invoice
      LabOrder.find({ patient_id: patientId }).sort({ createdAt: -1 }).limit(20).lean() // Oxirgi 20 ta tahlil
    ]);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Bemor topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: {
        patient,
        invoices,
        labOrders
      }
    });
  } catch (error) {
    console.error('Get patient full info error:', error);
    next(error);
  }
});

// Get patient messages
router.get('/messages/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const messages = await Communication.find({
      patient_id: patientId
    })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get patient messages error:', error);
    next(error);
  }
});

export default router;
