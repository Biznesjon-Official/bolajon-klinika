import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contact_person: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ is_active: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema, 'suppliers');

export default Supplier;
