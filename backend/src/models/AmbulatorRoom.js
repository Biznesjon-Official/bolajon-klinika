import mongoose from 'mongoose';

const ambulatorRoomSchema = new mongoose.Schema({
  room_number: {
    type: String,
    required: true
  },
  room_name: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    default: 1
  },
  capacity: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'closed'],
    default: 'available'
  },
  department: {
    type: String,
    enum: ['ambulator', 'inpatient'],
    default: 'ambulator',
    required: true
  },
  current_patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  current_queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  equipment: [{
    type: String
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorRoomSchema.index({ room_number: 1, department: 1 }, { unique: true });
ambulatorRoomSchema.index({ status: 1 });
ambulatorRoomSchema.index({ department: 1 });

const AmbulatorRoom = mongoose.model('AmbulatorRoom', ambulatorRoomSchema);

export default AmbulatorRoom;
