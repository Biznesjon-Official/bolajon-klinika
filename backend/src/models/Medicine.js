import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  generic_name: {
    type: String
  },
  manufacturer: {
    type: String
  },
  category: {
    type: String,
    enum: ['tablet', 'syrup', 'injection', 'cream', 'drops', 'other'],
    default: 'other'
  },
  dosage_form: {
    type: String
  },
  strength: {
    type: String
  },
  unit: {
    type: String,
    default: 'dona',
    enum: ['dona', 'mg', 'ml', 'g', 'kg', 'l', 'ampula', 'shisha', 'quti']
  },
  unit_price: {
    type: Number,
    required: true,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  reorder_level: {
    type: Number,
    default: 10
  },
  expiry_date: {
    type: Date
  },
  batch_number: {
    type: String
  },
  floor: {
    type: Number,
    default: 1
  },
  shelf_location: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['available', 'out_of_stock', 'expired', 'discontinued'],
    default: 'available'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ floor: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema, 'medicines');

export default Medicine;
