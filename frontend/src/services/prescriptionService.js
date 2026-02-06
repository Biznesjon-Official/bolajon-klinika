import api from './api';

export const prescriptionService = {
  // Retsept yaratish
  createPrescription: async (data) => {
    try {
      const response = await api.post('/prescriptions', data);
      return response.data;
    } catch (error) {
      console.error('Create prescription error:', error);
      throw error;
    }
  },

  // Bemor retseptlari
  getPatientPrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Get patient prescriptions error:', error);
      throw error;
    }
  },

  // Retsept detallari
  getPrescription: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get prescription error:', error);
      throw error;
    }
  },

  // Retsept chekini chiqarish
  printPrescriptionReceipt: (prescription, patient) => {
    const printWindow = window.open('', '_blank');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Retsept Cheki - ${prescription.prescription_number || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 80mm;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .clinic-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #ccc;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .label {
            font-weight: bold;
          }
          .medications {
            margin-top: 10px;
          }
          .medication-item {
            margin: 8px 0;
            padding: 8px;
            background: #f5f5f5;
            border-left: 3px solid #3b82f6;
          }
          .med-name {
            font-weight: bold;
            font-size: 14px;
          }
          .med-details {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 12px;
          }
          .diagnosis-box {
            background: #fff3cd;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">BOLAJON KLINIKASI</div>
          <div>Retsept Cheki</div>
          <div style="font-size: 12px; margin-top: 5px;">
            ${new Date().toLocaleString('uz-UZ')}
          </div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Retsept №:</span>
            <span>${prescription.prescription_number || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Bemor:</span>
            <span>${patient.first_name} ${patient.last_name}</span>
          </div>
          <div class="row">
            <span class="label">Bemor ID:</span>
            <span>${patient.patient_number}</span>
          </div>
          <div class="row">
            <span class="label">Telefon:</span>
            <span>${patient.phone || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="diagnosis-box">
            <div class="label" style="margin-bottom: 5px;">Tashxis:</div>
            <div>${prescription.diagnosis || 'Kiritilmagan'}</div>
          </div>
          
          <div class="row">
            <span class="label">Retsept turi:</span>
            <span>${prescription.prescription_type === 'REGULAR' ? 'Oddiy' : 
                   prescription.prescription_type === 'URGENT' ? 'Shoshilinch' : 'Surunkali'}</span>
          </div>
        </div>

        <div class="section">
          <div class="label" style="margin-bottom: 10px;">Dorilar:</div>
          <div class="medications">
            ${(prescription.medications || []).map((med, index) => `
              <div class="medication-item">
                <div class="med-name">${index + 1}. ${med.medication_name}</div>
                <div class="med-details">
                  Dozasi: ${med.dosage} | 
                  Miqdori: ${med.quantity} ${med.unit || 'dona'} | 
                  Chastota: ${med.frequency}
                </div>
                ${med.duration ? `<div class="med-details">Davomiyligi: ${med.duration}</div>` : ''}
                ${med.instructions ? `<div class="med-details">Ko'rsatma: ${med.instructions}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        ${prescription.notes ? `
          <div class="section">
            <div class="label">Qo'shimcha eslatmalar:</div>
            <div style="margin-top: 5px; font-size: 13px;">${prescription.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div style="margin-bottom: 10px;">
            <strong>Shifokor:</strong> ${prescription.doctor_name || 'N/A'}
          </div>
          <div style="font-size: 11px; color: #666;">
            Sog'ligingiz uchun g'amxo'rlik qilamiz!
          </div>
          <div style="margin-top: 10px; font-size: 11px;">
            Tel: +998 XX XXX XX XX | www.vitalis.uz
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            Chop etish
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Yopish
          </button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Avtomatik chop etish (ixtiyoriy)
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};


export default prescriptionService;
