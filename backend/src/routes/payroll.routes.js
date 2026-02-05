import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import StaffSalary from '../models/StaffSalary.js';
import Bonus from '../models/Bonus.js';
import Penalty from '../models/Penalty.js';
import MonthlyPayroll from '../models/MonthlyPayroll.js';
import Staff from '../models/Staff.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

/**
 * Get all staff salaries
 */
router.get('/staff-salaries',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const salaries = await StaffSalary.find()
        .populate('staff_id', 'first_name last_name role employee_id')
        .sort({ created_at: -1 })
        .lean();

      res.json({
        success: true,
        data: salaries.map(s => ({
          id: s._id,
          staff_id: s.staff_id._id,
          staff_name: `${s.staff_id.first_name} ${s.staff_id.last_name}`,
          employee_id: s.staff_id.employee_id,
          role: s.staff_id.role,
          base_salary: s.base_salary,
          position_bonus: s.position_bonus,
          experience_bonus: s.experience_bonus,
          commission_rate: s.commission_rate,
          room_cleaning_rate: s.room_cleaning_rate,
          calculation_type: s.calculation_type,
          effective_from: s.effective_from,
          notes: s.notes
        }))
      });
    } catch (error) {
      console.error('Get staff salaries error:', error);
      next(error);
    }
  }
);

/**
 * Set staff salary
 */
router.post('/staff-salaries',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { staff_id, base_salary, position_bonus, experience_bonus, commission_rate, room_cleaning_rate, notes } = req.body;

      // Check if salary already exists
      const existing = await StaffSalary.findOne({ staff_id });
      
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Bu xodim uchun maosh allaqachon belgilangan'
        });
      }

      // Get staff to determine calculation type
      const staff = await Staff.findById(staff_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Xodim topilmadi'
        });
      }

      let calculation_type = 'fixed';
      if (staff.role === 'sanitar') {
        calculation_type = 'per_room';
      } else if (['doctor', 'nurse', 'laborant', 'pharmacist'].includes(staff.role)) {
        calculation_type = 'commission';
      }

      const salary = await StaffSalary.create({
        staff_id,
        base_salary: base_salary || 0,
        position_bonus: position_bonus || 0,
        experience_bonus: experience_bonus || 0,
        commission_rate: commission_rate || 0,
        room_cleaning_rate: room_cleaning_rate || 0,
        calculation_type,
        notes
      });

      const populated = await StaffSalary.findById(salary._id)
        .populate('staff_id', 'first_name last_name role employee_id')
        .lean();

      res.json({
        success: true,
        message: 'Maosh muvaffaqiyatli belgilandi',
        data: populated
      });
    } catch (error) {
      console.error('Set staff salary error:', error);
      next(error);
    }
  }
);

/**
 * Update staff salary
 */
router.put('/staff-salaries/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { base_salary, position_bonus, experience_bonus, commission_rate, room_cleaning_rate, notes } = req.body;

      const salary = await StaffSalary.findByIdAndUpdate(
        id,
        {
          base_salary,
          position_bonus,
          experience_bonus,
          commission_rate,
          room_cleaning_rate,
          notes
        },
        { new: true }
      ).populate('staff_id', 'first_name last_name role employee_id');

      if (!salary) {
        return res.status(404).json({
          success: false,
          message: 'Maosh topilmadi'
        });
      }

      res.json({
        success: true,
        message: 'Maosh muvaffaqiyatli yangilandi',
        data: salary
      });
    } catch (error) {
      console.error('Update staff salary error:', error);
      next(error);
    }
  }
);

/**
 * Delete staff salary
 */
router.delete('/staff-salaries/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const salary = await StaffSalary.findByIdAndDelete(id);

      if (!salary) {
        return res.status(404).json({
          success: false,
          message: 'Maosh topilmadi'
        });
      }

      res.json({
        success: true,
        message: 'Maosh muvaffaqiyatli o\'chirildi'
      });
    } catch (error) {
      console.error('Delete staff salary error:', error);
      next(error);
    }
  }
);

/**
 * Get bonuses
 */
router.get('/bonuses',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const bonuses = await Bonus.find()
        .populate('staff_id', 'first_name last_name employee_id')
        .populate('approved_by', 'first_name last_name')
        .sort({ created_at: -1 })
        .lean();

      res.json({
        success: true,
        data: bonuses
      });
    } catch (error) {
      console.error('Get bonuses error:', error);
      next(error);
    }
  }
);

/**
 * Add bonus
 */
