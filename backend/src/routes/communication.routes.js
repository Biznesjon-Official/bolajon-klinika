import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Communication from '../models/Communication.js';
import Patient from '../models/Patient.js';

const router = express.Router();

/**
 * Send SMS
 */
router.post('/sms/send',
  authenticate,
  authorize('admin', 'doctor', 'nurse'),
  async (req, res, next) => {
    try {
      const { patient_id, recipient_phone, message, template_id, metadata } = req.body;

      if (!patient_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and message are required'
        });
      }

      // Get patient info - try both ObjectId and patient_number
      let patient;
      
      // Check if patient_id is a valid ObjectId
      if (patient_id.match(/^[0-9a-fA-F]{24}$/)) {
        patient = await Patient.findById(patient_id);
      } else {
        // Search by patient_number
        patient = await Patient.findOne({ patient_number: patient_id });
      }

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Create communication log
      const communication = await Communication.create({
        patient_id: patient._id,
        recipient_name: `${patient.first_name} ${patient.last_name}`,
        recipient_phone: recipient_phone || patient.phone,
        channel: 'sms',
        content: message,
        status: 'sent', // In real app, this would be 'pending' until SMS provider confirms
        template_id,
        metadata: metadata || {},
        sent_at: new Date()
      });

      // TODO: Integrate with SMS provider (Eskiz.uz, Playmobile, etc.)
      // For now, we just log it

      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: communication
      });
    } catch (error) {
      console.error('Send SMS error:', error);
      next(error);
    }
  }
);

/**
 * Send Telegram message
 */
router.post('/telegram/send',
  authenticate,
  authorize('admin', 'doctor', 'nurse'),
  async (req, res, next) => {
    try {
      const { patient_id, message, template_id, metadata } = req.body;

      if (!patient_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and message are required'
        });
      }

      // Get patient info - try both ObjectId and patient_number
      let patient;
      
      // Check if patient_id is a valid ObjectId
      if (patient_id.match(/^[0-9a-fA-F]{24}$/)) {
        patient = await Patient.findById(patient_id);
      } else {
        // Search by patient_number
        patient = await Patient.findOne({ patient_number: patient_id });
      }

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Create communication log
      const communication = await Communication.create({
        patient_id: patient._id,
        recipient_name: `${patient.first_name} ${patient.last_name}`,
        recipient_phone: patient.phone,
        channel: 'telegram',
        content: message,
        status: 'sent',
        template_id,
        metadata: metadata || {},
        sent_at: new Date()
      });

      // TODO: Integrate with Telegram Bot API
      // For now, we just log it

      res.json({
        success: true,
        message: 'Telegram message sent successfully',
        data: communication
      });
    } catch (error) {
      console.error('Send Telegram error:', error);
      next(error);
    }
  }
);

/**
 * Get communication logs
 */
router.get('/logs',
  authenticate,
  authorize('admin', 'doctor', 'nurse'),
  async (req, res, next) => {
    try {
      const { limit = 50, channel, status, patient_id } = req.query;

      const filter = {};
      if (channel) filter.channel = channel;
      if (status) filter.status = status;
      if (patient_id) filter.patient_id = patient_id;

      const logs = await Communication.find(filter)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .populate('patient_id', 'first_name last_name patient_number phone')
        .lean();

      // Format logs
      const formattedLogs = logs.map(log => ({
        id: log._id,
        patient_id: log.patient_id?._id,
        recipient_name: log.recipient_name || (log.patient_id ? `${log.patient_id.first_name} ${log.patient_id.last_name}` : 'N/A'),
        recipient_phone: log.recipient_phone || log.patient_id?.phone || 'N/A',
        channel: log.channel,
        content: log.content,
        status: log.status,
        created_at: log.created_at,
        sent_at: log.sent_at,
        delivered_at: log.delivered_at,
        read_at: log.read_at,
        error_message: log.error_message
      }));

      res.json({
        success: true,
        data: formattedLogs
      });
    } catch (error) {
      console.error('Get logs error:', error);
      next(error);
    }
  }
);

/**
 * Get communication statistics
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'doctor', 'nurse'),
  async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's stats
      const [
        totalToday,
        smsCount,
        telegramCount,
        sentCount,
        failedCount
      ] = await Promise.all([
        Communication.countDocuments({ created_at: { $gte: today } }),
        Communication.countDocuments({ created_at: { $gte: today }, channel: 'sms' }),
        Communication.countDocuments({ created_at: { $gte: today }, channel: 'telegram' }),
        Communication.countDocuments({ created_at: { $gte: today }, status: 'sent' }),
        Communication.countDocuments({ created_at: { $gte: today }, status: 'failed' })
      ]);

      res.json({
        success: true,
        data: {
          total: totalToday,
          sms_count: smsCount,
          telegram_count: telegramCount,
          sent_count: sentCount,
          failed_count: failedCount
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      next(error);
    }
  }
);

/**
 * Delete last 3 communications (for testing)
 */
router.delete('/delete-last-3',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const lastThree = await Communication.find()
        .sort({ created_at: -1 })
        .limit(3)
        .select('_id');

      const ids = lastThree.map(c => c._id);
      
      await Communication.deleteMany({ _id: { $in: ids } });

      res.json({
        success: true,
        message: 'Last 3 communications deleted',
        deleted_count: ids.length
      });
    } catch (error) {
      console.error('Delete last 3 error:', error);
      next(error);
    }
  }
);

export default router;
