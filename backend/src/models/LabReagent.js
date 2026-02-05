import mongoose from 'mongoose';

const labReagentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['reagent', 'consumable', 'equipment', 'chemical', 'other'],
    default: 'reagent'
  },
  unit: {
    type: String,
    enum: ['ml', 'l', 'mg', 'g', 'kg', 'piece', 'box', 'pack'],
    default: 'ml'
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit_price: {
    type: Number,
    default: 0,
    min: 0
  },
  reorder_level: {
    type: Number,
    default: 10,
    min: 0
  },
  expiry_date: {
    type: Date
  },
  storage_condition: {
    type: String,
    enum: ['room_temperature', 'refrigerated', 'frozen', 'dark', 'special'],
    default: 'room_temperature'
  },
  manufacturer: {
    type: String,
    trim: true
  },
  lot_number: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'expired'],
    default: 'in_stock'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
labReagentSchema.index({ name: 1 });
labReagentSchema.index({ category: 1 });
labReagentSchema.index({ status: 1 });
labReagentSchema.index({ expiry_date: 1 });

// Auto-update status based on quantity and expiry
labReagentSchema.pre('save', function() {
  if (this.quantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.reorder_level) {
    this.status = 'low_stock';
  } else if (this.expiry_date && this.expiry_date < new Date()) {
    this.status = 'expired';
  } else {
    this.status = 'in_stock';
  }
});

const LabReagent = mongoose.model('LabReagent', labReagentSchema);

export default LabReagent;
