import mongoose from 'mongoose';

const roomCleaningSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  room_number: {
    type: String,
    required: true
  },
  room_type: {
    type: String,
    enum: ['palata', 'operatsiya_xonasi', 'laboratoriya', 'ambulatorxona', 'hojatxona', 'koridor'],
    default: 'palata'
  },
  floor: {
    type: String
  },
  building: {
    type: String,
    default: 'Asosiy bino'
  },
  status: {
    type: String,
    enum: ['tozalanmagan', 'tozalanmoqda', 'toza'],
    default: 'tozalanmagan'
  },
  cleaned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  cleaning_date: {
    type: Date,
    default: () => new Date().setHours(0, 0, 0, 0) // Start of day
  },
  requires_disinfection: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
roomCleaningSchema.index({ room_id: 1, cleaning_date: 1 }, { unique: true });
roomCleaningSchema.index({ status: 1 });
roomCleaningSchema.index({ cleaned_by: 1 });
roomCleaningSchema.index({ cleaning_date: -1 });

const RoomCleaning = mongoose.model('RoomCleaning', roomCleaningSchema, 'room_cleanings');

export default RoomCleaning;
