import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import AmbulatorRoom from '../models/AmbulatorRoom.js';

const router = express.Router();

// ============================================
// VISUAL MAP - Xonalar xaritasi
// ============================================

router.get('/visual-map', authenticate, async (req, res, next) => {
  try {
    const { floor } = req.query;
    
    console.log('=== GET VISUAL MAP (MongoDB) ===');
    console.log('Floor:', floor);
    
    const query = floor ? { floor: parseInt(floor) } : {};
    
    const rooms = await AmbulatorRoom.find(query)
      .populate('current_patient_id', 'patient_number first_name last_name')
      .populate('current_queue_id', 'queue_number status')
      .lean();
    
    // Group by floor
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
        } : null,
        queue: room.current_queue_id ? {
          queue_number: room.current_queue_id.queue_number,
          status: room.current_queue_id.status
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
    console.error('Get visual map error:', error);
    next(error);
  }
});

// ============================================
// ROOMS - Xonalar ro'yxati
// ============================================

router.get('/rooms', authenticate, async (req, res, next) => {
  try {
    const { floor } = req.query;
    
    console.log('=== GET AMBULATOR ROOMS (MongoDB) ===');
    console.log('Floor:', floor);
    
    const query = { department: 'ambulator' };
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
        hourly_rate: 0,
        total_beds: room.capacity,
        available_beds: availableBeds,
        beds: beds.map(bed => ({
          id: bed._id,
          bed_number: bed.bed_number,
          bed_status: bed.status,
          room_id: room._id,
          admission_id: bed.current_admission_id,
          patient_id: bed.current_patient_id?._id,
          first_name: bed.current_patient_id?.first_name,
          last_name: bed.current_patient_id?.last_name,
          patient_number: bed.current_patient_id?.patient_number
        }))
      };
    }));
    
    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    next(error);
  }
});

// Create room
router.post('/rooms', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { room_number, floor_number, room_type, hourly_rate, bed_count } = req.body;
    
    console.log('=== CREATE AMBULATOR ROOM (MongoDB) ===');
    console.log('Data:', { room_number, floor_number, room_type, bed_count });
    
    // Check if room already exists in ambulator department
    const existing = await AmbulatorRoom.findOne({ room_number, department: 'ambulator' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu xona raqami Ambulatorxonada allaqachon mavjud'
      });
    }
    
    // Create room
    const room = new AmbulatorRoom({
      room_number,
      room_name: `Xona ${room_number}`,
      floor: floor_number || 1,
      capacity: bed_count || 1,
      status: 'available',
      department: 'ambulator',
      equipment: []
    });
    
    await room.save();
    
    // Create beds for this room
    const Bed = (await import('../models/Bed.js')).default;
    const beds = [];
    for (let i = 1; i <= (bed_count || 1); i++) {
      beds.push({
        room_id: room._id,
        bed_number: i,
        status: 'available'
      });
    }
    await Bed.insertMany(beds);
    
    console.log('✅ Ambulator room created with', bed_count, 'beds:', room.room_number);
    
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
        hourly_rate: 0,
        total_beds: room.capacity,
        available_beds: room.capacity
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    next(error);
  }
});

// Update room
router.put('/rooms/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { room_number, floor_number, room_type, status } = req.body;
    
    console.log('=== UPDATE ROOM (MongoDB) ===');
    console.log('Room ID:', req.params.id);
    console.log('Data:', { room_number, floor_number, status });
    
    const room = await AmbulatorRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Xona topilmadi'
      });
    }
    
    // Update fields
    if (room_number) room.room_number = room_number;
    if (floor_number) room.floor = floor_number;
    if (status) {
      // Convert status
      if (status === 'active') room.status = 'available';
      else if (status === 'maintenance') room.status = 'maintenance';
      else if (status === 'closed') room.status = 'closed';
    }
    
    await room.save();
    
    console.log('✅ Room updated:', room.room_number);
    
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
    console.error('Update room error:', error);
    next(error);
  }
});

// Delete room
router.delete('/rooms/:id', authenticate, async (req, res, next) => {
  try {
    console.log('=== DELETE ROOM (MongoDB) ===');
    console.log('Room ID:', req.params.id);
    
    const room = await AmbulatorRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Xona topilmadi'
      });
    }
    
    // Check if room is occupied
    if (room.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Band xonani o\'chirish mumkin emas'
      });
    }
    
    await AmbulatorRoom.findByIdAndDelete(req.params.id);
    
    console.log('✅ Room deleted:', room.room_number);
    
    res.json({
      success: true,
      message: 'Xona o\'chirildi'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    next(error);
  }
});

