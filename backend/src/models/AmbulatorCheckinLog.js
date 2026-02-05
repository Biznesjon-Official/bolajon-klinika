import mongoose from 'mongoose';

const ambulatorCheckinLogSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulatorRoom',
    required: true
  },
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  ticket_number: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['checkin', 'checkout'],
    required: true
  },
  scanned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorCheckinLogSchema.index({ room_id: 1, createdAt: -1 });
ambulatorCheckinLogSchema.index({ queue_id: 1 });
ambulatorCheckinLogSchema.index({ ticket_number: 1 });

const AmbulatorCheckinLog = mongoose.model('AmbulatorCheckinLog', ambulatorCheckinLogSchema);

export default AmbulatorCheckinLog;
