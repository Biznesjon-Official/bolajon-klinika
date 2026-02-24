import api from './api'

export const prescriptionService = {
  // Retsept yaratish
  createPrescription: async (data) => {
    try {
      const response = await api.post('/prescriptions', data)
      return response.data
    } catch (error) {
      console.error('Create prescription error:', error)
      throw error
    }
  },

  // Bemor retseptlari
  getPatientPrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`)
      return response.data
    } catch (error) {
      console.error('Get patient prescriptions error:', error)
      throw error
    }
  },

  // Retsept detallari
  getPrescription: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`)
      return response.data
    } catch (error) {
      console.error('Get prescription error:', error)
      throw error
    }
  },

  // A4 formatda retsept chop etish
  printPrescriptionReceipt: (prescription, patient) => {
    const printWindow = window.open('', '_blank')
    const logoUrl = window.location.origin + '/image.jpg'
    const now = new Date()
    const dateStr = now.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })

    const medicationsTable = (prescription.medications || []).map((med, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td style="text-align:center;font-weight:600">${i + 1}</td>
        <td style="font-weight:600">${med.medication_name || ''}</td>
        <td style="text-align:center">${med.per_dose_amount || med.dosage || '-'}</td>
        <td style="text-align:center">${med.frequency_per_day ? med.frequency_per_day + ' marta' : med.frequency || '-'}</td>
        <td style="text-align:center">${med.duration_days ? med.duration_days + ' kun' : '-'}</td>
        <td>${med.instructions || '-'}</td>
      </tr>
    `).join('')

    const recommendationsList = (prescription.recommendations || []).map((r, i) => `
      <tr>
        <td style="text-align:center;width:30px;font-weight:600">${i + 1}.</td>
        <td>${r}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Retsept - ${prescription.prescription_number || ''}</title>
  <style>
    @page { size: A4; margin: 10mm 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm 15mm;
      background: #fff;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 3px solid #2e7d32;
      margin-bottom: 0;
    }
    .header-logo { width: 70px; height: 70px; object-fit: contain; }
    .header-center { text-align: center; flex: 1; padding: 0 15px; }
    .header-center .clinic-name {
      font-size: 22px;
      font-weight: 800;
      color: #2e7d32;
      letter-spacing: 1px;
    }
    .header-center .clinic-sub {
      font-size: 11px;
      color: #555;
      margin-top: 3px;
    }
    .header-right { text-align: right; font-size: 11px; color: #555; }
    .header-right div { margin-bottom: 2px; }

    /* Patient info */
    .patient-info {
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      border-top: none;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .patient-info table { width: 100%; border-collapse: collapse; }
    .patient-info td {
      padding: 4px 8px;
      font-size: 12px;
      vertical-align: middle;
    }
    .patient-info .label {
      font-weight: 700;
      color: #2e7d32;
      white-space: nowrap;
      width: 120px;
    }
    .patient-info .value {
      font-weight: 600;
      color: #1a1a1a;
      border-bottom: 1px solid #81c784;
    }
    .rx-number {
      font-size: 13px;
      font-weight: 700;
      color: #2e7d32;
      text-align: right;
    }

    /* Section title */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #2e7d32;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #a5d6a7;
    }

    /* Diagnosis box */
    .diagnosis-box {
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 4px;
      padding: 10px 14px;
      margin: 8px 0;
    }
    .diagnosis-box .label { font-weight: 700; color: #e65100; margin-bottom: 4px; }
    .diagnosis-box .value { font-size: 13px; }

    /* Disease tags */
    .disease-tags { margin: 8px 0; display: flex; gap: 10px; flex-wrap: wrap; }
    .disease-tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .disease-tag.primary { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .disease-tag.secondary { background: #f3e5f5; color: #7b1fa2; border: 1px solid #ce93d8; }

    /* Complaint */
    .complaint-box {
      background: #f5f5f5;
      border-left: 3px solid #2e7d32;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 13px;
    }
    .complaint-box .label { font-weight: 700; color: #333; }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 12px;
    }
    .data-table th {
      background: #2e7d32;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .data-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .data-table tr.even { background: #fafafa; }
    .data-table tr.odd { background: #fff; }
    .data-table tr:hover { background: #f1f8e9; }

    /* Recommendations */
    .rec-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    .rec-table td {
      padding: 5px 8px;
      font-size: 12px;
      border-bottom: 1px solid #e8e8e8;
      vertical-align: top;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #2e7d32;
    }
    .signature-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
    }
    .signature-line .sig {
      border-bottom: 1px solid #333;
      min-width: 200px;
      padding-bottom: 2px;
      text-align: center;
      font-size: 12px;
    }
    .footer-info {
      text-align: center;
      margin-top: 15px;
      font-size: 10px;
      color: #888;
    }

    /* Print */
    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none !important; }
    }

    .no-print {
      text-align: center;
      margin-top: 20px;
      padding: 15px;
    }
    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 0 5px;
    }
    .btn-print { background: #2e7d32; color: #fff; }
    .btn-print:hover { background: #1b5e20; }
    .btn-close { background: #757575; color: #fff; }
    .btn-close:hover { background: #616161; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <img src="${logoUrl}" class="header-logo" alt="Logo" />
    <div class="header-center">
      <div class="clinic-name">BOLAJON KLINIKASI</div>
      <div class="clinic-sub">Bolalar shifoxonasi</div>
    </div>
    <div class="header-right">
      <div><strong>Tel:</strong> +998 91 XXX XX XX</div>
      <div>bolajon.biznesjon.uz</div>
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-info">
    <table>
      <tr>
        <td class="label">F.I.O.:</td>
        <td class="value" colspan="3">${patient.first_name || ''} ${patient.last_name || ''}</td>
        <td class="rx-number" rowspan="2">Retsept №<br/>${prescription.prescription_number || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Bemor ID:</td>
        <td class="value">${patient.patient_number || 'N/A'}</td>
        <td class="label">Berilgan sana:</td>
        <td class="value">${dateStr}</td>
      </tr>
      <tr>
        <td class="label">Telefon:</td>
        <td class="value">${patient.phone || 'N/A'}</td>
        <td class="label">Turi:</td>
        <td class="value">${prescription.prescription_type === 'REGULAR' ? 'Oddiy' : prescription.prescription_type === 'URGENT' ? 'Shoshilinch' : 'Surunkali'}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Complaint -->
  ${prescription.complaint ? `
  <div class="complaint-box">
    <span class="label">Shikoyat:</span> ${prescription.complaint}
  </div>
  ` : ''}

  <!-- Diagnosis -->
  <div class="diagnosis-box">
    <div class="label">Tashxis:</div>
    <div class="value">${prescription.diagnosis || 'Kiritilmagan'}</div>
  </div>

  <!-- Disease tags -->
  ${(prescription.disease_name || prescription.secondary_disease_name) ? `
  <div class="disease-tags">
    ${prescription.disease_name ? `<span class="disease-tag primary">Kasallik: ${prescription.disease_name}</span>` : ''}
    ${prescription.secondary_disease_name ? `<span class="disease-tag secondary">Yondosh: ${prescription.secondary_disease_name}</span>` : ''}
  </div>
  ` : ''}

  <!-- Recommendations -->
  ${(prescription.recommendations && prescription.recommendations.length > 0) ? `
  <div class="section-title">Maslahatlar</div>
  <table class="rec-table">
    ${recommendationsList}
  </table>
  ` : ''}

  <!-- Medications -->
  <div class="section-title">Dorilar</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:30px;text-align:center">№</th>
        <th>Dori nomi</th>
        <th style="text-align:center">Dozasi</th>
        <th style="text-align:center">Kuniga</th>
        <th style="text-align:center">Davomiyligi</th>
        <th>Ko'rsatma</th>
      </tr>
    </thead>
    <tbody>
      ${medicationsTable}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="signature-line">
      <div><strong>Shifokor:</strong></div>
      <div class="sig">Dr. ${prescription.doctor_name || 'N/A'}</div>
    </div>
    <div class="footer-info">
      BOLAJON KLINIKASI &bull; Sog'ligingiz uchun g'amxo'rlik qilamiz!
    </div>
  </div>

  <!-- Buttons -->
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">Chop etish</button>
    <button class="btn btn-close" onclick="window.close()">Yopish</button>
  </div>

</body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 300)
  }
}

export default prescriptionService
