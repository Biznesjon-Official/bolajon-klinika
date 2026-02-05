import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import AmbulatorQRTicket from '../models/AmbulatorQRTicket.js';
import AmbulatorCheckinLog from '../models/AmbulatorCheckinLog.js';
import AmbulatorPatientCall from '../models/AmbulatorPatientCall.js';
import AmbulatorDoctorNotification from '../models/AmbulatorDoctorNotification.js';
import AmbulatorComplaint from '../models/AmbulatorComplaint.js';
import Queue from '../models/Queue.js';
import Patient from '../models/Patient.js';

const router = express.Router();

// ============================================
// XONALAR
// ============================================

router.get('/rooms', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET AMBULATOR ROOMS (MongoDB) ===');
    
    const rooms = await AmbulatorRoom.find()
      .populate('current_patient_id', 'patient_number first_name last_name')
      .populate({
        path: 'current_queue_id',
        select: 'queue_number status'
      })
      .sort({ room_number: 1 })
      .lean();
    
    console.log('Found rooms:', rooms.length);
    
    // Format response
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      room_number: room.room_number,
      room_name: room.room_name,
      floor: room.floor,
      capacity: room.capacity,
      status: room.status,
      current_patient_id: room.current_patient_id?._id,
      current_queue_id: room.current_queue_id?._id,
      first_name: room.current_patient_id?.first_name,
      last_name: room.current_patient_id?.last_name,
      patient_number: room.current_patient_id?.patient_number,
      queue_number: room.current_queue_id?.queue_number,
      queue_status: room.current_queue_id?.status,
      equipment: room.equipment,
      notes: room.notes,
      created_at: room.createdAt,
      updated_at: room.updatedAt
    }));
    
    res.json({ success: true, data: formattedRooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    next(error);
  }
});

// ============================================
// QR CHEKLAR
// ============================================

router.post('/generate-qr', authenticate, authorize('admin', 'receptionist'), async (req, res, next) => {
  try {
    const { queue_id } = req.body;
    
    console.log('=== GENERATE QR (MongoDB) ===');
    console.log('Queue ID:', queue_id);
    
    // Get queue with patient info
    const queue = await Queue.findById(queue_id)
      .populate('patient_id', 'first_name last_name patient_number')
      .lean();
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Navbat topilmadi' });
    }
    
    const ticketNumber = `AMB-${Date.now()}-${queue.queue_number}`;
    
    const qrData = JSON.stringify({
      ticket_number: ticketNumber,
      queue_id,
      patient_name: `${queue.patient_id.first_name} ${queue.patient_id.last_name}`,
      patient_number: queue.patient_id.patient_number,
      queue_number: queue.queue_number,
      generated_at: new Date().toISOString()
    });
    
    // Create QR ticket
    const qrTicket = new AmbulatorQRTicket({
      queue_id,
      ticket_number: ticketNumber,
      qr_code: qrData,
      generated_by: req.user.id
    });
    
    await qrTicket.save();
    
    console.log('✅ QR ticket created:', ticketNumber);
    
    res.status(201).json({ success: true, data: qrTicket });
  } catch (error) {
    console.error('Generate QR error:', error);
    next(error);
  }
});

router.get('/qr-ticket/:queue_id', authenticate, async (req, res, next) => {
  try {
    const qrTicket = await AmbulatorQRTicket.findOne({
      queue_id: req.params.queue_id,
      is_active: true
    })
      .sort({ createdAt: -1 })
      .lean();
    
    if (!qrTicket) {
      return res.status(404).json({ success: false, message: 'QR chek topilmadi' });
    }
    
    res.json({ success: true, data: qrTicket });
  } catch (error) {
    console.error('Get QR ticket error:', error);
    next(error);
  }
});

// ============================================
// CHECK-IN/OUT
// ============================================

router.post('/checkin', authenticate, authorize('admin', 'receptionist', 'nurse'), async (req, res, next) => {
  try {
    const { ticket_number, room_id, action } = req.body;
    
    console.log('=== CHECKIN/OUT (MongoDB) ===');
    console.log('Ticket:', ticket_number, 'Room:', room_id, 'Action:', action);
    
    // Find ticket
    const ticket = await AmbulatorQRTicket.findOne({
      ticket_number,
      is_active: true
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'QR chek topilmadi' });
    }
    
    // Create checkin log
    const checkinLog = new AmbulatorCheckinLog({
      room_id,
      queue_id: ticket.queue_id,
      ticket_number,
      action,
      scanned_by: req.user.id
    });
    
    await checkinLog.save();
    
    // Update ticket if checkin
    if (action === 'checkin') {
      ticket.scanned_at = new Date();
      await ticket.save();
      
      // Update room status
      await AmbulatorRoom.findByIdAndUpdate(room_id, {
        status: 'occupied',
        current_queue_id: ticket.queue_id
      });
    } else if (action === 'checkout') {
      // Clear room
      await AmbulatorRoom.findByIdAndUpdate(room_id, {
        status: 'available',
        current_patient_id: null,
        current_queue_id: null
      });
    }
    
    const message = action === 'checkin' 
      ? 'Xona band qilindi' 
      : 'Xona bo\'shatildi va shifokorga xabar yuborildi';
    
    console.log('✅', message);
    
    res.json({ success: true, message, data: checkinLog });
  } catch (error) {
    console.error('Checkin error:', error);
    next(error);
  }
});

