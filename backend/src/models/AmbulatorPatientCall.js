import mongoose from 'mongoose';

const ambulatorPatientCallSchema = new mongoose.Schema({
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
  call_type: {
    type: String,
    enum: ['assistance', 'emergency', 'nurse', 'doctor'],
    default: 'assistance'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'responded', 'cancelled'],
    default: 'pending'
  },
  call_time: {
    type: Date,
    default: Date.now
  },
  response_time: {
    type: Date
  },
  responded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  response_duration: {
    type: Number // seconds
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorPatientCallSchema.index({ status: 1, call_time: -1 });
ambulatorPatientCallSchema.index({ room_id: 1 });
ambulatorPatientCallSchema.index({ queue_id: 1 });

const AmbulatorPatientCall = mongoose.model('AmbulatorPatientCall', ambulatorPatientCallSchema);

export default AmbulatorPatientCall;
