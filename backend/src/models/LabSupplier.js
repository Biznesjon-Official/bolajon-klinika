import mongoose from 'mongoose';

const labSupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

labSupplierSchema.index({ name: 1 });
labSupplierSchema.index({ status: 1 });

const LabSupplier = mongoose.model('LabSupplier', labSupplierSchema);

export default LabSupplier;