// ============================================
// BEMOR SIGNALLARI
// ============================================

router.post('/patient-call', authenticate, async (req, res, next) => {
  try {
    const { queue_id, room_id, call_type, priority } = req.body;
    
    console.log('=== PATIENT CALL (MongoDB) ===');
    console.log('Queue:', queue_id, 'Room:', room_id, 'Type:', call_type);
    
    const patientCall = new AmbulatorPatientCall({
      queue_id,
      room_id,
      call_type: call_type || 'assistance',
      priority: priority || 'normal'
    });
    
    await patientCall.save();
    
    console.log('✅ Patient call created');
    
    res.status(201).json({ 
      success: true, 
      message: 'Signal yuborildi. Shifokorga xabar yuborildi.',
      data: patientCall 
    });
  } catch (error) {
    console.error('Patient call error:', error);
    next(error);
  }
});

router.get('/patient-calls', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res, next) => {
  try {
    const { status } = req.query;
    
    console.log('=== GET PATIENT CALLS (MongoDB) ===');
    console.log('Status filter:', status);
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const calls = await AmbulatorPatientCall.find(query)
      .populate({
        path: 'queue_id',
        populate: {
          path: 'patient_id',
          select: 'first_name last_name patient_number'
        }
      })
      .populate('room_id', 'room_number room_name')
      .populate('responded_by', 'username first_name last_name')
      .sort({ call_time: -1 })
      .limit(50)
      .lean();
    
    console.log('Found calls:', calls.length);
    
    // Format response
    const formattedCalls = calls.map(call => ({
      id: call._id,
      queue_id: call.queue_id?._id,
      queue_number: call.queue_id?.queue_number,
      room_id: call.room_id?._id,
      room_number: call.room_id?.room_number,
      first_name: call.queue_id?.patient_id?.first_name,
      last_name: call.queue_id?.patient_id?.last_name,
      patient_number: call.queue_id?.patient_id?.patient_number,
      call_type: call.call_type,
      priority: call.priority,
      status: call.status,
      call_time: call.call_time,
      response_time: call.response_time,
      responded_by: call.responded_by?._id,
      responded_by_name: call.responded_by ? `${call.responded_by.first_name} ${call.responded_by.last_name}` : null,
      response_duration: call.response_duration,
      notes: call.notes
    }));
    
    res.json({ success: true, data: formattedCalls });
  } catch (error) {
    console.error('Get patient calls error:', error);
    next(error);
  }
});

router.put('/patient-call/:id/respond', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    
    const call = await AmbulatorPatientCall.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ success: false, message: 'Signal topilmadi' });
    }
    
    call.status = 'responded';
    call.response_time = new Date();
    call.responded_by = req.user.id;
    call.response_duration = Math.floor((call.response_time - call.call_time) / 1000);
    call.notes = notes;
    
    await call.save();
    
    console.log('✅ Call responded');
    
    res.json({ success: true, message: 'Javob berildi', data: call });
  } catch (error) {
    console.error('Respond to call error:', error);
    next(error);
  }
});

// ============================================
// SHIFOKOR XABARLARI
// ============================================

router.get('/doctor-notifications', authenticate, authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const { is_read } = req.query;
    
    console.log('=== GET DOCTOR NOTIFICATIONS (MongoDB) ===');
    console.log('Doctor ID:', req.user.id, 'Is read filter:', is_read);
    
    const query = { doctor_id: req.user.id };
    
    if (is_read !== undefined) {
      query.is_read = is_read === 'true';
    }
    
    const notifications = await AmbulatorDoctorNotification.find(query)
      .populate({
        path: 'queue_id',
        populate: {
          path: 'patient_id',
          select: 'first_name last_name'
        }
      })
      .populate('room_id', 'room_number')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    console.log('Found notifications:', notifications.length);
    
    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif._id,
      queue_id: notif.queue_id?._id,
      queue_number: notif.queue_id?.queue_number,
      room_id: notif.room_id?._id,
      room_number: notif.room_id?.room_number,
      first_name: notif.queue_id?.patient_id?.first_name,
      last_name: notif.queue_id?.patient_id?.last_name,
      notification_type: notif.notification_type,
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      is_read: notif.is_read,
      read_at: notif.read_at,
      created_at: notif.createdAt
    }));
    
    res.json({ success: true, data: formattedNotifications });
  } catch (error) {
    console.error('Get doctor notifications error:', error);
    next(error);
  }
});

