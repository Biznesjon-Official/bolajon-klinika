import QRCode from 'qrcode'

export const generateQRDataUrl = (data, size = 100) =>
  QRCode.toDataURL(data, { width: size, margin: 1 })
