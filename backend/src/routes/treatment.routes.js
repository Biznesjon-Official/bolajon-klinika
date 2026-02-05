import express from 'express';
import { authenticate } from '../middleware/auth.js';
import TreatmentSchedule from '../models/TreatmentSchedule.js';

const router = express.Router();

/**
 * Get treatment schedules
 * GET /api/v1/treatments
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      patient_id, 
      nurse_id, 
      date,
      status,
      limit = 50,
      page = 1
    } = req.query;
    
    const query = {};
    
    if (patient_id) query.patient_id = patient_id;
    if (nurse_id) query.nurse_id = nurse_id;
    if (status) query.status = status;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.scheduled_date = { $gte: startDate, $lte: endDate };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [schedules, total] = await Promise.all([
      TreatmentSchedule.find(query)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name')
        .populate('prescription_id', 'prescription_number diagnosis')
        .sort({ scheduled_time: 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      TreatmentSchedule.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get treatment schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Muolaja jadvalini olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Complete treatment
 * PUT /api/v1/treatments/:id/complete
 */
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { notes } = req.body;
    const nurseId = req.user._id || req.user.id;
    
    const schedule = await TreatmentSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Muolaja topilmadi'
      });
    }
    
    schedule.status = 'completed';
    schedule.completed_at = new Date();
    schedule.completed_by = nurseId;
    if (notes) schedule.notes = notes;
    
    await schedule.save();
    
    res.json({
      success: true,
      message: 'Muolaja bajarildi',
      data: schedule
    });
  } catch (error) {
    console.error('Complete treatment error:', error);
    res.status(500).json({
      success: false,
      message: 'Muolajani bajarishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get today's treatments for nurse
 * GET /api/v1/treatments/my-today
 */
router.get('/my-today', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const schedules = await TreatmentSchedule.find({
      nurse_id: nurseId,
      scheduled_date: { $gte: today, $lt: tomorrow }
    })
      .populate('patient_id', 'first_name last_name patient_number')
      .populate('prescription_id', 'prescription_number diagnosis')
      .sort({ scheduled_time: 1 })
      .lean();
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get my today treatments error:', error);
    res.status(500).json({
      success: false,
      message: 'Bugungi muolajalarni olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Get patient's daily treatment schedule
 * GET /api/v1/treatments/patient/:patientId/schedule
 */
router.get('/patient/:patientId/schedule', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date } = req.query;
    
    // Agar sana berilmagan bo'lsa, bugungi kunni olish
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const schedules = await TreatmentSchedule.find({
      patient_id: patientId,
      scheduled_date: { $gte: targetDate, $lt: nextDay }
    })
      .populate('nurse_id', 'first_name last_name phone')
      .populate('prescription_id', 'prescription_number diagnosis')
      .sort({ scheduled_time: 1 })
      .lean();
    
    // Vaqt bo'yicha guruhlash
    const groupedByTime = schedules.reduce((acc, schedule) => {
      const timeKey = schedule.scheduled_time.toTimeString().substring(0, 5); // HH:MM
      if (!acc[timeKey]) {
        acc[timeKey] = [];
      }
      acc[timeKey].push({
        id: schedule._id,
        medication_name: schedule.medication_name,
        dosage: schedule.dosage,
        instructions: schedule.instructions,
        status: schedule.status,
        completed_at: schedule.completed_at,
        notes: schedule.notes,
        nurse: schedule.nurse_id ? {
          id: schedule.nurse_id._id,
          first_name: schedule.nurse_id.first_name,
          last_name: schedule.nurse_id.last_name,
          phone: schedule.nurse_id.phone
        } : null,
        prescription: schedule.prescription_id ? {
          id: schedule.prescription_id._id,
          prescription_number: schedule.prescription_id.prescription_number,
          diagnosis: schedule.prescription_id.diagnosis
        } : null
      });
      return acc;
    }, {});
    
    // Natijani formatlash
    const dailySchedule = Object.keys(groupedByTime)
      .sort()
      .map(time => ({
        time: time,
        treatments: groupedByTime[time]
      }));
    
    res.json({
      success: true,
      data: {
        date: targetDate,
        schedule: dailySchedule,
        total_treatments: schedules.length
      }
    });
  } catch (error) {
    console.error('Get patient schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Bemor jadvalini olishda xatolik',
      error: error.message
    });
  }
});

/**
 * Assign nurse to treatment schedule
 * PUT /api/v1/treatments/:id/assign-nurse
 */
router.put('/:id/assign-nurse', authenticate, async (req, res) => {
  try {
    const { nurse_id } = req.body;
    
    if (!nurse_id) {
      return res.status(400).json({
        success: false,
        message: 'Hamshira ID majburiy'
      });
    }
    
    const schedule = await TreatmentSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Muolaja topilmadi'
      });
    }
    
    schedule.nurse_id = nurse_id;
    await schedule.save();
    
    res.json({
      success: true,
      message: 'Hamshira tayinlandi',
      data: schedule
    });
  } catch (error) {
    console.error('Assign nurse error:', error);
    res.status(500).json({
      success: false,
      message: 'Hamshirani tayinlashda xatolik',
      error: error.message
    });
  }
});

/**
 * Bulk assign nurse to multiple treatments
 * PUT /api/v1/treatments/bulk-assign-nurse
 */
router.put('/bulk-assign-nurse', authenticate, async (req, res) => {
  try {
    const { treatment_ids, nurse_id } = req.body;
    
    if (!treatment_ids || !Array.isArray(treatment_ids) || treatment_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Muolaja ID lari majburiy'
      });
    }
    
    if (!nurse_id) {
      return res.status(400).json({
        success: false,
        message: 'Hamshira ID majburiy'
      });
    }
    
    const result = await TreatmentSchedule.updateMany(
      { _id: { $in: treatment_ids } },
      { $set: { nurse_id: nurse_id } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} ta muolajaga hamshira tayinlandi`,
      data: {
        modified_count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk assign nurse error:', error);
    res.status(500).json({
      success: false,
      message: 'Hamshiralarni tayinlashda xatolik',
      error: error.message
    });
  }
});

export default router;
