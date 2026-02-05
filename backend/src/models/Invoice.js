import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  invoice_number: {
    type: String,
    required: true,
    unique: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  paid_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  payment_status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'cancelled'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
invoiceSchema.index({ patient_id: 1, created_at: -1 });
invoiceSchema.index({ payment_status: 1 });
invoiceSchema.index({ invoice_number: 1 });
invoiceSchema.index({ created_at: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema, 'billing');

export default Invoice;