router.post('/bonuses',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      console.log('📝 Bonus request body:', req.body);
      const { staff_id, amount, reason, bonus_type, month, year, notes } = req.body;

      // Validation
      if (!staff_id) {
        console.log('❌ Validation failed: staff_id missing');
        return res.status(400).json({
          success: false,
          message: 'Xodim tanlanmagan'
        });
      }

      if (!amount || amount <= 0) {
        console.log('❌ Validation failed: amount invalid', amount);
        return res.status(400).json({
          success: false,
          message: 'Bonus summasi noto\'g\'ri'
        });
      }

      if (!reason || reason.trim() === '') {
        console.log('❌ Validation failed: reason missing');
        return res.status(400).json({
          success: false,
          message: 'Bonus sababi ko\'rsatilmagan'
        });
      }

      if (!month || month < 1 || month > 12) {
        console.log('❌ Validation failed: month invalid', month);
        return res.status(400).json({
          success: false,
          message: 'Oy noto\'g\'ri ko\'rsatilgan'
        });
      }

      if (!year || year < 2020) {
        console.log('❌ Validation failed: year invalid', year);
        return res.status(400).json({
          success: false,
          message: 'Yil noto\'g\'ri ko\'rsatilgan'
        });
      }

      console.log('✅ Validation passed, creating bonus...');
      const bonus = await Bonus.create({
        staff_id,
        amount,
        reason,
        bonus_type: bonus_type || 'other',
        month,
        year,
        approved_by: req.user.id,
        status: 'approved',
        notes
      });

      const populated = await Bonus.findById(bonus._id)
        .populate('staff_id', 'first_name last_name employee_id')
        .populate('approved_by', 'first_name last_name')
        .lean();

      console.log('✅ Bonus created successfully:', populated);
      res.json({
        success: true,
        message: 'Bonus muvaffaqiyatli qo\'shildi',
        data: populated
      });
    } catch (error) {
      console.error('❌ Add bonus error:', error);
      console.error('Error details:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Bonus qo\'shishda xatolik'
      });
    }
  }
);

/**
 * Get penalties
 */
router.get('/penalties',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const penalties = await Penalty.find()
        .populate('staff_id', 'first_name last_name employee_id')
        .populate('approved_by', 'first_name last_name')
        .sort({ created_at: -1 })
        .lean();

      res.json({
        success: true,
        data: penalties
      });
    } catch (error) {
      console.error('Get penalties error:', error);
      next(error);
    }
  }
);

/**
 * Add penalty
 */
router.post('/penalties',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      console.log('📝 Penalty request body:', req.body);
      const { staff_id, amount, reason, penalty_type, month, year, notes } = req.body;

      // Validation
      if (!staff_id) {
        console.log('❌ Validation failed: staff_id missing');
        return res.status(400).json({
          success: false,
          message: 'Xodim tanlanmagan'
        });
      }

      if (!amount || amount <= 0) {
        console.log('❌ Validation failed: amount invalid', amount);
        return res.status(400).json({
          success: false,
          message: 'Jarima summasi noto\'g\'ri'
        });
      }

      if (!reason || reason.trim() === '') {
        console.log('❌ Validation failed: reason missing');
        return res.status(400).json({
          success: false,
          message: 'Jarima sababi ko\'rsatilmagan'
        });
      }

      if (!month || month < 1 || month > 12) {
        console.log('❌ Validation failed: month invalid', month);
        return res.status(400).json({
          success: false,
          message: 'Oy noto\'g\'ri ko\'rsatilgan'
        });
      }

      if (!year || year < 2020) {
        console.log('❌ Validation failed: year invalid', year);
        return res.status(400).json({
          success: false,
          message: 'Yil noto\'g\'ri ko\'rsatilgan'
        });
      }

      console.log('✅ Validation passed, creating penalty...');
      const penalty = await Penalty.create({
        staff_id,
        amount,
        reason,
        penalty_type: penalty_type || 'other',
        month,
        year,
        approved_by: req.user.id,
        status: 'approved',
        notes
      });

      const populated = await Penalty.findById(penalty._id)
        .populate('staff_id', 'first_name last_name employee_id')
        .populate('approved_by', 'first_name last_name')
        .lean();

      console.log('✅ Penalty created successfully:', populated);
      res.json({
        success: true,
        message: 'Jarima muvaffaqiyatli qo\'shildi',
        data: populated
      });
    } catch (error) {
      console.error('❌ Add penalty error:', error);
      console.error('Error details:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Jarima qo\'shishda xatolik'
      });
    }
  }
);

/**
 * Get monthly payroll
 */
