import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String
  },
  description: {
    type: String
  },
  task_type: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'LOW', 'NORMAL', 'HIGH', 'EMERGENCY'],
    default: 'medium'
  },
  // Support both field names for compatibility
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  nurse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  // Patient reference for nurse tasks
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  admission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  prescription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  // Medication details for nurse tasks
  medication_name: {
    type: String
  },
  dosage: {
    type: String
  },
  route: {
    type: String,
    enum: ['oral', 'iv', 'im', 'sc', 'topical', 'inhalation'],
    default: 'oral'
  },
  frequency: {
    type: String
  },
  instructions: {
    type: String
  },
  scheduled_time: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'verified', 'cancelled'],
    default: 'pending'
  },
  due_date: {
    type: Date
  },
  location_details: {
    type: String
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  verified_at: {
    type: Date
  },
  completion_notes: {
    type: String
  },
  verification_notes: {
    type: String
  },
  rejection_reason: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
taskSchema.index({ assigned_to: 1, status: 1 });
taskSchema.index({ nurse_id: 1, status: 1 });
taskSchema.index({ created_by: 1 });
taskSchema.index({ assigned_by: 1 });
taskSchema.index({ patient_id: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ created_at: -1 });

const Task = mongoose.model('Task', taskSchema, 'tasks');

export default Task;
