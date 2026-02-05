import mongoose from 'mongoose';

const staffSalarySchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    unique: true
  },
  // Asosiy maosh (faqat admin uchun)
  base_salary: {
    type: Number,
    default: 0
  },
  // Lavozim bonusi
  position_bonus: {
    type: Number,
    default: 0
  },
  // Tajriba bonusi
  experience_bonus: {
    type: Number,
    default: 0
  },
  // Komissiya foizi (shifokor, hamshira, laborant uchun)
  commission_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Xona tozalash narxi (faqat sanitar uchun)
  room_cleaning_rate: {
    type: Number,
    default: 0
  },
  // Hisoblash turi
  calculation_type: {
    type: String,
    enum: ['fixed', 'commission', 'per_room'],
    default: 'fixed'
  },
  effective_from: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
staffSalarySchema.index({ staff_id: 1 });
staffSalarySchema.index({ effective_from: -1 });

const StaffSalary = mongoose.model('StaffSalary', staffSalarySchema, 'staff_salaries');

export default StaffSalary;
