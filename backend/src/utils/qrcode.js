import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

export const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    return buffer;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

export const generatePatientQR = async (patientId, patientNumber) => {
  // Store only the data, not the full QR image
  // Frontend can generate the QR code image from this data
  const data = JSON.stringify({
    type: 'patient',
    id: patientId,
    number: patientNumber,
    timestamp: new Date().toISOString()
  });
  return data; // Return just the data string, not the full QR image
};

export const generateInvoiceQR = async (invoiceId, invoiceNumber, amount) => {
  // Store only the data, not the full QR image
  const data = JSON.stringify({
    type: 'invoice',
    id: invoiceId,
    number: invoiceNumber,
    amount,
    timestamp: new Date().toISOString()
  });
  return data; // Return just the data string
};

export const generateLabOrderQR = async (orderId, orderNumber) => {
  // Store only the data, not the full QR image
  const data = JSON.stringify({
    type: 'lab_order',
    id: orderId,
    number: orderNumber,
    timestamp: new Date().toISOString()
  });
  return data; // Return just the data string
};
