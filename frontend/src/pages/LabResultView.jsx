import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import laboratoryService from '../services/laboratoryService'
import toast from 'react-hot-toast'
import logoImage from '/image.jpg'

export default function LabResultView() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadResult()
  }, [orderId])

  const loadResult = async () => {
    try {
      setLoading(true)
      const response = await laboratoryService.getOrderResult(orderId)
      setResult(response.data)
    } catch (error) {
      toast.error('Natijani yuklashda xatolik')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleDownloadPDF = () => {
    toast.success('PDF uchun chop etish oynasida "PDF sifatida saqlash" ni tanlang', { duration: 4000 })
    setTimeout(() => window.print(), 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Natija yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">science</span>
          <p className="text-lg text-gray-500 mb-4">Natija topilmadi</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold">
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  // Test type detection
  const testName = (result.test_name || '').toLowerCase()
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

  // Title based on test type
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

  // Subtitle for special tests
  const needsSubtitle = isVitaminD || isTorch || isOncomarker || isProcalcitonin || isTroponin
  const subtitle = needsSubtitle ? 'Human mindray MR-96A (Иммуноферментный анализ)' : null

  // Table column config based on test type
  const getColumns = () => {
    if (isVitaminD || isTorch || isOncomarker || isProcalcitonin || isTroponin || isLipid) {
      return ['name', 'value', 'normal']
    }
    if (isUrine) return ['name', 'value_with_unit']
    return ['index', 'name', 'value', 'normal', 'unit']
  }

  const columns = getColumns()

  // Render result value with color
  const renderValue = (param) => {
    const isAbnormal = param.is_normal === false
    return (
      <span className={`font-semibold text-base ${isAbnormal ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
        {param.value || '—'}
      </span>
    )
  }

  // Render standard table
  const renderTable = () => {
    if (!result.test_results || result.test_results.length === 0) {
      return (
        <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <h3 className="font-bold text-lg mb-3">Натижа:</h3>
          <div className="whitespace-pre-wrap font-mono">{result.result_text || 'Натижа киритилмаган'}</div>
        </div>
      )
    }

    // Special: Urine - 2 tables
    if (isUrine) {
      return (
        <>
          <table className="w-full border-2 border-gray-800 mb-6">
            <thead>
              <tr className="bg-green-50">
                <th className="border-2 border-gray-800 px-4 py-3 text-left font-bold text-green-700" colSpan="2">ФИЗИК-КИМЁВИЙ ХОССАСИ</th>
              </tr>
            </thead>
            <tbody>
              {result.test_results.slice(0, 5).map((param, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border-2 border-gray-800 px-4 py-2.5 font-bold w-1/2">{param.parameter_name}</td>
                  <td className="border-2 border-gray-800 px-4 py-2.5 text-center">{renderValue(param)} {param.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full border-2 border-gray-800 mb-8">
            <thead>
              <tr className="bg-green-50">
                <th className="border-2 border-gray-800 px-4 py-3 text-left font-bold text-green-700" colSpan="2">МИКРОСКОПИЯ</th>
              </tr>
            </thead>
            <tbody>
              {result.test_results.slice(5).map((param, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border-2 border-gray-800 px-4 py-2.5 font-bold w-1/2">{param.parameter_name}</td>
                  <td className="border-2 border-gray-800 px-4 py-2.5 text-center">{renderValue(param)} {param.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )
    }

    // Special: Vitamin D - custom norma column
    if (isVitaminD) {
      return (
        <table className="w-full border-2 border-gray-800 mb-8">
          <thead>
            <tr className="bg-yellow-50">
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-yellow-700">Наименивование анализа</th>
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-yellow-700">Результат</th>
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-yellow-700">Норма</th>
            </tr>
          </thead>
          <tbody>
            {result.test_results.map((param, i) => (
              <tr key={i} className="bg-white">
                <td className="border-2 border-gray-800 px-4 py-3 text-center font-bold">{param.parameter_name}</td>
                <td className="border-2 border-gray-800 px-4 py-3 text-center">{renderValue(param)}</td>
                <td className="border-2 border-gray-800 px-4 py-3 text-sm text-blue-600 font-semibold">
                  <div className="space-y-0.5">
                    <p>Выраженный дефицит — <b>0,1-9 нг/мл</b></p>
                    <p>Достаточный уровень — <b>30-100 нг/мл</b></p>
                    <p>Умеренный дефицит — <b>10-29 нг/мл</b></p>
                    <p>Возможен токсический эффект — <b>101-200 нг/мл</b></p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    // Special: Coagulogram - 2 columns layout
    if (isCoagulogram) {
      return (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[0, 1].map(col => (
            <table key={col} className="w-full border-2 border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-2 border-gray-800 px-3 py-2.5 text-center font-bold text-sm">Таҳлил номи</th>
                  <th className="border-2 border-gray-800 px-3 py-2.5 text-center font-bold text-sm">Натижа</th>
                  <th className="border-2 border-gray-800 px-3 py-2.5 text-center font-bold text-sm">Норма</th>
                  <th className="border-2 border-gray-800 px-3 py-2.5 text-center font-bold text-sm">Ўлчов бирлиги</th>
                </tr>
              </thead>
              <tbody>
                {result.test_results.map((param, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-2 border-gray-800 px-3 py-2 text-center font-bold">{param.parameter_name}</td>
                    <td className="border-2 border-gray-800 px-3 py-2 text-center">{renderValue(param)}</td>
                    <td className="border-2 border-gray-800 px-3 py-2 text-center text-blue-600 font-semibold">{param.normal_range}</td>
                    <td className="border-2 border-gray-800 px-3 py-2 text-center text-blue-600 font-semibold">{param.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )
    }

    // Determine header style based on test type
    const headerColor = isBiochemistry ? 'bg-red-50 text-red-700' :
                        isBloodTest ? 'bg-red-50 text-red-700' :
                        isTorch ? 'bg-purple-50 text-purple-700' :
                        isHormone ? 'bg-orange-50 text-orange-700' :
                        (isOncomarker || isProcalcitonin || isTroponin) ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-100 text-gray-900'

    // 3-column tables (name, value, normal)
    if (columns.length === 3) {
      return (
        <table className="w-full border-2 border-gray-800 mb-8">
          <thead>
            <tr className={headerColor}>
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold">Наименивование анализа</th>
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold">Результат</th>
              <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold">Норма</th>
            </tr>
          </thead>
          <tbody>
            {result.test_results.map((param, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border-2 border-gray-800 px-4 py-2.5 font-bold">{param.parameter_name}</td>
                <td className="border-2 border-gray-800 px-4 py-2.5 text-center">{renderValue(param)}</td>
                <td className="border-2 border-gray-800 px-4 py-2.5 text-center text-blue-600 font-semibold whitespace-pre-line text-sm">{param.normal_range}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    // Default: 5-column table (index, name, value, normal, unit)
    return (
      <table className="w-full border-2 border-gray-800 mb-8">
        <thead>
          <tr className={headerColor}>
            <th className="border-2 border-gray-800 px-3 py-3 text-center font-bold w-[50px]">№</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-left font-bold">ТАҲЛИЛ НОМИ</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold w-[160px]">НАТИЖА</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-blue-700 w-[140px]">МЕ'ЁР</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-blue-700 w-[130px]">ЎЛЧОВ БИРЛИГИ</th>
          </tr>
        </thead>
        <tbody>
          {result.test_results.map((param, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border-2 border-gray-800 px-3 py-2.5 text-center font-semibold">{i + 1}.</td>
              <td className="border-2 border-gray-800 px-4 py-2.5 font-bold">{param.parameter_name}</td>
              <td className="border-2 border-gray-800 px-4 py-2.5 text-center">{renderValue(param)}</td>
              <td className="border-2 border-gray-800 px-4 py-2.5 text-center text-blue-600 font-semibold whitespace-pre-line text-sm">{param.normal_range}</td>
              <td className="border-2 border-gray-800 px-4 py-2.5 text-center text-blue-600 font-semibold">{param.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Toolbar - no-print */}
      <div className="no-print sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/lab')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="hidden sm:inline">Орқага</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
              result.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {result.status === 'completed' ? 'Tayyor' : 'Kutilmoqda'}
            </span>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 flex items-center gap-2 transition"
            >
              <span className="material-symbols-outlined text-xl">download</span>
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center gap-2 transition"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              <span className="hidden sm:inline">Чоп этиш</span>
            </button>
          </div>
        </div>
      </div>

      {/* A4 Content */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
        <div className="bg-white print:shadow-none shadow-xl rounded-2xl print:rounded-none p-6 sm:p-8 lg:p-10 print:p-[1cm]">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-5 border-b-2 border-green-600">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="Logo" className="w-20 h-20 object-contain rounded-xl print:w-16 print:h-16" />
              <div>
                <h1 className="text-2xl font-black text-gray-900">Bolajon Med Klinikasi</h1>
                <p className="text-sm text-gray-600">Диагностика ва даволаш маркази</p>
                <p className="text-xs text-gray-500 mt-1">052-рақамли тиббий хужжат шакли</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 leading-relaxed">
              <p className="font-semibold text-gray-700">Ўзбекистон Республикаси</p>
              <p>Соғлиқни сақлаш вазирининг</p>
              <p>2020 йил 31 декабрдаги</p>
              <p>№363-сонли буйруғи билан тасдиқланган</p>
            </div>
          </div>

          {/* Test Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-green-700 tracking-wide">{getTitle()}</h2>
            {subtitle && (
              <p className="text-sm text-red-600 font-bold mt-1">{subtitle}</p>
            )}
            {isCoagulogram && (
              <p className="text-base font-bold text-gray-700 mt-1">(Humaclot JUNIOR)</p>
            )}
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 print:bg-transparent print:p-0 print:mb-4">
            {!isCoagulogram ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Сана:</span>
                  <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[120px] pb-0.5">
                    {new Date(result.order_date).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Тартиб рақами:</span>
                  <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[120px] pb-0.5">
                    {result.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ёш:</span>
                  <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[80px] pb-0.5">
                    {result.patient_age ? `${result.patient_age} ёш` : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Сана:</span>
                <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[200px] pb-0.5">
                  {new Date(result.order_date).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            )}

            <div className="mt-2">
              <span className="text-gray-500 text-sm">{isCoagulogram ? 'ИФО:' : 'Фамилияси, Исми:'}</span>
              <span className="ml-2 font-black text-lg border-b-2 border-gray-400 inline-block min-w-[300px] sm:min-w-[400px] pb-0.5">
                {result.patient_name}
              </span>
            </div>

            {isCoagulogram && (
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Туғилган йили:</span>
                  <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[200px] pb-0.5">
                    {result.patient_birth_year || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Манзил:</span>
                  <span className="ml-2 font-bold border-b border-gray-400 inline-block min-w-[400px] pb-0.5">
                    {result.patient_address || '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            {renderTable()}
          </div>

          {/* Notes */}
          {result.notes && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 print:bg-transparent print:border-gray-300">
              <p className="font-bold text-sm mb-1 text-yellow-800">Изоҳлар:</p>
              <p className="text-sm text-gray-700">{result.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-5 border-t-2 border-gray-300">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500 mb-1">Лаборант:</p>
                <p className="font-bold border-b-2 border-gray-400 inline-block min-w-[250px] pb-1">
                  {result.laborant_name || '___________________'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Натижа тасдиқланди:</p>
                <p className="text-sm font-semibold">
                  {result.approved_at ? new Date(result.approved_at).toLocaleString('uz-UZ') : 'Тасдиқланмаган'}
                </p>
              </div>
            </div>
          </div>

          {/* Document note */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400">Ушбу ҳужжат электрон тарзда яратилган ва имзо талаб қилмайди</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0.5cm; }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
