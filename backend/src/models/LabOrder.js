import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    unique: true,
    sparse: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  laborant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest'
  },
  test_type: {
    type: String,
    required: true
  },
  test_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sample_collected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'stat'],
    default: 'normal'
  },
  sample_type: {
    type: String
  },
  sample_collected_at: {
    type: Date
  },
  results: [{
    parameter_name: String,
    value: String,
    unit: String,
    normal_range: String,
    is_normal: Boolean
  }],
  notes: {
    type: String
  },
  completed_at: {
    type: Date
  },
  price: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
labOrderSchema.index({ patient_id: 1 });
labOrderSchema.index({ doctor_id: 1 });
labOrderSchema.index({ laborant_id: 1 });
labOrderSchema.index({ status: 1 });
labOrderSchema.index({ createdAt: -1 });

// Auto-increment order_number
labOrderSchema.pre('save', async function() {
  if (!this.isNew || this.order_number) {
    return;
  }
  
  const lastOrder = await mongoose.model('LabOrder').findOne().sort({ order_number: -1 });
  
  if (lastOrder && lastOrder.order_number) {
    const lastNumber = parseInt(lastOrder.order_number.replace('LAB', ''));
    this.order_number = `LAB${String(lastNumber + 1).padStart(6, '0')}`;
  } else {
    this.order_number = 'LAB000001';
  }
});

const LabOrder = mongoose.model('LabOrder', labOrderSchema);

export default LabOrder;
