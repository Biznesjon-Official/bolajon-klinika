/**
 * Check if payment is required before providing a service.
 * Inpatient (statsionar) patients are exempt — they can have debt.
 *
 * @param {ObjectId} patientId
 * @param {Object} invoiceQuery - mongoose query to find the invoice
 * @returns {null | { status, message }} — null means allowed, object means blocked
 */
export const requirePayment = async (patientId, invoiceQuery) => {
  const Invoice = (await import('../models/Invoice.js')).default
  const Admission = (await import('../models/Admission.js')).default

  const invoice = await Invoice.findOne(invoiceQuery).lean()
  if (!invoice || invoice.payment_status === 'paid') return null

  const activeInpatient = await Admission.findOne({
    patient_id: patientId,
    admission_type: 'inpatient',
    status: 'active'
  }).lean()

  if (activeInpatient) return null

  return { status: 402, message: 'Avval to\'lov amalga oshirilishi kerak' }
}
