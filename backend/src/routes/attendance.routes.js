import express from 'express'
import Attendance from '../models/Attendance.js'
import StaffSalary from '../models/StaffSalary.js'
import Staff from '../models/Staff.js'
import Penalty from '../models/Penalty.js'
import CashierReport from '../models/CashierReport.js'
import Invoice from '../models/Invoice.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Helper: get today date range
const getTodayRange = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { today, tomorrow }
}

/**
 * Get today's attendance for current user
 * GET /api/v1/attendance/today
 */
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const { today, tomorrow } = getTodayRange()

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      check_in: { $gte: today, $lt: tomorrow }
    })

    res.json({ success: true, data: attendance })
  } catch (error) {
    next(error)
  }
})

/**
 * Check in
 * POST /api/v1/attendance/check-in
 */
router.post('/check-in', authenticate, async (req, res, next) => {
  try {
    const { today, tomorrow } = getTodayRange()

    const existing = await Attendance.findOne({
      staff: req.user.id,
      check_in: { $gte: today, $lt: tomorrow }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Siz bugun allaqachon kelish vaqtini belgilagansiz'
      })
    }

    const staffSalary = await StaffSalary.findOne({ staff_id: req.user.id })
    const checkInTime = new Date()
    let isLate = false
    let lateMinutes = 0
    let lateMessage = null
    let penaltyAmount = 0

    if (staffSalary && staffSalary.work_start_time) {
      const [startHour, startMinute] = staffSalary.work_start_time.split(':').map(Number)
      const expectedStartTime = new Date()
      expectedStartTime.setHours(startHour, startMinute, 0, 0)

      if (checkInTime > expectedStartTime) {
        isLate = true
        lateMinutes = Math.floor((checkInTime - expectedStartTime) / (1000 * 60))

        if (staffSalary.work_hours_per_month > 0 && staffSalary.base_salary > 0) {
          const hourlyRate = staffSalary.base_salary / staffSalary.work_hours_per_month
          penaltyAmount = Math.round(hourlyRate * (lateMinutes / 60))
        }

        const expectedTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
        const actualTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes()).padStart(2, '0')}`

        lateMessage = `Siz kech qoldingiz! Sizning ish vaqtingiz ${expectedTime} edi, siz ${actualTime} da keldingiz (${lateMinutes} daqiqa kechikish). Admin sizga jarima yozishi mumkin.`

        if (penaltyAmount > 0) {
          const currentDate = new Date()
          try {
            await Penalty.create({
              staff_id: req.user.id,
              amount: penaltyAmount,
              reason: `Kechikish: ${lateMinutes} daqiqa (${expectedTime} o'rniga ${actualTime} da keldi)`,
              penalty_type: 'late',
              month: currentDate.getMonth() + 1,
              year: currentDate.getFullYear(),
              status: 'pending',
              penalty_date: currentDate
            })
          } catch (_) {
            // Penalty creation failed silently
          }
        }
      }
    }

    const attendance = new Attendance({
      staff: req.user.id,
      check_in: checkInTime,
      status: isLate ? 'late' : 'present'
    })

    await attendance.save()

    res.json({
      success: true,
      message: isLate ? lateMessage : 'Kelish vaqti belgilandi',
      data: {
        attendance,
        isLate,
        lateMinutes,
        penaltyAmount: isLate ? penaltyAmount : 0
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Check out
 * POST /api/v1/attendance/check-out
 */
router.post('/check-out', authenticate, async (req, res, next) => {
  try {
    const { today, tomorrow } = getTodayRange()

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      check_in: { $gte: today, $lt: tomorrow }
    })

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Kelish vaqti topilmadi'
      })
    }

    if (attendance.check_out) {
      return res.status(400).json({
        success: false,
        message: 'Siz allaqachon ketish vaqtini belgilagansiz'
      })
    }

    const staffSalary = await StaffSalary.findOne({ staff_id: req.user.id })
    const staff = await Staff.findById(req.user.id)

    const checkOutTime = new Date()
    let isEarly = false
    let earlyMinutes = 0
    let earlyMessage = null
    let penaltyAmount = 0

    if (staffSalary && staffSalary.work_end_time) {
      const [endHour, endMinute] = staffSalary.work_end_time.split(':').map(Number)
      const expectedEndTime = new Date()
      expectedEndTime.setHours(endHour, endMinute, 0, 0)

      if (checkOutTime < expectedEndTime) {
        isEarly = true
        earlyMinutes = Math.floor((expectedEndTime - checkOutTime) / (1000 * 60))

        if (staffSalary.work_hours_per_month > 0 && staffSalary.base_salary > 0) {
          const hourlyRate = staffSalary.base_salary / staffSalary.work_hours_per_month
          penaltyAmount = Math.round(hourlyRate * (earlyMinutes / 60))
        }

        const expectedTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
        const actualTime = `${String(checkOutTime.getHours()).padStart(2, '0')}:${String(checkOutTime.getMinutes()).padStart(2, '0')}`

        earlyMessage = `Siz erta ketdingiz! Sizning ish vaqtingiz ${expectedTime} gacha edi, siz ${actualTime} da ketdingiz (${earlyMinutes} daqiqa erta). Admin sizga jarima yozishi mumkin.`

        if (penaltyAmount > 0) {
          const currentDate = new Date()
          try {
            await Penalty.create({
              staff_id: req.user.id,
              amount: penaltyAmount,
              reason: `Erta ketish: ${earlyMinutes} daqiqa (${expectedTime} o'rniga ${actualTime} da ketdi)`,
              penalty_type: 'late',
              month: currentDate.getMonth() + 1,
              year: currentDate.getFullYear(),
              status: 'pending',
              penalty_date: currentDate
            })
          } catch (_) {
            // Penalty creation failed silently
          }
        }
      }
    }

    attendance.check_out = checkOutTime
    await attendance.save()

    // Create cashier report if user is receptionist/admin
    if (staff && (staff.role === 'receptionist' || staff.role === 'admin')) {
      try {
        const invoices = await Invoice.find({
          created_by: req.user.id,
          created_at: { $gte: today, $lt: tomorrow }
        }).populate('patient_id', 'first_name last_name').lean()

        const stats = {
          total_invoices: invoices.length,
          paid_invoices: 0,
          unpaid_invoices: 0,
          partial_invoices: 0,
          total_amount: 0,
          paid_amount: 0,
          unpaid_amount: 0
        }

        const invoiceDetails = []

        invoices.forEach(invoice => {
          const totalAmount = parseFloat(invoice.total_amount || 0)
          const paidAmount = parseFloat(invoice.paid_amount || 0)

          stats.total_amount += totalAmount
          stats.paid_amount += paidAmount
          stats.unpaid_amount += (totalAmount - paidAmount)

          if (invoice.payment_status === 'paid') stats.paid_invoices++
          else if (invoice.payment_status === 'unpaid') stats.unpaid_invoices++
          else if (invoice.payment_status === 'partial') stats.partial_invoices++

          invoiceDetails.push({
            invoice_id: invoice._id,
            invoice_number: invoice.invoice_number,
            patient_name: invoice.patient_id
              ? `${invoice.patient_id.first_name} ${invoice.patient_id.last_name}`
              : 'N/A',
            total_amount: totalAmount,
            paid_amount: paidAmount,
            payment_status: invoice.payment_status,
            created_at: invoice.created_at
          })
        })

        const workDuration = Math.floor((checkOutTime - attendance.check_in) / (1000 * 60))

        await CashierReport.create({
          staff_id: req.user.id,
          date: today,
          check_in_time: attendance.check_in,
          check_out_time: checkOutTime,
          work_duration: workDuration,
          ...stats,
          invoices: invoiceDetails
        })
      } catch (_) {
        // Cashier report creation failed silently
      }
    }

    res.json({
      success: true,
      message: isEarly ? earlyMessage : 'Ketish vaqti belgilandi',
      data: {
        attendance,
        isEarly,
        earlyMinutes,
        penaltyAmount: isEarly ? penaltyAmount : 0
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Get attendance history (own)
 * GET /api/v1/attendance/history
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 30 } = req.query

    const filter = { staff: req.user.id }

    if (start_date || end_date) {
      filter.check_in = {}
      if (start_date) filter.check_in.$gte = new Date(start_date)
      if (end_date) filter.check_in.$lte = new Date(end_date)
    }

    const attendances = await Attendance.find(filter)
      .sort({ check_in: -1 })
      .limit(parseInt(limit))

    res.json({ success: true, data: attendances })
  } catch (error) {
    next(error)
  }
})

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all staff attendance for today
 * GET /api/v1/attendance/all-today
 */
