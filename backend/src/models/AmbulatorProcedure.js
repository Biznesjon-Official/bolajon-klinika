import mongoose from 'mongoose'

const ambulatorProcedureSchema = new mongoose.Schema({
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoice_number: { type: String, required: true },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  service_name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  started_at: Date,
  completed_at: Date,
  nurse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
  bed_number: { type: Number }
}, { timestamps: true })

ambulatorProcedureSchema.index({ invoice_id: 1 })
ambulatorProcedureSchema.index({ invoice_number: 1 })
ambulatorProcedureSchema.index({ patient_id: 1 })

const AmbulatorProcedure = mongoose.model('AmbulatorProcedure', ambulatorProcedureSchema)
export default AmbulatorProcedure
