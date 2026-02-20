import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import AmbulatorRoom from '../models/AmbulatorRoom.js';

const router = express.Router();

// ============================================
// INPATIENT (STATSIONAR) ROOMS
// ============================================

router.get('/rooms', authenticate, async (req, res, next) => {
  try {
    const { floor } = req.query;
    
    console.log('=== GET INPATIENT ROOMS (MongoDB) ===');
    console.log('Floor:', floor);
    
    const query = { department: 'inpatient' };
    if (floor) query.floor = parseInt(floor);
    
    const rooms = await AmbulatorRoom.find(query)
      .populate('current_patient_id', 'patient_number first_name last_name')
      .populate('current_queue_id', 'queue_number status')
      .sort({ floor: 1, room_number: 1 })
      .lean();
    
    const Bed = (await import('../models/Bed.js')).default;
    
    const formattedRooms = await Promise.all(rooms.map(async (room) => {
      // Get beds for this room
      const beds = await Bed.find({ room_id: room._id })
        .populate('current_patient_id', 'patient_number first_name last_name')
        .sort({ bed_number: 1 })
        .lean();
      
      const availableBeds = beds.filter(b => b.status === 'available').length;
      
      return {
        id: room._id,
        room_number: room.room_number,
        room_name: room.room_name,
        floor_number: room.floor,
        room_type: 'standard',
        status: availableBeds === beds.length ? 'active' : (availableBeds === 0 ? 'occupied' : 'partial'),
        daily_rate: beds.length > 0 ? beds[0].daily_price : 200000, // Birinchi koyka narxi
        total_beds: room.capacity,
        available_beds: availableBeds,
        beds: beds.map(bed => ({
          id: bed._id,
          bed_number: bed.bed_number,
          bed_status: bed.status,
          status: bed.status,
          daily_price: bed.daily_price || 200000, // Har bir koyka narxi
          room_id: room._id,
          admission_id: bed.current_admission_id,
          patient_id: bed.current_patient_id?._id,
          first_name: bed.current_patient_id?.first_name,
          last_name: bed.current_patient_id?.last_name,
          patient_number: bed.current_patient_id?.patient_number,
          occupied_at: bed.occupied_at
        }))
      };
    }));
    
    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Get inpatient rooms error:', error);
    next(error);
  }
});

// Create inpatient room
router.post('/rooms', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { room_number, floor_number, room_type, daily_rate, bed_count, bed_prices } = req.body;
    
    console.log('=== CREATE INPATIENT ROOM (MongoDB) ===');
    console.log('Data:', { room_number, floor_number, room_type, bed_count, bed_prices });
    
    // Check if room already exists in inpatient department
    const existing = await AmbulatorRoom.findOne({ room_number, department: 'inpatient' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu xona raqami Stationarda allaqachon mavjud'
      });
    }
    
    // Create room
    const room = new AmbulatorRoom({
      room_number,
      room_name: `Xona ${room_number}`,
      floor: floor_number || 1,
      capacity: bed_count || 1,
      status: 'available',
      department: 'inpatient',
      equipment: []
    });
    
    await room.save();
    
    // Create beds for this room with individual prices
    const Bed = (await import('../models/Bed.js')).default;
    const beds = [];
    for (let i = 1; i <= (bed_count || 1); i++) {
      // Har bir koyka uchun narx - agar bed_prices massivida berilgan bo'lsa
      const bedPrice = bed_prices && bed_prices[i - 1] ? bed_prices[i - 1] : (daily_rate || 200000);
      
      beds.push({
        room_id: room._id,
        bed_number: i,
        daily_price: bedPrice,
        status: 'available'
      });
    }
    await Bed.insertMany(beds);
    
    console.log('✅ Inpatient room created with', bed_count, 'beds:', room.room_number);
    
    res.status(201).json({
      success: true,
      message: 'Xona muvaffaqiyatli yaratildi',
      data: {
        id: room._id,
        room_number: room.room_number,
        room_name: room.room_name,
        floor_number: room.floor,
        room_type: 'standard',
        status: 'active',
        daily_rate: daily_rate || 200000,
        total_beds: room.capacity,
        available_beds: room.capacity
      }
    });
  } catch (error) {
    console.error('Create inpatient room error:', error);
    next(error);
  }
});

// Update inpatient room
router.put('/rooms/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { room_number, floor_number, room_type, status } = req.body;
    
    console.log('=== UPDATE INPATIENT ROOM (MongoDB) ===');
    console.log('Room ID:', req.params.id);
    
    const room = await AmbulatorRoom.findOne({ _id: req.params.id, department: 'inpatient' });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Xona topilmadi'
      });
    }
    
    if (room_number) room.room_number = room_number;
    if (floor_number) room.floor = floor_number;
    if (status) {
      if (status === 'active') room.status = 'available';
      else if (status === 'maintenance') room.status = 'maintenance';
      else if (status === 'closed') room.status = 'closed';
    }
    
    await room.save();
    
    res.json({
      success: true,
      message: 'Xona yangilandi',
      data: {
        id: room._id,
        room_number: room.room_number,
        floor_number: room.floor,
        status: room.status === 'available' ? 'active' : room.status
      }
    });
  } catch (error) {
    console.error('Update inpatient room error:', error);
    next(error);
  }
});

