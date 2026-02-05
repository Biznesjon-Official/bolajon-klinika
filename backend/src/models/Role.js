import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  display_name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  permissions: [{
    type: String
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ is_active: 1 });

const Role = mongoose.model('Role', roleSchema, 'roles');

export default Role;
