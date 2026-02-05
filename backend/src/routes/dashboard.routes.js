import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';
import Bonus from '../models/Bonus.js';
import Penalty from '../models/Penalty.js';
import MonthlyPayroll from '../models/MonthlyPayroll.js';
import StaffSalary from '../models/StaffSalary.js';

const router = express.Router();

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Dashboard routes working with MongoDB!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard statistikasi
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    // Jami bemorlar
    const totalPatients = await Patient.countDocuments({ status: 'active' });
    
    // Jami xodimlar (StaffSalary collection'dan - maosh belgilangan xodimlar)
    const staffSalaries = await StaffSalary.find().lean();
    const totalStaff = staffSalaries.length;
    
    // Bugungi yangi bemorlar
    const todayPatients = await Patient.countDocuments({
      registration_date: { $gte: today },
      status: 'active'
    });
    
    // Shifokorlar soni
    const totalDoctors = await Staff.countDocuments({ 
      role: 'doctor',
      status: 'active'
    });
    
    // Hamshiralar soni
    const totalNurses = await Staff.countDocuments({ 
      role: 'nurse',
      status: 'active'
    });
    
    // Jami maosh (StaffSalary collection'dan - base_salary + bonuslar)
    const totalSalary = staffSalaries.reduce((sum, s) => {
      return sum + (s.base_salary || 0) + (s.position_bonus || 0) + (s.experience_bonus || 0);
    }, 0);
    
    // Joriy oylik maoshlar (to'langan/kutilayotgan)
    const monthlyPayrolls = await MonthlyPayroll.find({
      month: currentMonth,
      year: currentYear
    }).lean();
    
    const paidSalaries = monthlyPayrolls.filter(p => p.status === 'paid').length;
    const pendingSalaries = monthlyPayrolls.filter(p => p.status !== 'paid').length;
    
    // Barcha bonuslar (Bonuslar tab'idan)
    const allBonuses = await Bonus.find({
      status: 'approved'
    }).lean();
    
    const totalBonuses = allBonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
    const bonusesCount = allBonuses.length;
    
    // Barcha jarimalar (Jarimalar tab'idan)
    const allPenalties = await Penalty.find({
      status: 'approved'
    }).lean();
    
    const totalPenalties = allPenalties.reduce((sum, p) => sum + (p.amount || 0), 0);
    const penaltiesCount = allPenalties.length;
    
    const stats = {
      totalPatients: totalPatients,
      todayAppointments: todayPatients,
      pendingPayments: 0, // Hozircha 0
      availableBeds: 0, // Hozircha 0
      totalBeds: 0, // Hozircha 0
      totalStaff: totalStaff,
      totalDoctors: totalDoctors,
      totalNurses: totalNurses,
      patientsTrend: 5.2,
      appointmentsTrend: todayPatients,
      paymentsTrend: 0,
      // Payroll statistics (from Xodimlar maoshi, Bonuslar, Jarimalar tabs)
      totalSalary: totalSalary,
      paidSalaries: paidSalaries,
      pendingSalaries: pendingSalaries,
      totalBonuses: totalBonuses,
      bonusesCount: bonusesCount,
      totalPenalties: totalPenalties,
      penaltiesCount: penaltiesCount,
      currentMonth: currentMonth,
      currentYear: currentYear
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    // Return mock data on error
    const mockStats = {
      totalPatients: 0,
      todayAppointments: 0,
      pendingPayments: 0,
      availableBeds: 0,
      totalBeds: 0,
      totalStaff: 1,
      totalDoctors: 0,
      totalNurses: 0,
      patientsTrend: 0,
      appointmentsTrend: 0,
      paymentsTrend: 0,
      totalSalary: 0,
      paidSalaries: 0,
      pendingSalaries: 0,
      totalBonuses: 0,
      bonusesCount: 0,
      totalPenalties: 0,
      penaltiesCount: 0,
      error: error.message
    };
    res.json(mockStats);
  }
});

// Ogohlantirishlar
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const alerts = [];
    
    // MongoDB bilan ishlayotganini ko'rsatish
    alerts.push({
      type: 'success',
      message: 'Tizim MongoDB bilan ishlayapti',
      time: new Date().toLocaleTimeString('uz-UZ')
    });
    
    // Bemorlar sonini tekshirish
    const patientCount = await Patient.countDocuments({ status: 'active' });
    if (patientCount === 0) {
      alerts.push({
        type: 'warning',
        message: 'Hozircha bemorlar yo\'q',
        time: new Date().toLocaleTimeString('uz-UZ')
      });
    }
    
    res.json(alerts);
  } catch (error) {
    console.error('Alerts error:', error);
    res.json([{
      type: 'error',
      message: 'Ogohlantirishlarni yuklashda xatolik: ' + error.message,
      time: new Date().toLocaleTimeString('uz-UZ')
    }]);
  }
});

// Bugungi navbat (hozircha bo'sh)
router.get('/today-queue', authenticate, async (req, res) => {
  try {
    // Hozircha bo'sh array qaytaramiz
    // Keyinchalik Queue modelini yaratib, bu yerda ishlatamiz
    
    res.json({
      success: true,
      data: [],
      message: 'Queue system hali MongoDB\'ga o\'tkazilmagan'
    });
  } catch (error) {
    console.error('Today queue error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server xatosi', 
      message: error.message 
    });
  }
});

export default router;
