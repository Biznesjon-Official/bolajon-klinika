import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  duration_minutes: {
    type: Number,
    default: 60
  },
  sample_type: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'swab', 'tissue', 'other'],
    default: 'blood'
  },
  preparation_instructions: {
    type: String
  },
  normal_range: {
    type: String
  },
  test_parameters: [{
    name: {
      type: String,
      required: true
    },
    unit: {
      type: String
    },
    normal_range: {
      type: String
    },
    description: {
      type: String
    }
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
labTestSchema.index({ name: 1 });
labTestSchema.index({ code: 1 });
labTestSchema.index({ category: 1 });
labTestSchema.index({ is_active: 1 });

const LabTest = mongoose.model('LabTest', labTestSchema);

export default LabTest;
