import mongoose from 'mongoose';

const pharmacyRequestSchema = new mongoose.Schema({
  medicine_name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplier_name: {
    type: String
  },
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  requested_by_name: {
    type: String
  },
  notes: {
    type: String
  },
  floor: {
    type: Number,
    default: 1
  },
  // Qabul qilish ma'lumotlari
  accepted_at: {
    type: Date
  },
  accepted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  batch_number: {
    type: String
  },
  expiry_date: {
    type: Date
  },
  cost_per_unit: {
    type: Number
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
pharmacyRequestSchema.index({ status: 1 });
pharmacyRequestSchema.index({ urgency: 1 });
pharmacyRequestSchema.index({ floor: 1 });
pharmacyRequestSchema.index({ created_at: -1 });

const PharmacyRequest = mongoose.model('PharmacyRequest', pharmacyRequestSchema, 'pharmacy_requests');

export default PharmacyRequest;
