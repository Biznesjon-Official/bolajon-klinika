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

  // Urgent pending prescriptions (for reception)
  getUrgentPending: async () => {
    try {
      const response = await api.get('/prescriptions/urgent-pending')
      return response.data
    } catch (error) {
      console.error('Get urgent pending error:', error)
      throw error
    }
  },

  // A4 formatda retsept chop etish
  printPrescriptionReceipt: (prescription, patient) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Popup bloklandi. Iltimos popup-blocker ni o\'chiring.')
      return
    }
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
    @page { size: A4; margin: 8mm 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
    }

    /* ===== HEADER ===== */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 10px;
      background: linear-gradient(135deg, #1a6fba 0%, #0ea5e9 60%, #22d3ee 100%);
      border-radius: 0 0 16px 16px;
      margin-bottom: 0;
    }
    .header-logo {
      width: 68px; height: 68px; object-fit: contain;
      background: #fff; border-radius: 50%; padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .header-center { text-align: center; flex: 1; padding: 0 12px; }
    .header-center .clinic-name {
      font-size: 21px; font-weight: 900; color: #fff;
      letter-spacing: 1.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .header-center .clinic-sub {
      font-size: 11px; color: #dbeafe; margin-top: 2px; font-weight: 600; letter-spacing: 0.5px;
    }
    .header-right { text-align: right; font-size: 11px; color: #dbeafe; font-weight: 600; }

    /* ===== RAINBOW STRIPE ===== */
    .rainbow {
      height: 5px;
      background: linear-gradient(to right, #f87171, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #e879f9);
      margin-bottom: 12px;
    }

    /* ===== PATIENT INFO ===== */
    .patient-info {
      background: #eff6ff;
      border: 2px solid #bfdbfe;
      border-radius: 10px;
      padding: 10px 14px;
      margin: 0 12px 12px;
    }
    .patient-info table { width: 100%; border-collapse: collapse; }
    .patient-info td { padding: 3px 8px; font-size: 12px; vertical-align: middle; }
    .patient-info .label { font-weight: 700; color: #1e40af; white-space: nowrap; width: 110px; }
    .patient-info .value { font-weight: 600; color: #1a1a1a; border-bottom: 1px dashed #93c5fd; }
    .rx-number {
      font-size: 12px; font-weight: 800; color: #1d4ed8;
      text-align: right; background: #dbeafe; border-radius: 6px;
      padding: 4px 8px; white-space: nowrap;
    }

    /* ===== SECTION TITLES ===== */
    .section-title {
      font-size: 13px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.6px; margin: 10px 12px 6px;
      padding: 5px 12px; border-radius: 6px;
      display: flex; align-items: center; gap: 6px;
    }
    .section-title.blue  { background: #dbeafe; color: #1e40af; border-left: 4px solid #2563eb; }
    .section-title.green { background: #dcfce7; color: #166534; border-left: 4px solid #16a34a; }
    .section-title.orange{ background: #ffedd5; color: #9a3412; border-left: 4px solid #ea580c; }
    .section-title.pink  { background: #fce7f3; color: #9d174d; border-left: 4px solid #db2777; }

    /* ===== DIAGNOSIS BOX ===== */
    .diagnosis-box {
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 8px; padding: 10px 14px; margin: 0 12px 8px;
    }
    .diagnosis-box td { padding: 3px 0; font-size: 12px; vertical-align: top; }
    .diagnosis-box .dlabel { font-weight: 700; color: #166534; width: 130px; }

    /* ===== COMPLAINT ===== */
    .complaint-box {
      background: #fff7ed; border-left: 4px solid #f97316;
      border-radius: 0 8px 8px 0; padding: 8px 12px;
      margin: 0 12px 8px; font-size: 12px; color: #7c2d12;
    }
    .complaint-box .label { font-weight: 700; }

    /* ===== TABLES ===== */
    .data-table {
      width: calc(100% - 24px); margin: 0 12px 8px;
      border-collapse: collapse; font-size: 12px;
      border-radius: 8px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .data-table th {
      background: #2563eb; color: #fff;
      padding: 7px 10px; text-align: left;
      font-weight: 700; font-size: 11px; text-transform: uppercase;
    }
    .data-table td { padding: 6px 10px; border-bottom: 1px solid #e0e7ff; }
    .data-table tr.even { background: #eff6ff; }
    .data-table tr.odd  { background: #fff; }

    /* ===== REC TABLE ===== */
    .rec-table { width: calc(100% - 24px); margin: 0 12px 8px; border-collapse: collapse; }
    .rec-table td { padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #e0e7ff; vertical-align: top; }
    .rec-table tr.even { background: #f0fdf4; }

    /* ===== FOOTER ===== */
    .footer {
      margin: 14px 12px 0;
      padding: 12px 14px 10px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
    }
    .signature-line {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;
    }
    .doctor-info { font-size: 12px; color: #334155; }
    .doctor-info strong { color: #1e40af; }
    .sig {
      border-bottom: 1.5px solid #2563eb; min-width: 180px;
      padding-bottom: 2px; text-align: center; font-size: 12px;
      font-weight: 700; color: #1e40af;
    }
    .social-row {
      display: flex; justify-content: center; gap: 20px;
      margin-top: 10px; font-size: 11px; flex-wrap: wrap;
    }
    .social-row span { display: flex; align-items: center; gap: 4px; color: #475569; font-weight: 600; }
    .social-tg   { color: #0ea5e9 !important; }
    .social-ig   { color: #db2777 !important; }
    .social-fb   { color: #2563eb !important; }
    .footer-brand {
      text-align: center; margin-top: 8px; font-size: 10px;
      color: #94a3b8; font-weight: 600; letter-spacing: 0.5px;
    }

    /* Print */
    @media print {
      .no-print { display: none !important; }
      .data-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .rainbow { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .no-print { text-align: center; margin: 18px 0 8px; }
    .btn { padding: 9px 22px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; margin: 0 5px; }
    .btn-print { background: #2563eb; color: #fff; }
    .btn-close  { background: #64748b; color: #fff; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <img src="${logoUrl}" class="header-logo" alt="Logo" />
    <div class="header-center">
      <div class="clinic-name">BOLAJON KLINIKASI</div>
      <div class="clinic-sub">GRAND SOXIB MEDLINE</div>
    </div>
    <div class="header-right">
      <div>&#128222; Call center:</div>
      <div style="font-size:13px;color:#fff;font-weight:800">+998 91 XXX XX XX</div>
    </div>
  </div>
  <div class="rainbow"></div>

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
        <td class="value">${prescription.prescription_type === 'REGULAR' ? 'Oddiy' : prescription.prescription_type === 'URGENT' ? '🔴 Shoshilinch' : 'Surunkali'}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Complaint -->
  ${prescription.complaint ? `
  <div class="complaint-box">
    <span class="label">&#128172; Shikoyat:</span> ${prescription.complaint}
  </div>` : ''}

  <!-- Diagnosis -->
  <div class="section-title blue">&#129657; Tashxis</div>
  <div class="diagnosis-box">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td class="dlabel">Tashxis:</td>
        <td>${prescription.diagnosis || 'Kiritilmagan'}</td>
      </tr>
      ${prescription.disease_name ? `<tr>
        <td class="dlabel">Kasallik:</td>
        <td>${prescription.disease_name}</td>
      </tr>` : ''}
      ${prescription.secondary_disease_name ? `<tr>
        <td class="dlabel">Yondosh kasallik:</td>
        <td>${prescription.secondary_disease_name}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- Recommendations -->
  ${(prescription.recommendations && prescription.recommendations.length > 0) ? `
  <div class="section-title green">&#9989; Maslahatlar</div>
  <table class="rec-table">
    ${recommendationsList}
  </table>` : ''}

  <!-- Medications -->
  <div class="section-title orange">&#128138; Dorilar</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:28px;text-align:center">№</th>
        <th>Dori nomi</th>
        <th style="text-align:center">Dozasi</th>
        <th style="text-align:center">Kuniga</th>
        <th style="text-align:center">Davomiyligi</th>
        <th>Ko'rsatma</th>
      </tr>
    </thead>
    <tbody>${medicationsTable}</tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="signature-line">
      <div class="doctor-info">
        <strong>Shifokor:</strong>
        ${prescription.doctor_phone ? `<span style="margin-left:8px;color:#64748b">&#128222; ${prescription.doctor_phone}</span>` : ''}
      </div>
      <div class="sig">Dr. ${prescription.doctor_name || 'N/A'}</div>
    </div>
    <div class="social-row">
      <span class="social-tg">&#9992; Telegram: @bolajon_klinika</span>
      <span class="social-ig">&#128247; Instagram: @bolajon_klinika</span>
      <span class="social-fb">&#128218; Facebook: Bolajon Klinika</span>
    </div>
    <div class="footer-brand">BOLAJON KLINIKASI &bull; GRAND SOXIB MEDLINE &bull; Farzandingiz sog'ligi uchun! &#128149;</div>
  </div>

  <!-- Buttons -->
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">&#128424; Chop etish</button>
    <button class="btn btn-close" onclick="window.close()">Yopish</button>
  </div>

</body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 300)
  },

  // Small printer format (58/80mm) for urgent prescriptions
  printSmallPrescription: (prescription, patient) => {
    const win = window.open('', '_blank', 'width=400,height=500')
    if (!win) return
    const now = new Date()
    const dateStr = now.toLocaleDateString('uz-UZ')
    const meds = (prescription.medications || []).filter(m => m.medication_name).map((med, i) =>
      `<p>${i + 1}. <b>${med.medication_name}</b> ${med.dosage || ''}<br>&nbsp;&nbsp;&nbsp;${med.instructions || med.frequency || ''}</p>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page{size:80mm auto;margin:4mm}
  body{font-family:monospace;font-size:12px;width:72mm;margin:0}
  h2{text-align:center;font-size:13px;margin:0 0 4px}
  p{margin:2px 0}
  hr{border:none;border-top:1px dashed #000;margin:5px 0}
  .center{text-align:center}
  .note{font-size:10px;font-style:italic}
  .no-print{text-align:center;margin-top:10px}
  @media print{.no-print{display:none}}
</style>
</head><body>
<h2>BOLAJON KLINIKASI</h2>
<p class="center">Dr: ${prescription.doctor_name || ''}</p>
<p class="center">Bemor: <b>${patient.first_name || ''} ${patient.last_name || ''}</b></p>
<p class="center">${dateStr}</p>
<hr>
<p><b>Tashxis:</b> ${prescription.diagnosis || ''}</p>
<hr>
${meds}
<hr>
${prescription.notes ? `<p class="note">${prescription.notes}</p><hr>` : ''}
${prescription.prescription_type === 'URGENT' ? '<p class="center" style="font-weight:bold;margin:6px 0;font-size:13px">* QABULXONAGA MUROJAAT QILING *</p><hr>' : ''}
<p class="center note">* Retsept bo'yicha</p>
<div class="no-print"><button onclick="window.print()">Chop etish</button> <button onclick="window.close()">Yopish</button></div>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }
}

export default prescriptionService
