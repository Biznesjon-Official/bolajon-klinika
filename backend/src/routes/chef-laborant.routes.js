import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import LabOrder from '../models/LabOrder.js'
import LabTest from '../models/LabTest.js'
import Staff from '../models/Staff.js'

const router = express.Router()

// GET /api/v1/chef-laborant/dashboard
router.get('/dashboard', authenticate, authorize('chef_laborant', 'admin'), async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalPending,
      todayCompleted,
      todayOverdue,
      totalTests,
      totalLaborants,
      todayOrders
    ] = await Promise.all([
      LabOrder.countDocuments({ status: 'pending' }),
      LabOrder.countDocuments({
        status: { $in: ['completed', 'approved'] },
        completed_at: { $gte: today, $lt: tomorrow }
      }),
      LabOrder.countDocuments({
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      LabTest.countDocuments({ is_active: true }),
      Staff.countDocuments({ role: 'laborant', status: 'active' }),
      LabOrder.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } })
    ])

    // TAT o'rtacha (oxirgi 7 kun)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const tatData = await LabOrder.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'approved'] },
          completed_at: { $gte: weekAgo }
        }
      },
      {
        $project: {
          tat: {
            $divide: [
              { $subtract: ['$completed_at', '$createdAt'] },
              60000
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avg_tat: { $avg: '$tat' },
          min_tat: { $min: '$tat' },
          max_tat: { $max: '$tat' }
        }
      }
    ])

    // Status bo'yicha taqsimot
    const statusDistribution = await LabOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      data: {
        stats: {
          total_pending: totalPending,
          today_completed: todayCompleted,
          today_overdue: todayOverdue,
          total_tests: totalTests,
          total_laborants: totalLaborants,
          today_orders: todayOrders
        },
        tat: tatData[0] || { avg_tat: 0, min_tat: 0, max_tat: 0 },
        status_distribution: statusDistribution
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/v1/chef-laborant/laborant-performance
router.get('/laborant-performance', authenticate, authorize('chef_laborant', 'admin'), async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Barcha laborantlar
    const laborants = await Staff.find({ role: 'laborant', status: 'active' })
      .select('first_name last_name phone')
      .lean()

    // Har bir laborantning performance
    const performance = await Promise.all(
      laborants.map(async (lab) => {
        const [todayCompleted, totalCompleted, pendingCount, avgTat] = await Promise.all([
          LabOrder.countDocuments({
            completed_by: lab._id,
            completed_at: { $gte: today, $lt: tomorrow }
          }),
          LabOrder.countDocuments({
            completed_by: lab._id,
            status: { $in: ['completed', 'approved'] }
          }),
          LabOrder.countDocuments({
            laborant_id: lab._id,
            status: { $in: ['pending', 'sample_collected', 'in_progress'] }
          }),
          LabOrder.aggregate([
            {
              $match: {
                completed_by: lab._id,
                status: { $in: ['completed', 'approved'] },
                completed_at: { $exists: true }
              }
            },
            {
              $project: {
                tat: {
                  $divide: [
                    { $subtract: ['$completed_at', '$createdAt'] },
                    60000
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                avg_tat: { $avg: '$tat' }
              }
            }
          ])
        ])

        return {
          _id: lab._id,
          name: `${lab.first_name} ${lab.last_name}`,
          phone: lab.phone,
          today_completed: todayCompleted,
          total_completed: totalCompleted,
          pending: pendingCount,
          avg_tat: Math.round(avgTat[0]?.avg_tat || 0)
        }
      })
    )

    res.json({
      success: true,
      data: performance
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/v1/chef-laborant/all-orders
router.get('/all-orders', authenticate, authorize('chef_laborant', 'admin'), async (req, res) => {
  try {
    const { status, laborant_id, date_from, date_to, page = 1, limit = 20 } = req.query

    const filter = {}
    if (status) filter.status = status
    if (laborant_id) filter.laborant_id = laborant_id
    if (date_from || date_to) {
      filter.createdAt = {}
      if (date_from) filter.createdAt.$gte = new Date(date_from)
      if (date_to) filter.createdAt.$lte = new Date(date_to)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [orders, total] = await Promise.all([
      LabOrder.find(filter)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('test_id', 'name category')
        .populate('ordered_by', 'first_name last_name')
        .populate('completed_by', 'first_name last_name')
        .populate('approved_by', 'first_name last_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LabOrder.countDocuments(filter)
    ])

    const formattedOrders = orders.map(o => ({
      id: o._id,
      order_number: o.order_number,
      patient_name: o.patient_id ? `${o.patient_id.first_name} ${o.patient_id.last_name}` : 'Noma\'lum',
      patient_number: o.patient_id?.patient_number,
      test_name: o.test_id?.name || o.test_name,
      category: o.test_id?.category,
      status: o.status,
      priority: o.priority,
      critical_alert: o.critical_alert,
      ordered_by: o.ordered_by ? `${o.ordered_by.first_name} ${o.ordered_by.last_name}` : '',
      completed_by: o.completed_by ? `${o.completed_by.first_name} ${o.completed_by.last_name}` : '',
      approved_by: o.approved_by ? `${o.approved_by.first_name} ${o.approved_by.last_name}` : '',
      created_at: o.createdAt,
      completed_at: o.completed_at,
      approved_at: o.approved_at
    }))

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
