import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PatientQRModal({ patient, onClose }) {
  const qrRef = useRef(null);

  if (!patient) return null;

  const qrData = patient.patient_number || patient.id || 'NO_ID';

  const handleDownload = () => {
    // SVG ni PNG ga o'tkazish
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 300;
    canvas.height = 300;
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${qrData}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Bemor QR Kodi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
          </button>
        </div>

        <div className="text-center space-y-3 sm:space-y-4">
          {/* Patient Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {patient.first_name} {patient.last_name}
            </p>
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Bemor raqami: {qrData}
            </p>
            {patient.access_code && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Telegram bot uchun maxsus kod:
                </p>
                <p className="text-xl sm:text-2xl font-bold text-primary tracking-wider">
                  {patient.access_code}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Bu kodni Telegram botga yuboring
                </p>
              </div>
            )}
            {patient.phone && (
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                {patient.phone}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div ref={qrRef} className="flex justify-center bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl">
            <QRCodeSVG
              value={String(qrData)}
              size={256}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-700 font-semibold flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
            >
              <span className="material-symbols-outlined">download</span>
              Yuklab olish
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
            >
              <span className="material-symbols-outlined">print</span>
              Chop etish
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
