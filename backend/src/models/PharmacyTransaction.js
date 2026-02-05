import mongoose from 'mongoose';

const pharmacyTransactionSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicine_name: {
    type: String,
    required: true
  },
  transaction_type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'expired', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit_price: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    default: 0
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  prescription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  notes: {
    type: String
  },
  batch_number: {
    type: String
  },
  floor: {
    type: Number,
    default: 1
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
pharmacyTransactionSchema.index({ medicine_id: 1 });
pharmacyTransactionSchema.index({ transaction_type: 1 });
pharmacyTransactionSchema.index({ patient_id: 1 });
pharmacyTransactionSchema.index({ staff_id: 1 });
pharmacyTransactionSchema.index({ task_id: 1 });
pharmacyTransactionSchema.index({ created_at: -1 });

const PharmacyTransaction = mongoose.model('PharmacyTransaction', pharmacyTransactionSchema, 'pharmacy_transactions');

export default PharmacyTransaction;
