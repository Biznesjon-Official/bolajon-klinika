import mongoose from 'mongoose';

const ambulatorQRTicketSchema = new mongoose.Schema({
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  ticket_number: {
    type: String,
    required: true,
    unique: true
  },
  qr_code: {
    type: String,
    required: true
  },
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  scanned_at: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index'lar
ambulatorQRTicketSchema.index({ ticket_number: 1 });
ambulatorQRTicketSchema.index({ queue_id: 1 });
ambulatorQRTicketSchema.index({ is_active: 1 });

const AmbulatorQRTicket = mongoose.model('AmbulatorQRTicket', ambulatorQRTicketSchema);

export default AmbulatorQRTicket;