// Delete inpatient room
router.delete('/rooms/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const room = await AmbulatorRoom.findOne({ _id: req.params.id, department: 'inpatient' });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Xona topilmadi'
      });
    }
    
    if (room.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Band xonani o\'chirish mumkin emas'
      });
    }
    
    await AmbulatorRoom.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Xona o\'chirildi'
    });
  } catch (error) {
    console.error('Delete inpatient room error:', error);
    next(error);
  }
});

// Inpatient stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET INPATIENT STATS (MongoDB) ===');
    
    const Admission = (await import('../models/Admission.js')).default;
    
    // Xonalar statistikasi - faqat inpatient
    const [total, available, occupied, maintenance] = await Promise.all([
      AmbulatorRoom.countDocuments({ department: 'inpatient' }),
      AmbulatorRoom.countDocuments({ department: 'inpatient', status: 'available' }),
      AmbulatorRoom.countDocuments({ department: 'inpatient', status: 'occupied' }),
      AmbulatorRoom.countDocuments({ department: 'inpatient', status: 'maintenance' })
    ]);
    
    // Koykalar statistikasi - faqat inpatient xonalardan
    const rooms = await AmbulatorRoom.find({ department: 'inpatient' }).lean();
    const totalBeds = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    const availableRooms = rooms.filter(r => r.status === 'available');
    const availableBeds = availableRooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');
    const occupiedBeds = occupiedRooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    const activeAdmissions = await Admission.countDocuments({ status: 'active' });
    
    res.json({
      success: true,
      data: {
        total_rooms: total,
        available_rooms: available,
        occupied_rooms: occupied,
        maintenance_rooms: maintenance,
        total_beds: totalBeds,
        available_beds: availableBeds,
        occupied_beds: occupiedBeds,
        active_admissions: activeAdmissions,
        pending_discharges: 0
      }
    });
  } catch (error) {
    console.error('Get inpatient stats error:', error);
    next(error);
  }
});

// Visual map
router.get('/visual-map', authenticate, async (req, res, next) => {
  try {
    const { floor } = req.query;
    
    const query = { department: 'inpatient' };
    if (floor) query.floor = parseInt(floor);
    
    const rooms = await AmbulatorRoom.find(query)
      .populate('current_patient_id', 'patient_number first_name last_name')
      .populate('current_queue_id', 'queue_number status')
      .lean();
    
    const floors = {};
    rooms.forEach(room => {
      const floorNum = room.floor || 1;
      if (!floors[floorNum]) {
        floors[floorNum] = [];
      }
      floors[floorNum].push({
        id: room._id,
        room_number: room.room_number,
        room_name: room.room_name,
        status: room.status,
        capacity: room.capacity,
        current_patient: room.current_patient_id ? {
          id: room.current_patient_id._id,
          patient_number: room.current_patient_id.patient_number,
          first_name: room.current_patient_id.first_name,
          last_name: room.current_patient_id.last_name
        } : null
      });
    });
    
    res.json({
      success: true,
      data: {
        floors,
        total_beds: rooms.length
      }
    });
  } catch (error) {
    console.error('Get inpatient visual map error:', error);
    next(error);
  }
});

// Other endpoints (treatments, calls, cabinets) - same as ambulator
router.get('/treatments', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/calls', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/medicine-cabinets', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// Update bed price
router.put('/beds/:id/price', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { daily_price } = req.body;
    
    if (!daily_price || daily_price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri narx'
      });
    }
    
    const Bed = (await import('../models/Bed.js')).default;
    const bed = await Bed.findById(req.params.id);
    
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Koyka topilmadi'
      });
    }
    
    bed.daily_price = daily_price;
    await bed.save();
    
    console.log('✅ Bed price updated:', bed._id, 'New price:', daily_price);
    
    res.json({
      success: true,
      message: 'Koyka narxi yangilandi',
      data: {
        id: bed._id,
        bed_number: bed.bed_number,
        daily_price: bed.daily_price
      }
    });
  } catch (error) {
    console.error('Update bed price error:', error);
    next(error);
  }
});

// ============================================
// BEDS ENDPOINTS
// ============================================

/**
 * Get all beds
 */
router.get('/beds', authenticate, async (req, res, next) => {
  try {
    const { status, room_id } = req.query;
    
    const Bed = (await import('../models/Bed.js')).default;
    
    const filter = {};
    if (status) filter.status = status;
    if (room_id) filter.room_id = room_id;
    
    const beds = await Bed.find(filter)
      .populate('room_id', 'room_number room_name floor department')
      .populate('current_patient_id', 'patient_number first_name last_name')
      .sort({ 'room_id.room_number': 1, bed_number: 1 })
      .lean();
    
    res.json({
      success: true,
      data: beds
    });
  } catch (error) {
    console.error('Get beds error:', error);
    next(error);
  }
});

// ============================================
// ADMISSIONS ENDPOINTS
// ============================================

/**
 * Get all admissions
 */
router.get('/admissions', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const Admission = (await import('../models/Admission.js')).default;
    
    const filter = {};
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .populate('patient_id', 'patient_number first_name last_name phone')
        .populate('bed_id', 'bed_number room_id')
        .sort({ admission_date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: admissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admissions error:', error);
    next(error);
  }
});

export default router;
