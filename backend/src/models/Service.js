import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  base_price: {
    type: Number,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  code: {
    type: String,
    trim: true
  },
  procedure_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcedureCategory',
    default: null
  },
  procedure_type: {
    type: String,
    enum: ['ukol', 'kapelnitsa', 'massaj', 'xijoma'],
    default: null
  },
  is_cups_based: {
    type: Boolean,
    default: false
  },
  price_per_cup: {
    type: Number,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Pre-save hook: agar base_price bo'lmasa, price dan olamiz
serviceSchema.pre('save', async function() {
  if (!this.base_price) {
    this.base_price = this.price;
  }
});

// Indexes
serviceSchema.index({ category: 1, name: 1 });
serviceSchema.index({ is_active: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