router.get('/monthly-payroll',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Oy va yil ko\'rsatilishi shart'
        });
      }

      const payrolls = await MonthlyPayroll.find({
        month: parseInt(month),
        year: parseInt(year)
      })
        .populate('staff_id', 'first_name last_name employee_id role')
        .populate('approved_by', 'first_name last_name')
        .populate('paid_by', 'first_name last_name')
        .sort({ created_at: -1 })
        .lean();

      // Add bonuses and penalties count for each staff
      const payrollsWithCounts = await Promise.all(
        payrolls.map(async (payroll) => {
          const [bonusesCount, penaltiesCount] = await Promise.all([
            Bonus.countDocuments({
              staff_id: payroll.staff_id._id,
              month: parseInt(month),
              year: parseInt(year)
            }),
            Penalty.countDocuments({
              staff_id: payroll.staff_id._id,
              month: parseInt(month),
              year: parseInt(year)
            })
          ]);

          // Format for frontend
          return {
            id: payroll._id,
            staff_id: payroll.staff_id._id,
            staff_name: `${payroll.staff_id.first_name} ${payroll.staff_id.last_name}`,
            employee_id: payroll.staff_id.employee_id,
            role: payroll.staff_id.role,
            role_name: getRoleNameUz(payroll.staff_id.role),
            month: payroll.month,
            year: payroll.year,
            base_salary: payroll.base_salary,
            position_bonus: payroll.position_bonus,
            experience_bonus: payroll.experience_bonus,
            service_commissions: payroll.service_commission,
            shift_bonuses: payroll.shift_bonus,
            other_bonuses: payroll.bonuses,
            penalties: payroll.penalties,
            net_salary: payroll.total_salary,
            status: payroll.status,
            payment_date: payroll.payment_date,
            payment_method: payroll.payment_method,
            bonuses_count: bonusesCount,
            penalties_count: penaltiesCount,
            created_at: payroll.created_at
          };
        })
      );

      // Calculate statistics
      const totalSalary = payrollsWithCounts.reduce((sum, p) => sum + (p.net_salary || 0), 0);
      const totalBonusesCount = payrollsWithCounts.reduce((sum, p) => sum + (p.bonuses_count || 0), 0);
      const totalPenaltiesCount = payrollsWithCounts.reduce((sum, p) => sum + (p.penalties_count || 0), 0);

      res.json({
        success: true,
        data: payrollsWithCounts,
        statistics: {
          totalStaff: payrollsWithCounts.length,
          totalSalary: totalSalary,
          totalBonusesCount: totalBonusesCount,
          totalPenaltiesCount: totalPenaltiesCount
        }
      });
    } catch (error) {
      console.error('Get monthly payroll error:', error);
      next(error);
    }
  }
);

// Helper function for role translation
function getRoleNameUz(role) {
  const roleMap = {
    'admin': 'Administrator',
    'doctor': 'Shifokor',
    'nurse': 'Hamshira',
    'laborant': 'Laborant',
    'pharmacist': 'Dorixona',
    'sanitar': 'Tozalovchi'
  };
  return roleMap[role] || role;
}

/**
 * Calculate monthly payroll
 */