// ============================================
// STATS - Statistika
// ============================================

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET AMBULATOR STATS (MongoDB) ===');
    
    const Admission = (await import('../models/Admission.js')).default;
    
    // Xonalar statistikasi - faqat ambulator
    const [total, available, occupied, maintenance] = await Promise.all([
      AmbulatorRoom.countDocuments({ department: 'ambulator' }),
      AmbulatorRoom.countDocuments({ department: 'ambulator', status: 'available' }),
      AmbulatorRoom.countDocuments({ department: 'ambulator', status: 'occupied' }),
      AmbulatorRoom.countDocuments({ department: 'ambulator', status: 'maintenance' })
    ]);
    
    // Koykalar statistikasi - faqat ambulator xonalardan
    const rooms = await AmbulatorRoom.find({ department: 'ambulator' }).lean();
    const totalBeds = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    // Bo'sh koykalar - available xonalardagi koykalar
    const availableRooms = rooms.filter(r => r.status === 'available');
    const availableBeds = availableRooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    // Band koykalar - occupied xonalardagi koykalar
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');
    const occupiedBeds = occupiedRooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    
    // Faol bemorlar soni
    const activeAdmissions = await Admission.countDocuments({ status: 'active' });
    
    res.json({
      success: true,
      data: {
        // Xonalar
        total_rooms: total,
        available_rooms: available,
        occupied_rooms: occupied,
        maintenance_rooms: maintenance,
        // Koykalar
        total_beds: totalBeds,
        available_beds: availableBeds,
        occupied_beds: occupiedBeds,
        // Bemorlar
        active_admissions: activeAdmissions,
        pending_discharges: 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    next(error);
  }
});

// ============================================
// TREATMENTS - Davolanish jadvali
// ============================================

router.get('/treatments', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET TREATMENTS (MongoDB) ===');
    
    // Hozircha bo'sh array qaytaramiz
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get treatments error:', error);
    next(error);
  }
});

// ============================================
// CALLS - Bemor chaqiruvlari
// ============================================

router.get('/calls', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET CALLS (MongoDB) ===');
    
    // Hozircha bo'sh array qaytaramiz
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get calls error:', error);
    next(error);
  }
});

// ============================================
// MEDICINE CABINETS - Dori shkaflar
// ============================================

router.get('/medicine-cabinets', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET MEDICINE CABINETS (MongoDB) ===');
    
    // Hozircha bo'sh array qaytaramiz
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get medicine cabinets error:', error);
    next(error);
  }
});

// ============================================
// ADMISSIONS - Yotqizish
// ============================================

router.get('/admissions', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET ADMISSIONS (MongoDB) ===');
    
    const Admission = (await import('../models/Admission.js')).default;
    
    const admissions = await Admission.find({ status: 'active' })
      .populate('patient_id', 'patient_number first_name last_name phone')
      .populate('room_id', 'room_number room_name')
      .sort({ admission_date: -1 })
      .lean();
    
    const formattedAdmissions = admissions.map(adm => ({
      id: adm._id,
      patient_id: adm.patient_id?._id,
      patient_number: adm.patient_id?.patient_number,
      first_name: adm.patient_id?.first_name,
      last_name: adm.patient_id?.last_name,
      phone: adm.patient_id?.phone,
      room_id: adm.room_id?._id,
      room_number: adm.room_id?.room_number,
      room_name: adm.room_id?.room_name,
      bed_number: adm.bed_number,
      admission_date: adm.admission_date,
      discharge_date: adm.discharge_date,
      status: adm.status,
      diagnosis: adm.diagnosis,
      notes: adm.notes
    }));
    
    res.json({
      success: true,
      data: formattedAdmissions
    });
  } catch (error) {
    console.error('Get admissions error:', error);
    next(error);
  }
});