router.get('/all-today',
  authenticate,
  authorize('admin', 'chief_doctor'),
  async (req, res, next) => {
    try {
      const { today, tomorrow } = getTodayRange()

      // Get all active staff
      const allStaff = await Staff.find({ status: 'active' })
        .select('first_name last_name role employee_id')
        .sort({ first_name: 1 })
        .lean()

      // Get today's attendance records
      const attendances = await Attendance.find({
        check_in: { $gte: today, $lt: tomorrow }
      }).lean()

      // Map attendance by staff_id
      const attendanceMap = {}
      attendances.forEach(a => {
        attendanceMap[a.staff.toString()] = a
      })

      // Merge: all staff with their attendance
      const data = allStaff.map(s => {
        const att = attendanceMap[s._id.toString()]
        return {
          staff_id: s._id,
          first_name: s.first_name,
          last_name: s.last_name,
          role: s.role,
          employee_id: s.employee_id,
          check_in: att?.check_in || null,
          check_out: att?.check_out || null,
          work_duration: att?.work_duration || 0,
          status: att ? att.status : 'absent'
        }
      })

      // Summary counts
      const summary = {
        total: allStaff.length,
        present: data.filter(d => d.status === 'present').length,
        late: data.filter(d => d.status === 'late').length,
        absent: data.filter(d => d.status === 'absent').length
      }

      res.json({ success: true, data, summary })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Get all staff attendance history (filterable)
 * GET /api/v1/attendance/all-history
 */
router.get('/all-history',
  authenticate,
  authorize('admin', 'chief_doctor'),
  async (req, res, next) => {
    try {
      const { start_date, end_date, staff_id, status, page = 1, limit = 50 } = req.query

      const filter = {}

      if (start_date || end_date) {
        filter.check_in = {}
        if (start_date) filter.check_in.$gte = new Date(start_date)
        if (end_date) {
          const endDate = new Date(end_date)
          endDate.setHours(23, 59, 59, 999)
          filter.check_in.$lte = endDate
        }
      }

      if (staff_id) filter.staff = staff_id
      if (status) filter.status = status

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const total = await Attendance.countDocuments(filter)

      const attendances = await Attendance.find(filter)
        .populate('staff', 'first_name last_name role employee_id')
        .sort({ check_in: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()

      const data = attendances.map(a => ({
        id: a._id,
        staff_id: a.staff?._id,
        first_name: a.staff?.first_name || "O'chirilgan",
        last_name: a.staff?.last_name || 'xodim',
        role: a.staff?.role || 'unknown',
        employee_id: a.staff?.employee_id || 'N/A',
        check_in: a.check_in,
        check_out: a.check_out,
        work_duration: a.work_duration,
        status: a.status,
        notes: a.notes
      }))

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Get attendance statistics for a month
 * GET /api/v1/attendance/stats
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'chief_doctor'),
  async (req, res, next) => {
    try {
      const { month, year } = req.query
      const now = new Date()
      const m = parseInt(month) || (now.getMonth() + 1)
      const y = parseInt(year) || now.getFullYear()

      const startDate = new Date(y, m - 1, 1)
      const endDate = new Date(y, m, 0, 23, 59, 59, 999)

      // Get all attendance for the month
      const attendances = await Attendance.find({
        check_in: { $gte: startDate, $lte: endDate }
      }).populate('staff', 'first_name last_name role employee_id').lean()

      // Get all active staff
      const allStaff = await Staff.find({ status: 'active' })
        .select('first_name last_name role employee_id')
        .lean()

      // Calculate working days in month (Mon-Sat)
      let workingDays = 0
      const tempDate = new Date(startDate)
      const todayDate = new Date()
      while (tempDate <= endDate && tempDate <= todayDate) {
        const day = tempDate.getDay()
        if (day !== 0) workingDays++ // 0 = Sunday
        tempDate.setDate(tempDate.getDate() + 1)
      }

      // Group by staff
      const staffMap = {}
      allStaff.forEach(s => {
        staffMap[s._id.toString()] = {
          staff_id: s._id,
          first_name: s.first_name,
          last_name: s.last_name,
          role: s.role,
          employee_id: s.employee_id,
          present_days: 0,
          late_days: 0,
          absent_days: 0,
          total_work_minutes: 0
        }
      })

      attendances.forEach(a => {
        const key = a.staff?._id?.toString()
        if (!key || !staffMap[key]) return

        if (a.status === 'present') staffMap[key].present_days++
        else if (a.status === 'late') staffMap[key].late_days++

        if (a.work_duration) staffMap[key].total_work_minutes += a.work_duration
      })

      // Calculate absent days
      Object.values(staffMap).forEach(s => {
        s.absent_days = Math.max(0, workingDays - s.present_days - s.late_days)
      })

      const staffStats = Object.values(staffMap).sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      )

      // Overall summary
      const totalPresent = staffStats.reduce((sum, s) => sum + s.present_days, 0)
      const totalLate = staffStats.reduce((sum, s) => sum + s.late_days, 0)
      const totalAbsent = staffStats.reduce((sum, s) => sum + s.absent_days, 0)

      res.json({
        success: true,
        data: {
          month: m,
          year: y,
          working_days: workingDays,
          staff_count: allStaff.length,
          summary: { total_present: totalPresent, total_late: totalLate, total_absent: totalAbsent },
          staff: staffStats
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
