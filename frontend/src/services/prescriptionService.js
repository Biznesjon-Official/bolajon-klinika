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

    // SVG icons
    const iconPhone = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 0117 1.18 2 2 0 0119 3.18v3a2 2 0 01-1.45 1.93 15.94 15.94 0 00-1.25 3.77 2 2 0 01-.5 1.85l-1.21 1.21a16 16 0 006.29 6.29l1.21-1.21a2 2 0 011.85-.5 15.94 15.94 0 003.77 1.25A2 2 0 0122 16.92z"/></svg>`
    const iconChat = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
    const iconStethoscope = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M4.8 2.3A.3.3 0 105 2H4"/><path d="M4 2h1M4 8h1"/><path d="M5 2a4 4 0 004 4"/><path d="M9 6v3.5a6 6 0 006 6v0a6 6 0 006-6V6"/><circle cx="21" cy="6" r="1"/><circle cx="15" cy="16" r="1"/></svg>`
    const iconCheck = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`
    const iconPill = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3"/><circle cx="18" cy="18" r="4"/><path d="M18 14v8M14 18h8"/></svg>`
    const iconPrinter = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`
    const iconHeart = `<svg width="11" height="11" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" stroke-width="1" style="display:inline-block;vertical-align:middle;margin:0 2px"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`
    const iconTelegram = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.283c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.938z"/></svg>`
    const iconInstagram = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`
    const iconFacebook = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`
    const iconUrgent = `<svg width="11" height="11" viewBox="0 0 24 24" fill="#dc2626" style="display:inline-block;vertical-align:middle;margin-right:2px"><circle cx="12" cy="12" r="10"/></svg>`

    const prescriptionTypeLabel = prescription.prescription_type === 'REGULAR'
      ? 'Oddiy'
      : prescription.prescription_type === 'URGENT'
        ? `<span style="display:inline-flex;align-items:center;gap:3px;background:#fee2e2;color:#b91c1c;padding:1px 7px;border-radius:4px;font-weight:700">${iconUrgent} Shoshilinch</span>`
        : 'Surunkali'

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
      <tr class="${i % 2 === 0 ? 'even' : ''}">
        <td style="text-align:center;width:30px;font-weight:700;color:#0f766e">${i + 1}.</td>
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
      padding: 12px 18px 11px;
      background: linear-gradient(135deg, #0f7ea0 0%, #0d9488 55%, #6ee7b7 100%);
      border-radius: 0 0 18px 18px;
      margin-bottom: 0;
    }
    .header-logo {
      width: 68px; height: 68px; object-fit: contain;
      background: #fff; border-radius: 50%; padding: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.22);
    }
    .header-center { text-align: center; flex: 1; padding: 0 12px; }
    .header-center .clinic-name {
      font-size: 21px; font-weight: 900; color: #fff;
      letter-spacing: 1.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.25);
    }
    .header-center .clinic-sub {
      font-size: 11px; color: #ccfbf1; margin-top: 2px; font-weight: 600; letter-spacing: 0.5px;
    }
    .header-right {
      text-align: right; font-size: 11px; color: #ccfbf1; font-weight: 600;
      display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
    }
    .header-phone {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; color: #fff; font-weight: 800;
    }

    /* ===== RAINBOW STRIPE ===== */
    .rainbow {
      height: 5px;
      background: linear-gradient(to right, #f87171, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #e879f9);
      margin-bottom: 12px;
    }

    /* ===== PATIENT INFO ===== */
    .patient-info {
      background: #f0fdfa;
      border: 1.5px solid #99f6e4;
      border-radius: 12px;
      padding: 10px 14px;
      margin: 0 12px 12px;
      box-shadow: 0 1px 4px rgba(13,148,136,0.07);
    }
    .patient-info table { width: 100%; border-collapse: collapse; }
    .patient-info td { padding: 3px 8px; font-size: 12px; vertical-align: middle; }
    .patient-info .label { font-weight: 700; color: #0f766e; white-space: nowrap; width: 110px; }
    .patient-info .value { font-weight: 600; color: #1a1a1a; border-bottom: 1px dashed #5eead4; }
    .rx-number {
      font-size: 12px; font-weight: 800; color: #0f766e;
      text-align: right; background: #ccfbf1; border-radius: 8px;
      padding: 5px 10px; white-space: nowrap;
      border: 1.5px solid #99f6e4;
    }

    /* ===== SECTION TITLES ===== */
    .section-title {
      font-size: 13px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.6px; margin: 10px 12px 6px;
      padding: 5px 12px; border-radius: 7px;
      display: flex; align-items: center; gap: 6px;
    }
    .section-title.blue   { background: #e0f2fe; color: #0369a1; border-left: 5px solid #0ea5e9; }
    .section-title.green  { background: #dcfce7; color: #166534; border-left: 5px solid #16a34a; }
    .section-title.orange { background: #fff7ed; color: #9a3412; border-left: 5px solid #ea580c; }
    .section-title.teal   { background: #ccfbf1; color: #0f766e; border-left: 5px solid #0d9488; }

    /* ===== DIAGNOSIS BOX ===== */
    .diagnosis-box {
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 10px; padding: 10px 14px; margin: 0 12px 8px;
      box-shadow: 0 1px 3px rgba(22,163,74,0.06);
    }
    .diagnosis-box td { padding: 4px 0; font-size: 12px; vertical-align: top; }
    .diagnosis-box .dlabel { font-weight: 700; color: #166534; width: 130px; }

    /* ===== COMPLAINT ===== */
    .complaint-box {
      background: #fff7ed; border-left: 5px solid #f97316;
      border-radius: 0 10px 10px 0; padding: 8px 14px;
      margin: 0 12px 8px; font-size: 12px; color: #7c2d12;
      border-top: 1px solid #fed7aa; border-bottom: 1px solid #fed7aa;
      border-right: 1px solid #fed7aa;
    }
    .complaint-box .clabel { font-weight: 700; display: flex; align-items: center; margin-bottom: 2px; }

    /* ===== TABLES ===== */
    .data-table {
      width: calc(100% - 24px); margin: 0 12px 8px;
      border-collapse: collapse; font-size: 12px;
      border-radius: 10px; overflow: hidden;
      box-shadow: 0 1px 5px rgba(0,0,0,0.08);
      border: 1.5px solid #99f6e4;
    }
    .data-table th {
      background: #0d9488; color: #fff;
      padding: 7px 10px; text-align: left;
      font-weight: 700; font-size: 11px; text-transform: uppercase;
    }
    .data-table td { padding: 6px 10px; border-bottom: 1px solid #e0f2fe; }
    .data-table tr.even { background: #f0fdfa; }
    .data-table tr.odd  { background: #fff; }

    /* ===== REC TABLE ===== */
    .rec-table { width: calc(100% - 24px); margin: 0 12px 8px; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
    .rec-table td { padding: 4px 10px; font-size: 12px; border-bottom: 1px solid #d1fae5; vertical-align: top; }
    .rec-table tr.even { background: #f0fdf4; }

    /* ===== FOOTER ===== */
    .footer {
      margin: 14px 12px 0;
      padding: 12px 16px 10px;
      background: #f0fdfa;
      border: 2px solid #99f6e4;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(13,148,136,0.08);
    }
    .signature-line {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding-bottom: 10px; border-bottom: 1.5px dashed #5eead4;
    }
    .doctor-info { font-size: 12px; color: #334155; line-height: 1.7; }
    .doctor-info .dname { font-size: 13px; font-weight: 800; color: #0f766e; }
    .doctor-info .dphone { display: flex; align-items: center; color: #0369a1; font-weight: 600; margin-top: 2px; }
    .sig-block { text-align: center; }
    .sig-label { font-size: 10px; color: #64748b; margin-bottom: 20px; }
    .sig-line {
      border-bottom: 1.5px solid #0d9488; min-width: 180px;
      padding-bottom: 2px; text-align: center; font-size: 11px;
      color: #0f766e; font-weight: 600;
    }
    .social-row {
      display: flex; justify-content: center; gap: 18px;
      margin-top: 10px; font-size: 11px; flex-wrap: wrap;
    }
    .social-row span { display: flex; align-items: center; gap: 3px; font-weight: 600; }
    .social-tg  { color: #0ea5e9; }
    .social-ig  { color: #db2777; }
    .social-fb  { color: #2563eb; }
    .footer-brand {
      text-align: center; margin-top: 8px; font-size: 10px;
      color: #94a3b8; font-weight: 600; letter-spacing: 0.5px;
    }

    /* Print */
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .no-print { display: none !important; }
    }
    .no-print { text-align: center; margin: 18px 0 8px; }
    .btn { padding: 9px 22px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; margin: 0 5px; display: inline-flex; align-items: center; }
    .btn-print { background: #0d9488; color: #fff; }
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
      <div>Call center:</div>
      <div class="header-phone">${iconPhone} +998 91 XXX XX XX</div>
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
        <td class="value">${prescriptionTypeLabel}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Complaint -->
  ${prescription.complaint ? `
  <div class="complaint-box">
    <div class="clabel">${iconChat} Shikoyat:</div>
    <div style="margin-left:16px">${prescription.complaint}</div>
  </div>` : ''}

  <!-- Diagnosis -->
  <div class="section-title blue">${iconStethoscope} Tashxis</div>
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
  <div class="section-title green">${iconCheck} Maslahatlar</div>
  <table class="rec-table">
    ${recommendationsList}
  </table>` : ''}

  <!-- Medications -->
  <div class="section-title teal">${iconPill} Dorilar</div>
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
        <div class="dname">Dr. ${prescription.doctor_name || 'N/A'}</div>
        ${prescription.doctor_phone ? `<div class="dphone">${iconPhone} ${prescription.doctor_phone}</div>` : ''}
      </div>
      <div class="sig-block">
        <div class="sig-label">Shifokor imzosi</div>
        <div class="sig-line">_________________________</div>
      </div>
    </div>
    <div class="social-row">
      <span class="social-tg">${iconTelegram} Telegram: @bolajon_klinika</span>
      <span class="social-ig">${iconInstagram} Instagram: @bolajon_klinika</span>
      <span class="social-fb">${iconFacebook} Facebook: Bolajon Klinika</span>
    </div>
    <div class="footer-brand">BOLAJON KLINIKASI &bull; GRAND SOXIB MEDLINE &bull; Farzandingiz sog'ligi uchun! ${iconHeart}</div>
  </div>

  <!-- Buttons -->
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">${iconPrinter} Chop etish</button>
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
