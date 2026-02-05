import mongoose from 'mongoose';

const ambulatorDoctorNotificationSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulatorRoom'
  },
  notification_type: {
    type: String,
    enum: ['patient_ready', 'patient_call', 'complaint', 'emergency', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorDoctorNotificationSchema.index({ doctor_id: 1, is_read: 1, createdAt: -1 });
ambulatorDoctorNotificationSchema.index({ notification_type: 1 });

const AmbulatorDoctorNotification = mongoose.model('AmbulatorDoctorNotification', ambulatorDoctorNotificationSchema);

export default AmbulatorDoctorNotification;