router.post('/calculate-monthly',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Oy va yil ko\'rsatilishi shart'
        });
      }

      // Get all staff with salaries
      const staffSalaries = await StaffSalary.find().populate('staff_id').lean();

      const payrolls = [];
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      for (const salary of staffSalaries) {
        // Check if payroll already exists
        const existing = await MonthlyPayroll.findOne({
          staff_id: salary.staff_id._id,
          month,
          year
        });

        if (existing) {
          continue; // Skip if already calculated
        }

        const staff = salary.staff_id;
        let serviceCommission = 0;

        // Calculate commission based on role
        switch (staff.role) {
          case 'admin':
            // Admin: Fixed salary only
            break;

          case 'doctor':
            // Doctor: Commission from total patient payments
            const doctorInvoices = await Invoice.aggregate([
              {
                $match: {
                  created_at: { $gte: startDate, $lte: endDate },
                  // Assuming doctor_id field exists in Invoice
                  // If not, we need to link through appointments or queue
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total_amount' }
                }
              }
            ]);
            serviceCommission = (doctorInvoices[0]?.total || 0) * (salary.commission_rate / 100);
            break;

          case 'nurse':
            // Nurse: Commission from pharmacy/medicine sales
            const nursePharmacySales = await Invoice.aggregate([
              {
                $match: {
                  created_at: { $gte: startDate, $lte: endDate },
                  service_name: { $regex: /dori|farmatsiya|pharmacy/i }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total_amount' }
                }
              }
            ]);
            serviceCommission = (nursePharmacySales[0]?.total || 0) * (salary.commission_rate / 100);
            break;

          case 'laborant':
            // Laborant: Commission from lab orders
            const LabOrder = mongoose.model('LabOrder');
            const labOrders = await LabOrder.aggregate([
              {
                $match: {
                  laborant_id: staff._id,
                  createdAt: { $gte: startDate, $lte: endDate },
                  status: { $in: ['completed', 'approved'] }
                }
              },
              {
                $lookup: {
                  from: 'billing',
                  localField: 'invoice_id',
                  foreignField: '_id',
                  as: 'invoice'
                }
              },
              {
                $unwind: { path: '$invoice', preserveNullAndEmptyArrays: true }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$invoice.total_amount' }
                }
              }
            ]);
            serviceCommission = (labOrders[0]?.total || 0) * (salary.commission_rate / 100);
            break;

          case 'sanitar':
            // Sanitar: Payment per cleaned room
            // TODO: Need to track room cleaning activities
            // For now, we'll use a placeholder
            serviceCommission = 0; // Will be calculated from room cleaning logs
            break;

          case 'pharmacist':
            // Pharmacist: Could have commission from pharmacy sales
            const pharmacySales = await Invoice.aggregate([
              {
                $match: {
                  created_at: { $gte: startDate, $lte: endDate },
                  service_name: { $regex: /dori|farmatsiya|pharmacy/i }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total_amount' }
                }
              }
            ]);
            serviceCommission = (pharmacySales[0]?.total || 0) * (salary.commission_rate / 100);
            break;

          default:
            serviceCommission = 0;
        }

        // Calculate bonuses
        const bonuses = await Bonus.aggregate([
          {
            $match: {
              staff_id: staff._id,
              month: parseInt(month),
              year: parseInt(year),
              status: 'approved'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        // Calculate penalties
        const penalties = await Penalty.aggregate([
          {
            $match: {
              staff_id: staff._id,
              month: parseInt(month),
              year: parseInt(year),
              status: 'approved'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const totalBonuses = bonuses[0]?.total || 0;
        const totalPenalties = penalties[0]?.total || 0;

        const totalSalary = 
          salary.base_salary +
          salary.position_bonus +
          salary.experience_bonus +
          serviceCommission +
          totalBonuses -
          totalPenalties;

        const payroll = await MonthlyPayroll.create({
          staff_id: staff._id,
          month,
          year,
          base_salary: salary.base_salary,
          position_bonus: salary.position_bonus,
          experience_bonus: salary.experience_bonus,
          service_commission: serviceCommission,
          shift_bonus: 0,
          bonuses: totalBonuses,
          penalties: totalPenalties,
          total_salary: totalSalary,
          status: 'draft'
        });

        payrolls.push(payroll);
      }

      res.json({
        success: true,
        message: `${payrolls.length} ta xodim uchun maosh hisoblandi`,
        data: payrolls
      });
    } catch (error) {
      console.error('Calculate monthly payroll error:', error);
      next(error);
    }
  }
);

/**
 * Approve payroll
 */
router.post('/monthly-payroll/:id/approve',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const payroll = await MonthlyPayroll.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approved_by: req.user.id
        },
        { new: true }
      ).populate('staff_id', 'first_name last_name employee_id');

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Maosh topilmadi'
        });
      }

      res.json({
        success: true,
        message: 'Maosh tasdiqlandi',
        data: payroll
      });
    } catch (error) {
      console.error('Approve payroll error:', error);
      next(error);
    }
  }
);

/**
 * Pay payroll
 */
router.post('/monthly-payroll/:id/pay',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { payment_method, notes } = req.body;

      const payroll = await MonthlyPayroll.findByIdAndUpdate(
        id,
        {
          status: 'paid',
          payment_date: new Date(),
          payment_method: payment_method || 'transfer',
          paid_by: req.user.id,
          notes
        },
        { new: true }
      ).populate('staff_id', 'first_name last_name employee_id');

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Maosh topilmadi'
        });
      }

      res.json({
        success: true,
        message: 'Maosh to\'landi',
        data: payroll
      });
    } catch (error) {
      console.error('Pay payroll error:', error);
      next(error);
    }
  }
);

/**
 * Get staff payroll details
 */
router.get('/staff/:staffId/details',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { staffId } = req.params;
      const { month, year } = req.query;

      const payroll = await MonthlyPayroll.findOne({
        staff_id: staffId,
        month: parseInt(month),
        year: parseInt(year)
      })
        .populate('staff_id', 'first_name last_name employee_id role')
        .lean();

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Maosh topilmadi'
        });
      }

      // Get bonuses and penalties
      const [bonuses, penalties] = await Promise.all([
        Bonus.find({
          staff_id: staffId,
          month: parseInt(month),
          year: parseInt(year),
          status: 'approved'
        }).lean(),
        Penalty.find({
          staff_id: staffId,
          month: parseInt(month),
          year: parseInt(year),
          status: 'approved'
        }).lean()
      ]);

      res.json({
        success: true,
        data: {
          payroll,
          bonuses,
          penalties
        }
      });
    } catch (error) {
      console.error('Get staff details error:', error);
      next(error);
    }
  }
);

export default router;