router.post('/admissions', authenticate, async (req, res, next) => {
  try {
    const { patient_id, room_id, bed_number, diagnosis, notes } = req.body;
    
    console.log('=== CREATE ADMISSION (MongoDB) ===');
    console.log('Request body:', req.body);
    console.log('Data:', { patient_id, room_id, bed_number, diagnosis, notes });
    
    if (!patient_id || !room_id || bed_number === undefined || bed_number === null) {
      console.log('❌ Validation failed:', { patient_id, room_id, bed_number });
      return res.status(400).json({
        success: false,
        message: 'Bemor, xona va ko\'rpa raqami majburiy',
        details: { patient_id, room_id, bed_number }
      });
    }
    
    const Admission = (await import('../models/Admission.js')).default;
    const Bed = (await import('../models/Bed.js')).default;
    
    // Check if patient already has an active admission
    const existingAdmission = await Admission.findOne({
      patient_id,
      status: 'active'
    });
    
    if (existingAdmission) {
      console.log('❌ Patient already admitted:', existingAdmission);
      return res.status(400).json({
        success: false,
        message: 'Bu bemor allaqachon yotqizilgan. Avval chiqarib, keyin qayta yotqizing.',
        existing_admission: {
          room_id: existingAdmission.room_id,
          bed_number: existingAdmission.bed_number,
          admission_date: existingAdmission.admission_date
        }
      });
    }
    
    // Check if room exists
    const room = await AmbulatorRoom.findById(room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Xona topilmadi'
      });
    }
    
    // Find or create the specific bed
    let bed = await Bed.findOne({ room_id, bed_number });
    
    if (!bed) {
      // Auto-create bed if it doesn't exist (for old rooms)
      console.log('⚠️ Bed not found, creating automatically...');
      bed = new Bed({
        room_id,
        bed_number,
        daily_price: 200000, // Default narx
        status: 'available'
      });
      await bed.save();
      console.log('✅ Bed auto-created:', bed._id);
    }
    
    if (bed.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Bu koyka band'
      });
    }
    
    // Create admission
    const admission = new Admission({
      patient_id,
      room_id,
      bed_number,
      bed_id: bed._id,
      bed_daily_price: bed.daily_price || 200000,
      admission_type: room.department === 'ambulator' ? 'outpatient' : 'inpatient',
      diagnosis: diagnosis || '',
      notes: notes || '',
      admitted_by: req.user.id,
      admission_date: new Date(),
      status: 'active'
    });
    
    await admission.save();
    
    // Update bed status
    bed.status = 'occupied';
    bed.current_patient_id = patient_id;
    bed.current_admission_id = admission._id;
    bed.occupied_at = new Date();
    await bed.save();
    
    // Update room status if all beds are occupied
    const allBeds = await Bed.find({ room_id });
    const allOccupied = allBeds.every(b => b.status === 'occupied');
    if (allOccupied) {
      room.status = 'occupied';
      await room.save();
    }
    
    console.log('✅ Admission created:', admission._id, 'Bed:', bed_number, 'Daily price:', bed.daily_price);
    
    // Update all pending TreatmentSchedules for this patient with admission_id
    const TreatmentSchedule = (await import('../models/TreatmentSchedule.js')).default;
    const Task = (await import('../models/Task.js')).default;
    
    const updatedSchedules = await TreatmentSchedule.updateMany(
      { 
        patient_id,
        status: 'pending',
        admission_id: null
      },
      { 
        $set: { admission_id: admission._id }
      }
    );
    
    const updatedTasks = await Task.updateMany(
      { 
        patient_id,
        status: 'pending',
        admission_id: null
      },
      { 
        $set: { admission_id: admission._id }
      }
    );
    
    console.log(`✅ Updated ${updatedSchedules.modifiedCount} TreatmentSchedules with admission_id`);
    console.log(`✅ Updated ${updatedTasks.modifiedCount} Tasks with admission_id`);
    
    res.status(201).json({
      success: true,
      message: 'Bemor muvaffaqiyatli yotqizildi',
      data: {
        id: admission._id,
        patient_id: admission.patient_id,
        room_id: admission.room_id,
        bed_number: admission.bed_number,
        bed_daily_price: admission.bed_daily_price,
        admission_date: admission.admission_date,
        status: admission.status
      }
    });
  } catch (error) {
    console.error('Create admission error:', error);
    next(error);
  }
});

