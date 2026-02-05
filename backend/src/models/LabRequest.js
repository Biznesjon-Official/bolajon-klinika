import mongoose from 'mongoose';

const labRequestSchema = new mongoose.Schema({
  request_number: {
    type: String,
    unique: true,
    sparse: true
  },
  reagent_name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'piece'
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabSupplier'
  },
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
    default: 'pending'
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal'
  },
  notes: {
    type: String
  },
  ordered_at: {
    type: Date
  },
  received_at: {
    type: Date
  }
}, {
  timestamps: true
});

labRequestSchema.index({ status: 1 });
labRequestSchema.index({ requested_by: 1 });
labRequestSchema.index({ createdAt: -1 });

// Auto-increment request_number
labRequestSchema.pre('save', async function() {
  if (!this.isNew || this.request_number) {
    return;
  }
  
  const lastRequest = await mongoose.model('LabRequest').findOne().sort({ request_number: -1 });
  
  if (lastRequest && lastRequest.request_number) {
    const lastNumber = parseInt(lastRequest.request_number.replace('LR', ''));
    this.request_number = `LR${String(lastNumber + 1).padStart(6, '0')}`;
  } else {
    this.request_number = 'LR000001';
  }
});

const LabRequest = mongoose.model('LabRequest', labRequestSchema);

export default LabRequest;
