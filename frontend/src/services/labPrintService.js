import api from './api'

const labPrintService = {
  // Fetch result data and print
  fetchAndPrint: async (resultId) => {
    const response = await api.get(`/laboratory/orders/${resultId}/result`)
    labPrintService.printResult(response.data.data)
  },

  // Print result directly (when data already loaded)
  printResult: (result) => {
    const logoUrl = window.location.origin + '/image.jpg'
    const testName = (result.test_name || '').toLowerCase()

    // Test type detection
    const isBiochemistry = testName.includes('биохимия') || testName.includes('biochem')
    const isBloodTest = testName.includes('умумий қон') || testName.includes('қон таҳлили') || testName.includes('blood')
    const isVitaminD = testName.includes('витамин д') || testName.includes('витамин d') || testName.includes('vitamin d')
    const isTorch = testName.includes('торч') || testName.includes('torch')
    const isUrine = testName.includes('сийдик') || testName.includes('сиёдик') || testName.includes('мочи') || testName.includes('urine')
    const isHormone = testName.includes('гормон') || testName.includes('hormone')
    const isOncomarker = testName.includes('онкомаркер') || testName.includes('oncomarker') || testName.includes('онко')
    const isCoagulogram = testName.includes('коагулограмма') || testName.includes('коагуло') || testName.includes('coagulo')
    const isLipid = testName.includes('липид') || testName.includes('lipid')
    const isProcalcitonin = testName.includes('прокальцитонин') || testName.includes('procalcitonin')
    const isTroponin = testName.includes('тропонин') || testName.includes('troponin')

    const getTitle = () => {
      if (isBiochemistry) return 'БИОХИМИК ТАҲЛИЛ'
      if (isBloodTest) return 'УМУМИЙ ҚОН ТАҲЛИЛИ'
      if (isVitaminD) return 'АНАЛИЗ КРОВИ НА ВИТАМИН D'
      if (isTorch) return 'АНАЛИЗ КРОВИ НА ТОРЧ ИНФЕКЦИЯ'
      if (isUrine) return 'СИЙДИК ТАҲЛИЛИ'
      if (isHormone) return 'ГОРМОН ТАҲЛИЛИ'
      if (isOncomarker) return 'АНАЛИЗ КРОВИ НА ОНКОМАРКЕРЫ'
      if (isCoagulogram) return 'Коагулограмма №'
      if (isLipid) return 'Липидный спектр №'
      if (isProcalcitonin) return 'Анализ крови на д-димер, прокальцитонин, ферритин №'
      if (isTroponin) return 'Анализ крови на Экспресс тест №'
      return result.test_name?.toUpperCase()
    }

    const needsSubtitle = isVitaminD || isTorch || isOncomarker || isProcalcitonin || isTroponin
    const subtitle = needsSubtitle ? 'Human mindray MR-96A (Иммуноферментный анализ)' : ''

    const buildResultsTable = () => {
      if (!result.test_results || result.test_results.length === 0) {
        return `<div style="padding:12px;background:#f9f9f9;border:1px solid #ccc;margin:10px 0;font-family:monospace;white-space:pre-wrap;">${result.result_text || 'Натижа киритилмаган'}</div>`
      }

      const renderValue = (param) => {
        const isAbnormal = param.is_normal === false
        const style = isAbnormal ? 'color:#c00;font-weight:700' : 'font-weight:600'
        return `<span style="${style}">${param.value || '—'}</span>`
      }

      if (isUrine) {
        const physRows = result.test_results.slice(0, 5).map((p, i) => `
          <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            <td style="font-weight:600">${p.parameter_name}</td>
            <td style="text-align:center">${renderValue(p)} ${p.unit || ''}</td>
          </tr>`).join('')
        const microRows = result.test_results.slice(5).map((p, i) => `
          <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            <td style="font-weight:600">${p.parameter_name}</td>
            <td style="text-align:center">${renderValue(p)} ${p.unit || ''}</td>
          </tr>`).join('')
        return `
          <div class="section-title">ФИЗИК-КИМЁВИЙ ХОССАСИ</div>
          <table class="data-table"><thead><tr><th>Кўрсаткич</th><th style="text-align:center">Натижа</th></tr></thead><tbody>${physRows}</tbody></table>
          <div class="section-title" style="margin-top:14px">МИКРОСКОПИЯ</div>
          <table class="data-table"><thead><tr><th>Кўрсаткич</th><th style="text-align:center">Натижа</th></tr></thead><tbody>${microRows}</tbody></table>`
      }

      if (isVitaminD) {
        const rows = result.test_results.map((p, i) => `
          <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            <td style="font-weight:600;text-align:center">${p.parameter_name}</td>
            <td style="text-align:center">${renderValue(p)}</td>
            <td style="font-size:11px;color:#333;line-height:1.6">
              Выраженный дефицит — <b>0,1-9 нг/мл</b><br/>
              Достаточный уровень — <b>30-100 нг/мл</b><br/>
              Умеренный дефицит — <b>10-29 нг/мл</b><br/>
              Возможен токсический эффект — <b>101-200 нг/мл</b>
            </td>
          </tr>`).join('')
        return `<table class="data-table"><thead><tr><th style="text-align:center">Наименование анализа</th><th style="text-align:center">Результат</th><th style="text-align:center">Норма</th></tr></thead><tbody>${rows}</tbody></table>`
      }

      const is3col = isTorch || isOncomarker || isHormone || isLipid || isProcalcitonin || isTroponin
      if (is3col) {
        const rows = result.test_results.map((p, i) => `
          <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            <td style="font-weight:600">${p.parameter_name}</td>
            <td style="text-align:center">${renderValue(p)}</td>
            <td style="text-align:center;font-size:11px;color:#333">${p.normal_range || ''}</td>
          </tr>`).join('')
        return `<table class="data-table"><thead><tr><th>Наименование анализа</th><th style="text-align:center">Результат</th><th style="text-align:center">Норма</th></tr></thead><tbody>${rows}</tbody></table>`
      }

      const rows = result.test_results.map((p, i) => `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td style="text-align:center;font-weight:600;width:30px">${i + 1}.</td>
          <td style="font-weight:600">${p.parameter_name}</td>
          <td style="text-align:center">${renderValue(p)}</td>
          <td style="text-align:center;font-size:11px;color:#333">${p.normal_range || ''}</td>
          <td style="text-align:center;font-size:11px;color:#333">${p.unit || ''}</td>
        </tr>`).join('')
      return `<table class="data-table"><thead><tr>
        <th style="width:30px;text-align:center">№</th>
        <th>ТАҲЛИЛ НОМИ</th>
        <th style="text-align:center">НАТИЖА</th>
        <th style="text-align:center">МЕ'ЁР</th>
        <th style="text-align:center">ЎЛЧОВ БИРЛИГИ</th>
      </tr></thead><tbody>${rows}</tbody></table>`
    }

    const dateStr = new Date(result.order_date).toLocaleDateString('uz-UZ')

    const patientInfoHtml = isCoagulogram ? `
      <table>
        <tr>
          <td class="label">Сана:</td>
          <td class="value">${dateStr}</td>
          <td class="label">Тартиб рақами:</td>
          <td class="value">${result.order_number || ''}</td>
        </tr>
        <tr>
          <td class="label">ИФО:</td>
          <td class="value" colspan="3" style="font-size:14px;font-weight:700">${result.patient_name}</td>
        </tr>
        <tr>
          <td class="label">Туғилган йили:</td>
          <td class="value">${result.patient_birth_year || '—'}</td>
          <td class="label">Манзил:</td>
          <td class="value">${result.patient_address || '—'}</td>
        </tr>
      </table>
    ` : `
      <table>
        <tr>
          <td class="label">Сана:</td>
          <td class="value">${dateStr}</td>
          <td class="label">Тартиб рақами:</td>
          <td class="value">${result.order_number || ''}</td>
          <td class="label">Ёш:</td>
          <td class="value">${result.patient_age ? result.patient_age + ' ёш' : '—'}</td>
        </tr>
        <tr>
          <td class="label">Фамилияси, Исми:</td>
          <td class="value" colspan="5" style="font-size:14px;font-weight:700">${result.patient_name}</td>
        </tr>
      </table>
    `

    const notesHtml = result.notes ? `
      <div style="background:#f9f9f9;border:1px solid #ccc;border-radius:4px;padding:10px 14px;margin:10px 0">
        <div style="font-weight:700;color:#000;margin-bottom:4px">Изоҳлар:</div>
        <div style="font-size:12px">${result.notes}</div>
      </div>
    ` : ''

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Таҳлил натижаси - ${result.order_number || ''}</title>
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
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 3px solid #000;
      margin-bottom: 0;
    }
    .header-logo { width: 70px; height: 70px; object-fit: contain; }
    .header-center { text-align: center; flex: 1; padding: 0 15px; }
    .header-center .clinic-name { font-size: 22px; font-weight: 800; color: #000; letter-spacing: 1px; }
    .header-center .clinic-sub { font-size: 11px; color: #333; margin-top: 3px; }
    .header-right { text-align: right; font-size: 11px; color: #555; line-height: 1.5; }
    .header-right div { margin-bottom: 2px; }
    .header-right .doc-number { font-weight: 700; color: #000; margin-top: 4px; font-size: 10px; }
    .patient-info {
      background: #f5f5f5;
      border: 1px solid #ccc;
      border-top: none;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .patient-info table { width: 100%; border-collapse: collapse; }
    .patient-info td { padding: 4px 8px; font-size: 12px; vertical-align: middle; }
    .patient-info .label { font-weight: 700; color: #000; white-space: nowrap; width: 130px; }
    .patient-info .value { font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #999; }
    .test-title { text-align: center; margin: 14px 0 6px; font-size: 16px; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
    .test-subtitle { text-align: center; font-size: 11px; color: #c00; font-weight: 600; margin-bottom: 10px; }
    .section-title { font-size: 13px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #999; }
    .data-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
    .data-table th { background: #333; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    .data-table td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
    .data-table tr.even { background: #fafafa; }
    .data-table tr.odd { background: #fff; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; }
    .signature-line { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
    .signature-line .sig { border-bottom: 1px solid #333; min-width: 200px; padding-bottom: 2px; text-align: center; font-size: 12px; }
    .footer-info { text-align: center; margin-top: 15px; font-size: 10px; color: #888; }
    .footer-contacts { text-align: center; margin-top: 6px; font-size: 10px; color: #666; }
    @media print { body { padding: 0; margin: 0; } .no-print { display: none !important; } }
    .no-print { text-align: center; margin-top: 20px; padding: 15px; }
    .btn { padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin: 0 5px; }
    .btn-print { background: #333; color: #fff; }
    .btn-print:hover { background: #111; }
    .btn-close { background: #757575; color: #fff; }
    .btn-close:hover { background: #616161; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" class="header-logo" alt="Logo" />
    <div class="header-center">
      <div class="clinic-name">BOLAJON KLINIKASI</div>
      <div class="clinic-sub">Болалар шифохонаси &bull; Диагностика ва даволаш маркази</div>
    </div>
    <div class="header-right">
      <div><strong>Ўзбекистон Республикаси</strong></div>
      <div>Соғлиқни сақлаш вазирининг</div>
      <div>2020 йил 31 декабрдаги</div>
      <div>№363-сонли буйруғи билан</div>
      <div>тасдиқланган</div>
      <div class="doc-number">052-рақамли тиббий ҳужжат шакли</div>
    </div>
  </div>
  <div class="patient-info">${patientInfoHtml}</div>
  <div class="test-title">${getTitle()}</div>
  ${subtitle ? `<div class="test-subtitle">${subtitle}</div>` : ''}
  ${isCoagulogram ? '<div style="text-align:center;font-weight:600;margin-bottom:10px">(Humaclot JUNIOR)</div>' : ''}
  ${buildResultsTable()}
  ${notesHtml}
  <div class="footer">
    <div class="signature-line">
      <div><strong>Лаборант:</strong></div>
      <div class="sig">${result.laborant_name || '___________________'}</div>
    </div>
    <div style="text-align:right;margin-top:8px;font-size:11px;color:#666">
      ${result.approved_at ? 'Тасдиқланган: ' + new Date(result.approved_at).toLocaleString('uz-UZ') : ''}
    </div>
    <div class="footer-info">
      BOLAJON KLINIKASI &bull; Фарзандингиз соғлиғи учун! &bull; Ушбу ҳужжат электрон тарзда яратилган
    </div>
    <div class="footer-contacts">
      <span><svg style="display:inline-block;vertical-align:middle;margin-right:3px" width="12" height="12" viewBox="0 0 24 24" fill="#666"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>+998 91 XXX XX XX</span>
      <span style="margin:0 8px;color:#ccc">|</span>
      <span><svg style="display:inline-block;vertical-align:middle;margin-right:3px" width="12" height="12" viewBox="0 0 24 24" fill="#666"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 4-1.74 6.67-2.89 8.02-3.45 3.82-1.6 4.62-1.88 5.14-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/></svg>@bolajon_klinika</span>
      <span style="margin:0 8px;color:#ccc">|</span>
      <span><svg style="display:inline-block;vertical-align:middle;margin-right:3px" width="12" height="12" viewBox="0 0 24 24" fill="#666"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z"/></svg>@bolajon_klinika</span>
    </div>
  </div>
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">Чоп этиш</button>
    <button class="btn btn-close" onclick="window.close()">Ёпиш</button>
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Popup bloklandi. Iltimos popup-blocker ni o\'chiring.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 300)
  }
}

export default labPrintService
