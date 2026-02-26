import express from 'express'
import { authenticate } from '../middleware/auth.js'
import Staff from '../models/Staff.js'
import Patient from '../models/Patient.js'
import Bonus from '../models/Bonus.js'
import Penalty from '../models/Penalty.js'
import MonthlyPayroll from '../models/MonthlyPayroll.js'
import StaffSalary from '../models/StaffSalary.js'

const router = express.Router()

// Dashboard statistikasi
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    const [
      totalPatients,
      totalStaff,
      todayPatients,
      totalDoctors,
      totalNurses,
      staffSalaries,
      monthlyPayrolls,
      allBonuses,
      allPenalties
    ] = await Promise.all([
      Patient.countDocuments({ status: 'active' }),
      Staff.countDocuments({ status: 'active' }),
      Patient.countDocuments({ registration_date: { $gte: today }, status: 'active' }),
      Staff.countDocuments({ role: 'doctor', status: 'active' }),
      Staff.countDocuments({ role: 'nurse', status: 'active' }),
      StaffSalary.find().lean(),
      MonthlyPayroll.find({ month: currentMonth, year: currentYear }).lean(),
      Bonus.find({ status: 'approved' }).lean(),
      Penalty.find({ status: 'approved' }).lean()
    ])

    const totalSalary = staffSalaries.reduce((sum, s) => {
      return sum + (s.base_salary || 0) + (s.position_bonus || 0) + (s.experience_bonus || 0)
    }, 0)

    const totalBonuses = allBonuses.reduce((sum, b) => sum + (b.amount || 0), 0)
    const totalPenalties = allPenalties.reduce((sum, p) => sum + (p.amount || 0), 0)

    res.json({
      totalPatients,
      todayAppointments: todayPatients,
      pendingPayments: 0,
      availableBeds: 0,
      totalBeds: 0,
      totalStaff,
      totalDoctors,
      totalNurses,
      patientsTrend: 5.2,
      appointmentsTrend: todayPatients,
      paymentsTrend: 0,
      totalSalary,
      paidSalaries: monthlyPayrolls.filter(p => p.status === 'paid').length,
      pendingSalaries: monthlyPayrolls.filter(p => p.status !== 'paid').length,
      totalBonuses,
      bonusesCount: allBonuses.length,
      totalPenalties,
      penaltiesCount: allPenalties.length,
      currentMonth,
      currentYear
    })
  } catch (error) {
    next(error)
  }
})

// Ogohlantirishlar
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const alerts = []

    alerts.push({
      type: 'success',
      message: 'Tizim MongoDB bilan ishlayapti',
      time: new Date().toLocaleTimeString('uz-UZ')
    })

    const patientCount = await Patient.countDocuments({ status: 'active' })
    if (patientCount === 0) {
      alerts.push({
        type: 'warning',
        message: "Hozircha bemorlar yo'q",
        time: new Date().toLocaleTimeString('uz-UZ')
      })
    }

    res.json(alerts)
  } catch (error) {
    next(error)
  }
})

// Bugungi navbat
router.get('/today-queue', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] })
  } catch (error) {
    next(error)
  }
})

// Dashboard root
router.get('/', authenticate, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments()
    res.json({ success: true, data: { total_patients: totalPatients, date: new Date() } })
  } catch (error) {
    res.json({ success: true, data: {} })
  }
})

export default router
