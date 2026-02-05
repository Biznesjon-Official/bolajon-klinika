import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  billing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transaction_type: {
    type: String,
    enum: ['payment', 'refund'],
    default: 'payment'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true
  },
  reference_number: {
    type: String,
    trim: true
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
transactionSchema.index({ billing_id: 1 });
transactionSchema.index({ patient_id: 1, created_at: -1 });
transactionSchema.index({ transaction_type: 1, created_at: -1 });
transactionSchema.index({ payment_method: 1, created_at: -1 });
transactionSchema.index({ created_at: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

export default Transaction;