router.post('/admissions/:id/discharge', authenticate, async (req, res, next) => {
  try {
    console.log('=== DISCHARGE ADMISSION (MongoDB) ===');
    console.log('Admission ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const Admission = (await import('../models/Admission.js')).default;
    const Bed = (await import('../models/Bed.js')).default;
    const Patient = (await import('../models/Patient.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;
    
    const admission = await Admission.findById(req.params.id);
    
    console.log('Found admission:', admission ? 'YES' : 'NO');
    if (admission) {
      console.log('Admission status:', admission.status);
      console.log('Admission patient_id:', admission.patient_id);
      console.log('Admission room_id:', admission.room_id);
    }
    
    if (!admission) {
      console.log('❌ Admission not found');
      return res.status(404).json({
        success: false,
        message: 'Yotqizish ma\'lumoti topilmadi'
      });
    }
    
    if (admission.status !== 'active') {
      console.log('❌ Admission status is not active:', admission.status);
      return res.status(400).json({
        success: false,
        message: `Bemor allaqachon chiqarilgan yoki faol emas. Status: ${admission.status}`
      });
    }
    
    const dischargeDate = new Date();
    const admissionDate = new Date(admission.admission_date);
    
    // Soatlar farqini hisoblash
    const hoursDiff = (dischargeDate - admissionDate) / (1000 * 60 * 60);
    
    // Kunlarni hisoblash:
    // 0-12 soat = 0 kun
    // 12-24 soat = 1 kun
    // 24-48 soat = 2 kun (24 soatdan oshsa)
    // 48-72 soat = 3 kun
    // va hokazo...
    let totalDays = 0;
    if (hoursDiff < 12) {
      totalDays = 0;
    } else if (hoursDiff <= 24) {
      totalDays = 1;
    } else {
      // 24 soatdan oshgan har 24 soat uchun 1 kun qo'shish
      totalDays = 1 + Math.ceil((hoursDiff - 24) / 24);
    }
    
    // Koyka to'lovini hisoblash
    const bedDailyPrice = admission.bed_daily_price || 200000;
    const totalBedCharges = totalDays * bedDailyPrice;
    
    console.log('📊 Bed charges calculation:');
    console.log('  Admission date:', admissionDate.toLocaleString('uz-UZ'));
    console.log('  Discharge date:', dischargeDate.toLocaleString('uz-UZ'));
    console.log('  Hours stayed:', hoursDiff.toFixed(2));
    console.log('  Total days:', totalDays);
    console.log('  Daily price:', bedDailyPrice);
    console.log('  Total charges:', totalBedCharges);
    
    // Update admission
    admission.status = 'discharged';
    admission.discharge_date = dischargeDate;
    admission.total_days = totalDays;
    admission.total_bed_charges = totalBedCharges;
    
    // Invoice yaratish (faqat to'lov bo'lsa)
    if (totalBedCharges > 0) {
      // Invoice number yaratish
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(invoiceCount + 1).padStart(5, '0')}`;
      
      const invoice = new Invoice({
        invoice_number: invoiceNumber,
        patient_id: admission.patient_id,
        admission_id: admission._id,
        items: [{
          item_type: 'bed_charge',
          description: `Koyka to'lovi - Xona ${admission.room_id}, Koyka ${admission.bed_number}`,
          quantity: totalDays,
          unit_price: bedDailyPrice,
          total_price: totalBedCharges
        }],
        subtotal: totalBedCharges,
        tax: 0,
        discount: 0,
        total_amount: totalBedCharges,
        paid_amount: 0,
        payment_status: 'pending',
        created_by: req.user.id,
        created_at: new Date()
      });
      
      await invoice.save();
      admission.bed_charges_invoice_id = invoice._id;
      
      console.log('✅ Invoice created:', invoice.invoice_number, 'Amount:', totalBedCharges);
      
      // Bemorning qarziga qo'shish
      const patient = await Patient.findById(admission.patient_id);
      if (patient) {
        patient.total_debt = (patient.total_debt || 0) + totalBedCharges;
        await patient.save();
        console.log('✅ Patient debt updated:', patient.total_debt);
      }
    }
    
    await admission.save();
    
    // Free the specific bed
    const bed = await Bed.findOne({ 
      room_id: admission.room_id, 
      bed_number: admission.bed_number 
    });
    
    if (bed) {
      bed.status = 'available';
      bed.current_patient_id = null;
      bed.current_admission_id = null;
      bed.released_at = dischargeDate;
      await bed.save();
    }
    
    // Update room status if any bed is available
    const room = await AmbulatorRoom.findById(admission.room_id);
    if (room) {
      const allBeds = await Bed.find({ room_id: room._id });
      const anyAvailable = allBeds.some(b => b.status === 'available');
      if (anyAvailable) {
        room.status = 'available';
        room.current_patient_id = null;
        await room.save();
      }
    }
    
    console.log('✅ Admission discharged:', admission._id, 'Bed:', admission.bed_number);
    
    res.json({
      success: true,
      message: 'Bemor muvaffaqiyatli chiqarildi',
      data: {
        admission_id: admission._id,
        total_days: totalDays,
        total_bed_charges: totalBedCharges,
        invoice_id: admission.bed_charges_invoice_id,
        hours_stayed: hoursDiff.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Discharge admission error:', error);
    next(error);
  }
});

// ============================================
// COMPLAINTS - Shikoyatlar
// ============================================

router.get('/complaints', authenticate, async (req, res, next) => {
  try {
    console.log('=== GET COMPLAINTS (MongoDB) ===');
    
    // Hozircha bo'sh array qaytaramiz
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    next(error);
  }
});

export default router;