router.put('/doctor-notification/:id/read', authenticate, authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const notification = await AmbulatorDoctorNotification.findOne({
      _id: req.params.id,
      doctor_id: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Xabar topilmadi' });
    }
    
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
    
    console.log('✅ Notification marked as read');
    
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    next(error);
  }
});

router.get('/doctor-notifications/unread/count', authenticate, authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const count = await AmbulatorDoctorNotification.countDocuments({
      doctor_id: req.user.id,
      is_read: false
    });
    
    res.json({ success: true, data: { unread_count: count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    next(error);
  }
});

// ============================================
// SHIKOYATLAR
// ============================================

router.post('/complaints', authenticate, async (req, res, next) => {
  try {
    const { queue_id, room_id, complaint_type, complaint_text, priority } = req.body;
    
    console.log('=== CREATE COMPLAINT (MongoDB) ===');
    console.log('Queue:', queue_id, 'Room:', room_id);
    
    const complaint = new AmbulatorComplaint({
      queue_id,
      room_id,
      complaint_type: complaint_type || 'service_issue',
      complaint_text,
      priority: priority || 'normal'
    });
    
    await complaint.save();
    
    console.log('✅ Complaint created');
    
    res.status(201).json({ 
      success: true, 
      message: 'Shikoyat yuborildi. Shifokorga xabar yuborildi.',
      data: complaint 
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    next(error);
  }
});

router.get('/complaints', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res, next) => {
  try {
    const { status } = req.query;
    
    console.log('=== GET COMPLAINTS (MongoDB) ===');
    console.log('Status filter:', status);
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const complaints = await AmbulatorComplaint.find(query)
      .populate({
        path: 'queue_id',
        populate: {
          path: 'patient_id',
          select: 'first_name last_name patient_number'
        }
      })
      .populate('room_id', 'room_number room_name')
      .populate('acknowledged_by', 'username first_name last_name')
      .populate('resolved_by', 'username first_name last_name')
      .sort({ submitted_at: -1 })
      .limit(50)
      .lean();
    
    console.log('Found complaints:', complaints.length);
    
    // Format response
    const formattedComplaints = complaints.map(comp => ({
      id: comp._id,
      queue_id: comp.queue_id?._id,
      queue_number: comp.queue_id?.queue_number,
      room_id: comp.room_id?._id,
      room_number: comp.room_id?.room_number,
      first_name: comp.queue_id?.patient_id?.first_name,
      last_name: comp.queue_id?.patient_id?.last_name,
      patient_number: comp.queue_id?.patient_id?.patient_number,
      complaint_type: comp.complaint_type,
      complaint_text: comp.complaint_text,
      priority: comp.priority,
      status: comp.status,
      submitted_at: comp.submitted_at,
      acknowledged_at: comp.acknowledged_at,
      acknowledged_by: comp.acknowledged_by?._id,
      acknowledged_by_name: comp.acknowledged_by?.username,
      resolved_at: comp.resolved_at,
      resolved_by: comp.resolved_by?._id,
      resolved_by_name: comp.resolved_by?.username,
      resolution_notes: comp.resolution_notes
    }));
    
    res.json({ success: true, data: formattedComplaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    next(error);
  }
});

router.put('/complaint/:id/acknowledge', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res, next) => {
  try {
    const complaint = await AmbulatorComplaint.findOne({
      _id: req.params.id,
      status: 'pending'
    });
    
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Shikoyat topilmadi' });
    }
    
    complaint.status = 'acknowledged';
    complaint.acknowledged_at = new Date();
    complaint.acknowledged_by = req.user.id;
    
    await complaint.save();
    
    console.log('✅ Complaint acknowledged');
    
    res.json({ success: true, message: 'Shikoyat qabul qilindi', data: complaint });
  } catch (error) {
    console.error('Acknowledge complaint error:', error);
    next(error);
  }
});

router.put('/complaint/:id/resolve', authenticate, authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const { resolution_notes } = req.body;
    
    const complaint = await AmbulatorComplaint.findOne({
      _id: req.params.id,
      status: { $in: ['pending', 'acknowledged'] }
    });
    
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Shikoyat topilmadi' });
    }
    
    complaint.status = 'resolved';
    complaint.resolved_at = new Date();
    complaint.resolved_by = req.user.id;
    complaint.resolution_notes = resolution_notes;
    
    await complaint.save();
    
    console.log('✅ Complaint resolved');
    
    res.json({ success: true, message: 'Shikoyat hal qilindi', data: complaint });
  } catch (error) {
    console.error('Resolve complaint error:', error);
    next(error);
  }
});

export default router;
