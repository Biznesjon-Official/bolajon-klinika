import mongoose from 'mongoose';

const bonusSchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  bonus_type: {
    type: String,
    enum: ['performance', 'holiday', 'achievement', 'other'],
    default: 'other'
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
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
bonusSchema.index({ staff_id: 1, month: 1, year: 1 });
bonusSchema.index({ status: 1 });

const Bonus = mongoose.model('Bonus', bonusSchema, 'bonuses');

export default Bonus;
