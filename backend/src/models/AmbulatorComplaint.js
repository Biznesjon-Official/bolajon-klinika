import mongoose from 'mongoose';

const ambulatorComplaintSchema = new mongoose.Schema({
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulatorRoom',
    required: true
  },
  complaint_type: {
    type: String,
    enum: ['service_issue', 'staff_behavior', 'facility_issue', 'wait_time', 'other'],
    default: 'service_issue'
  },
  complaint_text: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved', 'dismissed'],
    default: 'pending'
  },
  submitted_at: {
    type: Date,
    default: Date.now
  },
  acknowledged_at: {
    type: Date
  },
  acknowledged_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  resolved_at: {
    type: Date
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  resolution_notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorComplaintSchema.index({ status: 1, submitted_at: -1 });
ambulatorComplaintSchema.index({ room_id: 1 });
ambulatorComplaintSchema.index({ queue_id: 1 });

const AmbulatorComplaint = mongoose.model('AmbulatorComplaint', ambulatorComplaintSchema);

export default AmbulatorComplaint;
