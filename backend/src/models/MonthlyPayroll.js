import mongoose from 'mongoose';

const monthlyPayrollSchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  base_salary: {
    type: Number,
    required: true,
    default: 0
  },
  position_bonus: {
    type: Number,
    default: 0
  },
  experience_bonus: {
    type: Number,
    default: 0
  },
  service_commission: {
    type: Number,
    default: 0
  },
  shift_bonus: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  penalties: {
    type: Number,
    default: 0
  },
  total_salary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid'],
    default: 'draft'
  },
  payment_date: {
    type: Date
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    default: 'transfer'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index
monthlyPayrollSchema.index({ staff_id: 1, month: 1, year: 1 }, { unique: true });
monthlyPayrollSchema.index({ status: 1 });
monthlyPayrollSchema.index({ month: 1, year: 1 });

const MonthlyPayroll = mongoose.model('MonthlyPayroll', monthlyPayrollSchema, 'monthly_payrolls');

export default MonthlyPayroll;
