import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema({
  billing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  service_name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
billingItemSchema.index({ billing_id: 1 });
billingItemSchema.index({ service_id: 1 });

const BillingItem = mongoose.model('BillingItem', billingItemSchema, 'billing_items');

export default BillingItem;
