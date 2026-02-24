import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import laboratoryService from '../services/laboratoryService'
import labReagentService from '../services/labReagentService'
import toast, { Toaster } from 'react-hot-toast'
import DateInput from '../components/DateInput'

export default function LabOrders() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultForm, setResultForm] = useState({
    test_results: [],
    notes: ''
  })
  const [testParams, setTestParams] = useState([])
  const [loadingTestParams, setLoadingTestParams] = useState(false)
  const [tableRows, setTableRows] = useState([
    ['', ''],
    ['', ''],
    ['', ''],
    ['', '']
  ])

  // Биохимия uchun maxsus parametrlar
  const [biochemParams, setBiochemParams] = useState([
    { name: 'УМУМИЙ ОКСИЛ', value: '', normalRange: '66-85', unit: 'Г/Л' },
    { name: 'АЛБУМН', value: '', normalRange: '38-51', unit: 'Г/Л' },
    { name: 'ГЛЮКОЗА', value: '', normalRange: '4,2-6,4', unit: 'Ммоль/л' },
    { name: 'АЛТ', value: '', normalRange: '0-40', unit: 'Е/Л' },
    { name: 'АСТ', value: '', normalRange: '0-37', unit: 'Е/Л' },
    { name: 'УМУМИЙ БИЛЛИРУБИН', value: '', normalRange: '5-21', unit: 'Мкмоль/л' },
    { name: 'БОҒЛАНМАГАН БИЛЛИРУБИН', value: '', normalRange: '0-3,4', unit: 'Мкмоль/л' },
    { name: 'БОҒЛАНГАН БИЛЛИРУБИН', value: '', normalRange: '3,4-18,5', unit: 'Мкмоль/л' },
    { name: 'МОЧЕВИНА', value: '', normalRange: '1,7-8,3', unit: 'Ммоль/л' },
    { name: 'КРЕАТИНИН', value: '', normalRange: '53-97', unit: 'Мкмоль/л' },
    { name: 'КАЛИЙ', value: '', normalRange: '3,6-5,3', unit: 'Ммоль/л' },
    { name: 'КАЛЬЦИЙ', value: '', normalRange: '2,02-2,60', unit: 'Ммоль/л' },
    { name: 'ТЕМИР', value: '', normalRange: '6,4-28,6', unit: 'Ммоль/л' },
    { name: 'АЛЬФА-АМИЛАЗА', value: '', normalRange: '28-220', unit: 'Е/Л' },
    { name: 'УМУМИЙ ХОЛЕСТЕРИН', value: '', normalRange: '2,4-5,1', unit: 'Ммоль/л' },
    { name: 'С-РЕАКТИВ ОКСИЛ', value: '', normalRange: 'ОТР', unit: '' },
    { name: 'АНТИСТРЕПТОЛИЗИН-О', value: '', normalRange: 'ОТР', unit: '' },
    { name: 'РЕВМАТОИДЛИ ОМИЛ', value: '', normalRange: 'ОТР', unit: '' },
    { name: 'Ишқорий Фосфатаза', value: '', normalRange: '< 15 yosh<644, 15-17 yosh<483', unit: 'Е/Л' },
    { name: 'МАГНИЙ', value: '', normalRange: '0,8 - 1,0', unit: 'Ммоль/л' }
  ])

  // Умумий қон таҳлили uchun parametrlar
  const [bloodTestParams, setBloodTestParams] = useState([
    { name: 'WBC\nЛейкоциты', value: '', normalRange: '4,0\n9,0', unit: '10⁹/л' },
    { name: 'LYM#\nЛимфоциты', value: '', normalRange: '0,8\n4,0', unit: '10⁹/л' },
    { name: 'Mon#\nМоноциты', value: '', normalRange: '0,1\n1,2', unit: '10⁹/л' },
    { name: 'Neu#\nНейтрофилы', value: '', normalRange: '2,0\n7,0', unit: '10⁹/л' },
    { name: 'Lym%\nЛимфоциты', value: '', normalRange: '20,0\n40,0', unit: '%' },
    { name: 'Mon%\nМоноциты', value: '', normalRange: '5,0\n10,0', unit: '%' },
    { name: 'Neu%\nНейтрофилы', value: '', normalRange: '50,0\n70,0', unit: '%' },
    { name: 'RBC\nЭритроциты', value: '', normalRange: '3,9\n6,0', unit: '10¹²/л' },
    { name: 'HGB\nГемоглобин (М)', value: '', normalRange: '130,0\n170,0', unit: 'г/л' },
    { name: 'HGB\nГемоглобин (Ж)', value: '', normalRange: '120,0\n150,0', unit: 'г/л' },
    { name: 'HCT\nГематокрит (М)', value: '', normalRange: '42,0\n54,0', unit: '%' },
    { name: 'HCT\nГематокрит (Ж)', value: '', normalRange: '35,0\n45,0', unit: '%' },
    { name: 'MCV\nСредний корпускулярный объём эритроцитов', value: '', normalRange: '80,0\n95,0', unit: 'фл' },
    { name: 'MCH\nСредний эритроцитарный гемоглобин', value: '', normalRange: '26,0\n34,0', unit: 'пг' },
    { name: 'MCHC\nСредняя клеточная концентрация гемоглобина', value: '', normalRange: '300,0\n370,0', unit: 'г/л' },
    { name: 'RDW-CV\nКоэффициент вариации ширины распределения эритроцитов', value: '', normalRange: '11,5\n14,5', unit: '%' },
    { name: 'RDW-SD\nСтандартное отклонение ширины распределения эритроцитов', value: '', normalRange: '35,0\n45,0', unit: 'фл' },
    { name: 'PLT\nЧисло тромбоцитов', value: '', normalRange: '180,0\n320,0', unit: '10⁹/л' },
    { name: 'MPV\nСредний объём тромбоцитов', value: '', normalRange: '7,0\n11,0', unit: 'фл' },
    { name: 'PDW\nШирина распределения тромбоцитов', value: '', normalRange: '10,0\n18,0', unit: '' },
    { name: 'PCT\nТромбокрит', value: '', normalRange: '0,1\n0,4', unit: '%' },
    { name: 'ESR\nСОЭ (М)', value: '', normalRange: '2,0\n10,0', unit: 'мм/час' },
    { name: 'ESR\nСОЭ (Ж)', value: '', normalRange: '2,0\n15,0', unit: 'мм/час' }
  ])

  // Витамин Д uchun parametr
  const [vitaminDResult, setVitaminDResult] = useState('')

  // TORCH infeksiyasi uchun parametrlar
  const [torchParams, setTorchParams] = useState([
    { name: 'ЦМВ-Цитомегаловирус IgG', value: '', normalRange: '0-0.460\nОП' },
    { name: 'Hsv1/2-Герпес вирус IgG', value: '', normalRange: '0-0.480\nОП' },
    { name: 'Токсоплазма IgG', value: '', normalRange: '5.0-30\nКП' },
    { name: 'Микоплазма IgG', value: '', normalRange: '0-0.360\nОП' },
    { name: 'Уреаплазма IgG', value: '', normalRange: '0-0.354\nОП' },
    { name: 'Хламидия IgG', value: '', normalRange: '0-0.390\nОП' }
  ])

  // Сийдик таҳлили uchun parametrlar
  const [urineParams, setUrineParams] = useState({
    miqdori: '',
    rangi: '',
    tiniqlik: '',
    nisbiy_zichlik: '',
    reaktsiya: '',
    oqsil: '',
    qand: '',
    epiteliy: '',
    leykotsit: '',
    eritrotsit: '',
    tuzlar: '',
    bakteriya: '',
    shilimshiq: ''
  })

  // Гормон таҳлили uchun parametrlar
  const [hormoneParams, setHormoneParams] = useState([
    { name: 'ПРЛ-Пролактин', value: '', normalRange: 'Женщины 1.2-19.5 нг/мл\nНе беременные женщине 1,5-18,5 нг/мл\nМужчины 1,8-17,0 нг/мл', unit: 'нг/мл' },
    { name: 'Т3 свободный-Трийодтиронин', value: '', normalRange: '1,8-4,2', unit: 'нг/мл' },
    { name: 'Т4 свободный-Тироксин', value: '', normalRange: 'М: 0.8-2.2 мкг/дл\nЖ: 0.7-2.0 мкг/дл', unit: 'мкг/дл' },
    { name: 'ТТГ-Тиреотропный гормон', value: '', normalRange: '0.3-4.0', unit: 'ммл/дл' },
    { name: 'Т3 общий-Трийодтиронин', value: '', normalRange: '0.69-2.02', unit: 'нг/мл' },
    { name: 'Т4 общий-Тироксин', value: '', normalRange: 'М: 4.4-10.8 мкг/дл\nЖ: 4.8-11.6 мкг/дл', unit: 'мкг/дл' },
    { name: 'Анти ТПО-Антитела к тиреопероксидаза', value: '', normalRange: '0-34', unit: 'МЕ/мл' }
  ])

  // Онкомаркер таҳлили uchun parametrlar
  const [oncomarkerParams, setOncomarkerParams] = useState([
    { name: 'СА-125- рака яичников', value: '', normalRange: 'Муж: 0-35U/ml Жен: 0-35 U/ml\nБер: 1 трим 0-60 U/ml\nБер: 2 трим 0-150 U/ml\nБер: 3-трим 0-200 U/ml\nВ период лактации 0-80 U/ml\n0-28,0 U/ml', unit: '' },
    { name: 'СА-15-3- рака молочная железа', value: '', normalRange: '0-37,0 U/ml', unit: '' },
    { name: 'СА-19-9- рака поджелудочная железа', value: '', normalRange: '0-37,0 U/ml', unit: '' },
    { name: 'СА-72-4- рака желудка', value: '', normalRange: '0-4,0 U/ml', unit: '' },
    { name: 'ПСА- Простатический специфический антиген', value: '', normalRange: 'До 2,6 нг/мл (муж до 40лет)\nДо 4,0 нг/мл (муж старше 40лет)', unit: '' },
    { name: 'РЭА-раковый эмбриональный антиген', value: '', normalRange: '0-4,4 нг/мл ----курящие\n0,2-3,3 нг/мл ---некурящие', unit: '' }
  ])

  // Коагулограмма uchun parametrlar
  const [coagulogramParams, setCoagulogramParams] = useState([
    { name: 'ПТИ', value: '', normalRange: '80-100', unit: '%' },
    { name: 'ПТВ', value: '', normalRange: '10.8-16.2', unit: 'СЕК' },
    { name: 'МНО', value: '', normalRange: '0.8-1.2', unit: '' },
    { name: 'АЧТВ', value: '', normalRange: '25-41', unit: 'СЕК' },
    { name: 'ФибГ', value: '', normalRange: '2,0-4,0', unit: 'г/л' }
  ])

  // Липидный спектр uchun parametrlar
  const [lipidParams, setLipidParams] = useState([
    { name: 'Холестерин общий (ТС)', value: '', normalRange: 'Слабо повышенный уровень -5.7ммол/л\nПовышенный уровень -6.7ммол/л', unit: '' },
    { name: 'Холестерин-ЛПВП (HDL)', value: '', normalRange: 'Хороший прогноз- >М 1.42 Ж >1.68\nГруппа низкого риска- М 0.9-1.42\n- Ж 1.16-1.68\nГруппа высокого риска- М <0.9\n- Ж <1.16', unit: '' },
    { name: 'Холестерин-ЛПНП (LDL)', value: '', normalRange: 'Группа низкого риска ИБС- Муж <1.23\n- Жен <1.63\nГруппа высокого риска ИБС- Муж >4.45\n- Жен >4.32', unit: '' },
    { name: 'Холестерин-ЛПОНП', value: '', normalRange: '0.16-1.04ммол/л', unit: '' },
    { name: 'Триглицериды (TG)', value: '', normalRange: 'Рекомендуемый уровен-0.1-1.71\nПограничный уровень- 1.71-2.28', unit: '' }
  ])

  // Прокальцитонин uchun parametrlar (3 ta test)
  const [procalcitoninParams, setProcalcitoninParams] = useState([
    { name: 'Д-димер', value: '', normalRange: '0-285 нг/мл', unit: '' },
    { name: 'Прокальцитонин', value: '', normalRange: '>0,05 нг/мл', unit: '' },
    { name: 'Ферритин', value: '', normalRange: '80-120 нг/мл', unit: '' }
  ])

  // Тропонин uchun parametr
  const [troponinResult, setTroponinResult] = useState('')

  const [filters, setFilters] = useState({
    date: '',
    test_type: '',
    status: 'all',
    patient_search: ''
  })

  // Reagent state
  const [reagents, setReagents] = useState([])
  const [selectedReagent, setSelectedReagent] = useState(null)

  useEffect(() => {
    loadData()
    loadReagents()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersData = await laboratoryService.getOrders({ status: 'all' })
      if (ordersData.success) setOrders(ordersData.data)
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadReagents = async () => {
    try {
      const response = await labReagentService.getReagents({ status: 'active' })
      if (response.success) {
        setReagents(response.data.filter(r => r.status === 'active' && r.remaining_tests > 0))
      }
    } catch (error) {
      // silent
    }
  }

  const handleCollectSample = async (orderId) => {
    try {
      const response = await laboratoryService.updateOrderStatus(orderId, 'sample_collected')
      if (response.success) {
        toast.success('Namuna olindi')
        await loadData()

        // Namuna olingandan keyin darhol natija kiritish modalini ochish
        const order = orders.find(o => o.id === orderId)
        if (order) {
          handleOpenResultModal(order)
        }
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleOpenResultModal = (order) => {
    setSelectedOrder(order)
    setSelectedReagent(null)
    // Reset table to 4x2
    setTableRows([
      ['', ''],
      ['', ''],
      ['', ''],
      ['', '']
    ])
    // Reset biochem params
    setBiochemParams(biochemParams.map(p => ({ ...p, value: '' })))
    // Reset blood test params
    setBloodTestParams(bloodTestParams.map(p => ({ ...p, value: '' })))
    // Reset vitamin D
    setVitaminDResult('')
    // Reset TORCH params
    setTorchParams(torchParams.map(p => ({ ...p, value: '' })))
    // Reset urine params
    setUrineParams({
      miqdori: '',
      rangi: '',
      tiniqlik: '',
      nisbiy_zichlik: '',
      reaktsiya: '',
      oqsil: '',
      qand: '',
      epiteliy: '',
      leykotsit: '',
      eritrotsit: '',
      tuzlar: '',
      bakteriya: '',
      shilimshiq: ''
    })
    // Reset hormone params
    setHormoneParams(hormoneParams.map(p => ({ ...p, value: '' })))
    // Reset oncomarker params
    setOncomarkerParams(oncomarkerParams.map(p => ({ ...p, value: '' })))
    // Reset coagulogram params
    setCoagulogramParams(coagulogramParams.map(p => ({ ...p, value: '' })))
    // Reset lipid params
    setLipidParams(lipidParams.map(p => ({ ...p, value: '' })))
    // Reset procalcitonin params
    setProcalcitoninParams(procalcitoninParams.map(p => ({ ...p, value: '' })))
    // Reset troponin
    setTroponinResult('')
    setResultForm({ test_results: [], notes: '' })
    setShowResultModal(true)

    // Xizmat parametrlarini yuklash
    loadTestParameters(order)
  }

  // Xizmat parametrlarini yuklash
  const loadTestParameters = async (order) => {
    if (!order || !order.test_id) {
      setTestParams([])
      return
    }

    try {
      setLoadingTestParams(true)
      const response = await laboratoryService.getTestById(order.test_id)

      if (response.success && response.data && response.data.test_parameters) {
        const params = response.data.test_parameters.map(p => ({
          name: p.name || p.parameter,
          value: '',
          unit: p.unit || '',
          normalRange: p.normal_range || p.normalRange || ''
        }))
        setTestParams(params)
      } else {
        setTestParams([])
      }
    } catch (error) {
      setTestParams([])
    } finally {
      setLoadingTestParams(false)
    }
  }

  const addTableRow = () => {
    setTableRows([...tableRows, ['', '']])
  }

  const removeTableRow = (index) => {
    if (tableRows.length > 1) {
      const newRows = tableRows.filter((_, i) => i !== index)
      setTableRows(newRows)
    }
  }

  const updateTableCell = (rowIndex, colIndex, value) => {
    const newRows = [...tableRows]
    newRows[rowIndex][colIndex] = value
    setTableRows(newRows)
  }

  const handleSubmitResults = async () => {
    try {
      if (!selectedReagent) {
        toast.error('Iltimos, reaktiv tanlang')
        return
      }

      const isBiochemistry = selectedOrder?.test_name?.toLowerCase().includes('биохимия') ||
                             selectedOrder?.test_name?.toLowerCase().includes('biochem')

      const isBloodTest = selectedOrder?.test_name?.toLowerCase().includes('умумий қон') ||
                          selectedOrder?.test_name?.toLowerCase().includes('қон таҳлили') ||
                          selectedOrder?.test_name?.toLowerCase().includes('blood')

      const isVitaminD = selectedOrder?.test_name?.toLowerCase().includes('витамин д') ||
                         selectedOrder?.test_name?.toLowerCase().includes('витамин d') ||
                         selectedOrder?.test_name?.toLowerCase().includes('vitamin d')

      const isTorch = selectedOrder?.test_name?.toLowerCase().includes('торч') ||
                      selectedOrder?.test_name?.toLowerCase().includes('torch') ||
                      selectedOrder?.test_name?.toLowerCase().includes('тorch')

      const isUrine = selectedOrder?.test_name?.toLowerCase().includes('сийдик') ||
                      selectedOrder?.test_name?.toLowerCase().includes('сиёдик') ||
                      selectedOrder?.test_name?.toLowerCase().includes('мочи') ||
                      selectedOrder?.test_name?.toLowerCase().includes('urine')

      const isHormone = selectedOrder?.test_name?.toLowerCase().includes('гормон') ||
                        selectedOrder?.test_name?.toLowerCase().includes('hormone')

      const isOncomarker = selectedOrder?.test_name?.toLowerCase().includes('онкомаркер') ||
                           selectedOrder?.test_name?.toLowerCase().includes('oncomarker') ||
                           selectedOrder?.test_name?.toLowerCase().includes('онко')

      const isCoagulogram = selectedOrder?.test_name?.toLowerCase().includes('коагулограмма') ||
                            selectedOrder?.test_name?.toLowerCase().includes('коагуло') ||
                            selectedOrder?.test_name?.toLowerCase().includes('coagulo')

      const isLipid = selectedOrder?.test_name?.toLowerCase().includes('липид') ||
                      selectedOrder?.test_name?.toLowerCase().includes('lipid')

      const isProcalcitonin = selectedOrder?.test_name?.toLowerCase().includes('прокальцитонин') ||
                              selectedOrder?.test_name?.toLowerCase().includes('procalcitonin') ||
                              selectedOrder?.test_name?.toLowerCase().includes('прокал')

      const isTroponin = selectedOrder?.test_name?.toLowerCase().includes('тропонин') ||
                         selectedOrder?.test_name?.toLowerCase().includes('troponin') ||
                         selectedOrder?.test_name?.toLowerCase().includes('тропон')

      let test_results

      if (isBiochemistry) {
        const hasValues = biochemParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = biochemParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isBloodTest) {
        const hasValues = bloodTestParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = bloodTestParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isVitaminD) {
        if (!vitaminDResult.trim()) {
          toast.error('Natijani kiriting')
          return
        }

        test_results = [{
          parameter_name: '25-OH Vitamin D',
          value: vitaminDResult,
          unit: 'нг/мл',
          normal_range: 'Выраженный дефицит-0,1-9нг/мл\nДостоточный уровень-30-100нг/мл\nУмеренный дефицит-10-29нг/мл\nВозможен токсичуский эффект-101-200нг/мл',
          is_normal: null
        }]
      } else if (isTorch) {
        const hasValues = torchParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = torchParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: '',
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isUrine) {
        const hasValues = Object.values(urineParams).some(v => v.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = [
          { parameter_name: 'Миқдори', value: urineParams.miqdori, unit: 'л/мл', normal_range: '', is_normal: null },
          { parameter_name: 'Ранги', value: urineParams.rangi, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Тиниқлиги', value: urineParams.tiniqlik, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Нисбий зичлиги', value: urineParams.nisbiy_zichlik, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Реакция', value: urineParams.reaktsiya, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Оқсил', value: urineParams.oqsil, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Қанд', value: urineParams.qand, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Эпителий', value: urineParams.epiteliy, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Лейкоцит', value: urineParams.leykotsit, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Эритроцит', value: urineParams.eritrotsit, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Тузлар', value: urineParams.tuzlar, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Бактерия', value: urineParams.bakteriya, unit: '', normal_range: '', is_normal: null },
          { parameter_name: 'Шилимшиқ', value: urineParams.shilimshiq, unit: '', normal_range: '', is_normal: null }
        ].filter(p => p.value.trim() !== '')
      } else if (isHormone) {
        const hasValues = hormoneParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = hormoneParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isOncomarker) {
        const hasValues = oncomarkerParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = oncomarkerParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isCoagulogram) {
        const hasValues = coagulogramParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = coagulogramParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isLipid) {
        const hasValues = lipidParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = lipidParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isProcalcitonin) {
        const hasValues = procalcitoninParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = procalcitoninParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else if (isTroponin) {
        if (!troponinResult.trim()) {
          toast.error('Natijani kiriting')
          return
        }

        test_results = [{
          parameter_name: 'Тропонин',
          value: troponinResult,
          unit: '',
          normal_range: 'negative',
          is_normal: null
        }]
      } else if (testParams.length > 0) {
        const hasValues = testParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }

        test_results = testParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: null
          }))
      } else {
        // Oddiy tahlillar uchun
        const tableText = tableRows
          .filter(row => row[0] || row[1])
          .map(row => `${row[0]}\t${row[1]}`)
          .join('\n')

        test_results = [{
          parameter_name: 'Natija',
          value: tableText,
          unit: '',
          normal_range: '',
          is_normal: null
        }]
      }

      const response = await laboratoryService.submitResults(selectedOrder.id, {
        test_results,
        notes: resultForm.notes,
        reagent_id: selectedReagent._id,
        patient_id: selectedOrder.patient_id
      })

      if (response.success) {
        toast.success('Natijalar muvaffaqiyatli kiritildi va reaktiv ishlatildi')
        setShowResultModal(false)
        setSelectedOrder(null)
        setSelectedReagent(null)
        // Reset biochem params
        setBiochemParams(biochemParams.map(p => ({ ...p, value: '' })))
        // Reset blood test params
        setBloodTestParams(bloodTestParams.map(p => ({ ...p, value: '' })))
        // Reset vitamin D
        setVitaminDResult('')
        // Reset TORCH params
        setTorchParams(torchParams.map(p => ({ ...p, value: '' })))
        // Reset urine params
        setUrineParams({
          miqdori: '',
          rangi: '',
          tiniqlik: '',
          nisbiy_zichlik: '',
          reaktsiya: '',
          oqsil: '',
          qand: '',
          epiteliy: '',
          leykotsit: '',
          eritrotsit: '',
          tuzlar: '',
          bakteriya: '',
          shilimshiq: ''
        })
        // Reset hormone params
        setHormoneParams(hormoneParams.map(p => ({ ...p, value: '' })))
        // Reset oncomarker params
        setOncomarkerParams(oncomarkerParams.map(p => ({ ...p, value: '' })))
        // Reset coagulogram params
        setCoagulogramParams(coagulogramParams.map(p => ({ ...p, value: '' })))
        // Reset lipid params
        setLipidParams(lipidParams.map(p => ({ ...p, value: '' })))
        // Reset procalcitonin params
        setProcalcitoninParams(procalcitoninParams.map(p => ({ ...p, value: '' })))
        // Reset troponin
        setTroponinResult('')
        loadData()
        loadReagents()
      }
    } catch (error) {
      toast.error('Natijalarni kiritishda xatolik')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false
    if (filters.test_type && order.test_type !== filters.test_type) return false
    if (filters.date && !order.created_at.startsWith(filters.date)) return false
    if (filters.patient_search) {
      const search = filters.patient_search.toLowerCase()
      const patientName = `${order.patient_first_name} ${order.patient_last_name}`.toLowerCase()
      if (!patientName.includes(search) && !order.patient_number.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">assignment</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">LABORATORIYA BUYURTMALARI</h1>
            <p className="text-base sm:text-lg opacity-90">Barcha buyurtmalar ro'yxati</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <DateInput
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl"
            placeholder="Sana"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl"
          >
            <option value="all">Barcha statuslar</option>
            <option value="pending">Kutilmoqda</option>
            <option value="sample_collected">Namuna olingan</option>
            <option value="in_progress">Jarayonda</option>
            <option value="completed">Tayyor</option>
          </select>
          <input
            type="text"
            value={filters.patient_search}
            onChange={(e) => setFilters({ ...filters, patient_search: e.target.value })}
            className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl"
            placeholder="Bemor qidirish..."
          />
        </div>

        {/* Orders List */}
        <div className="space-y-2 sm:space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <span className="material-symbols-outlined text-xl sm:text-2xl text-primary">
                      person
                    </span>
                    <div>
                      <p className="font-bold text-base sm:text-lg">
                        {order.patient_first_name} {order.patient_last_name}
                      </p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600">{order.patient_number}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                    <p><span className="font-semibold">Tahlil:</span> {order.test_name}</p>
                    <p><span className="font-semibold">Sana:</span> {new Date(order.created_at).toLocaleString('uz-UZ')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:gap-2 sm:gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'sample_collected' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status === 'pending' ? '🟡 Kutilmoqda' :
                     order.status === 'sample_collected' ? '🔵 Namuna olingan' :
                     order.status === 'in_progress' ? '🟣 Jarayonda' :
                     '🟢 Tayyor'}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCollectSample(order.id)}
                      className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-600 text-sm sm:text-sm sm:text-base"
                    >
                      Namuna olish
                    </button>
                  )}
                  {order.status === 'sample_collected' && (
                    <button
                      onClick={() => handleOpenResultModal(order)}
                      className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-600 text-sm sm:text-sm sm:text-base"
                    >
                      Natija kiritish
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <div className="flex gap-2 sm:gap-2 sm:gap-3">
                      <button
                        onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                        className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-blue-600 text-sm sm:text-sm sm:text-base flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">picture_as_pdf</span>
                        PDF
                      </button>
                      <button
                        onClick={() => handleOpenResultModal(order)}
                        className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-orange-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-orange-600 text-sm sm:text-sm sm:text-base flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">edit</span>
                        Tahrirlash
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Natija kiritish</h3>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mb-4 p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-lg sm:rounded-xl">
                <p className="font-semibold">{selectedOrder.patient_first_name} {selectedOrder.patient_last_name}</p>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600">{selectedOrder.test_name}</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Reaktiv tanlash */}
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">
                    Qaysi reaktivdan foydalandingiz? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedReagent?._id || ''}
                    onChange={(e) => {
                      const reagent = reagents.find(r => r._id === e.target.value)
                      setSelectedReagent(reagent)
                    }}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Reaktiv tanlang...</option>
                    {reagents.map(reagent => (
                      <option key={reagent._id} value={reagent._id}>
                        {reagent.name} - {reagent.remaining_tests} ta qolgan ({new Intl.NumberFormat('uz-UZ').format(reagent.price_per_test)} so'm)
                      </option>
                    ))}
                  </select>
                  {selectedReagent && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                      <p className="text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Reaktiv:</span> {selectedReagent.name}
                      </p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Narx:</span> {new Intl.NumberFormat('uz-UZ').format(selectedReagent.price_per_test)} so'm
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Bu narx bemorga qarz sifatida yoziladi
                      </p>
                    </div>
                  )}
                </div>

                {/* Natija - Биохимия, Умумий қон таҳлили, Витамин Д, TORCH yoki oddiy */}
                {selectedOrder?.test_name?.toLowerCase().includes('биохимия') || selectedOrder?.test_name?.toLowerCase().includes('biochem') ? (
                  /* Биохимия uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border px-3 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base font-bold">№</th>
                            <th className="border px-3 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base font-bold">ТАҲЛИЛ НОМИ</th>
                            <th className="border px-3 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base font-bold">НАТИЖА</th>
                            <th className="border px-3 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base font-bold">МЕ'ЁР</th>
                            <th className="border px-3 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base font-bold">ЎЛЧОВ БИРЛИГИ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biochemParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border px-3 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base">{index + 1}.</td>
                              <td className="border px-3 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base font-semibold">{param.name}</td>
                              <td className="border px-2 py-2 sm:py-2.5">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...biochemParams]
                                    newParams[index].value = e.target.value
                                    setBiochemParams(newParams)
                                  }}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                                  placeholder="Қиймат"
                                />
                              </td>
                              <td className="border px-3 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-blue-600 font-medium whitespace-pre-line">{param.normalRange}</td>
                              <td className="border px-3 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-blue-600 font-medium">{param.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('умумий қон') || selectedOrder?.test_name?.toLowerCase().includes('қон таҳлили') || selectedOrder?.test_name?.toLowerCase().includes('blood')) ? (
                  /* Умумий қон таҳлили uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border px-2 py-2 sm:py-2.5 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Показатель</th>
                            <th className="border px-2 py-2 sm:py-2.5 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Результат</th>
                            <th className="border px-2 py-2 sm:py-2.5 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Норма<br/>Erkak | Ayol</th>
                            <th className="border px-2 py-2 sm:py-2.5 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Единица<br/>измерения</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bloodTestParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border px-2 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base font-semibold whitespace-pre-line">{param.name}</td>
                              <td className="border px-2 py-2 sm:py-2.5">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...bloodTestParams]
                                    newParams[index].value = e.target.value
                                    setBloodTestParams(newParams)
                                  }}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base text-center"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border px-2 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-blue-600 font-semibold text-center whitespace-pre-line">{param.normalRange}</td>
                              <td className="border px-2 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-blue-600 font-semibold text-center">{param.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('витамин д') || selectedOrder?.test_name?.toLowerCase().includes('витамин d') || selectedOrder?.test_name?.toLowerCase().includes('vitamin d')) ? (
                  /* Витамин Д uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-yellow-600">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-yellow-600">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-yellow-600">Норма</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center font-bold">25-OH Vitamin D</td>
                            <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                              <input
                                type="text"
                                value={vitaminDResult}
                                onChange={(e) => setVitaminDResult(e.target.value)}
                                className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                placeholder="Natijani kiriting"
                              />
                            </td>
                            <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm sm:text-base text-blue-600 font-semibold">
                              <div className="space-y-1">
                                <p>Выраженный дефицит-<span className="font-bold">0,1-9нг/мл</span></p>
                                <p>Достоточный уровень-<span className="font-bold">30-100нг/мл</span></p>
                                <p>Умеренный дефицит-<span className="font-bold">10-29нг/мл</span></p>
                                <p>Возможен токсичуский эффект-<span className="font-bold">101-200нг/мл</span></p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('торч') || selectedOrder?.test_name?.toLowerCase().includes('torch') || selectedOrder?.test_name?.toLowerCase().includes('тorch')) ? (
                  /* TORCH infeksiyasi uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-purple-600">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-purple-600">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-purple-600">Норма(ОП)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {torchParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left font-bold italic">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...torchParams]
                                    newParams[index].value = e.target.value
                                    setTorchParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold whitespace-pre-line">{param.normalRange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('сийдик') || selectedOrder?.test_name?.toLowerCase().includes('сиёдик') || selectedOrder?.test_name?.toLowerCase().includes('мочи') || selectedOrder?.test_name?.toLowerCase().includes('urine')) ? (
                  /* Сийдик таҳлили uchun forma */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl">
                        <h3 className="font-bold text-sm sm:text-base mb-3 text-blue-800 dark:text-blue-400">ФИЗИК-КИМЁВИЙ ХОССАСИ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Миқдори (л/мл)</label>
                            <input
                              type="text"
                              value={urineParams.miqdori}
                              onChange={(e) => setUrineParams({ ...urineParams, miqdori: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Ранги</label>
                            <input
                              type="text"
                              value={urineParams.rangi}
                              onChange={(e) => setUrineParams({ ...urineParams, rangi: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Тиниқлиги</label>
                            <input
                              type="text"
                              value={urineParams.tiniqlik}
                              onChange={(e) => setUrineParams({ ...urineParams, tiniqlik: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Нисбий зичлиги</label>
                            <input
                              type="text"
                              value={urineParams.nisbiy_zichlik}
                              onChange={(e) => setUrineParams({ ...urineParams, nisbiy_zichlik: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Реакция</label>
                            <input
                              type="text"
                              value={urineParams.reaktsiya}
                              onChange={(e) => setUrineParams({ ...urineParams, reaktsiya: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl">
                        <h3 className="font-bold text-sm sm:text-base mb-3 text-green-800 dark:text-green-400">МИКРОСКОПИЯ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Оқсил</label>
                            <input
                              type="text"
                              value={urineParams.oqsil}
                              onChange={(e) => setUrineParams({ ...urineParams, oqsil: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Қанд</label>
                            <input
                              type="text"
                              value={urineParams.qand}
                              onChange={(e) => setUrineParams({ ...urineParams, qand: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Эпителий</label>
                            <input
                              type="text"
                              value={urineParams.epiteliy}
                              onChange={(e) => setUrineParams({ ...urineParams, epiteliy: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Лейкоцит</label>
                            <input
                              type="text"
                              value={urineParams.leykotsit}
                              onChange={(e) => setUrineParams({ ...urineParams, leykotsit: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Эритроцит</label>
                            <input
                              type="text"
                              value={urineParams.eritrotsit}
                              onChange={(e) => setUrineParams({ ...urineParams, eritrotsit: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Тузлар</label>
                            <input
                              type="text"
                              value={urineParams.tuzlar}
                              onChange={(e) => setUrineParams({ ...urineParams, tuzlar: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Бактерия</label>
                            <input
                              type="text"
                              value={urineParams.bakteriya}
                              onChange={(e) => setUrineParams({ ...urineParams, bakteriya: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Шилимшиқ</label>
                            <input
                              type="text"
                              value={urineParams.shilimshiq}
                              onChange={(e) => setUrineParams({ ...urineParams, shilimshiq: e.target.value })}
                              className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                              placeholder="—"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('гормон') || selectedOrder?.test_name?.toLowerCase().includes('hormone')) ? (
                  /* Гормон таҳлили uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-orange-600">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-orange-600">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-orange-600">Норма</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-orange-600">Единица измерения</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hormoneParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left font-bold">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...hormoneParams]
                                    newParams[index].value = e.target.value
                                    setHormoneParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold whitespace-pre-line">{param.normalRange}</td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold">{param.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('онкомаркер') || selectedOrder?.test_name?.toLowerCase().includes('oncomarker') || selectedOrder?.test_name?.toLowerCase().includes('онко')) ? (
                  /* Онкомаркер таҳлили uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold text-red-600">Норма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oncomarkerParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left font-bold">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...oncomarkerParams]
                                    newParams[index].value = e.target.value
                                    setOncomarkerParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold whitespace-pre-line text-sm sm:text-sm sm:text-base">{param.normalRange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('коагулограмма') || selectedOrder?.test_name?.toLowerCase().includes('коагуло') || selectedOrder?.test_name?.toLowerCase().includes('coagulo')) ? (
                  /* Коагулограмма uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Таҳлил номи</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Натижа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Норма</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Ўлчов бирлиги</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coagulogramParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center font-bold">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...coagulogramParams]
                                    newParams[index].value = e.target.value
                                    setCoagulogramParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold">{param.normalRange}</td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold">{param.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('липид') || selectedOrder?.test_name?.toLowerCase().includes('lipid')) ? (
                  /* Липидный спектр uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Показатель</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Норма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lipidParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left font-bold">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...lipidParams]
                                    newParams[index].value = e.target.value
                                    setLipidParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="—"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-blue-600 font-semibold whitespace-pre-line text-sm sm:text-sm sm:text-base">{param.normalRange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('прокальцитонин') || selectedOrder?.test_name?.toLowerCase().includes('procalcitonin') || selectedOrder?.test_name?.toLowerCase().includes('прокал')) ? (
                  /* Прокальцитонин uchun jadval (3 ta test) */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Норма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {procalcitoninParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center font-bold">{param.name}</td>
                              <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...procalcitoninParams]
                                    newParams[index].value = e.target.value
                                    setProcalcitoninParams(newParams)
                                  }}
                                  className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                  placeholder="Natijani kiriting"
                                />
                              </td>
                              <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold">{param.normalRange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (selectedOrder?.test_name?.toLowerCase().includes('тропонин') || selectedOrder?.test_name?.toLowerCase().includes('troponin') || selectedOrder?.test_name?.toLowerCase().includes('тропон')) ? (
                  /* Тропонин uchun jadval */
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Natija *</label>
                    <div className="overflow-x-auto border rounded-lg sm:rounded-lg sm:rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Наименивование анализа</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Результат</th>
                            <th className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-sm sm:text-sm sm:text-base font-bold">Норма</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center font-bold">Тропонин</td>
                            <td className="border-2 border-gray-800 px-3 py-2 sm:py-3">
                              <input
                                type="text"
                                value={troponinResult}
                                onChange={(e) => setTroponinResult(e.target.value)}
                                className="w-full px-3 py-2 sm:py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-semibold"
                                placeholder="Natijani kiriting"
                              />
                            </td>
                            <td className="border-2 border-gray-800 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-center text-blue-600 font-semibold">negative</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : testParams.length > 0 ? (
                  /* Xizmat qo'shganda kiritilgan parametrlar jadvali */
                  <div>
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">description</span>
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                          Xizmat yaratishda qo'shilgan parametrlar jadvali
                        </p>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-7">
                        {testParams.length} ta parametr topildi
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-2 border-gray-300 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm font-bold text-gray-900 dark:text-white" style={{ width: '60px' }}>
                              №
                            </th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                              ТАҲЛИЛ НОМИ
                            </th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white" style={{ width: '200px' }}>
                              НАТИЖА
                            </th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400" style={{ width: '150px' }}>
                              МЕ'ЁР
                            </th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400" style={{ width: '150px' }}>
                              ЎЛЧОВ БИРЛИГИ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {testParams.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm text-gray-900 dark:text-white font-semibold">
                                {index + 1}.
                              </td>
                              <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white uppercase">
                                {param.name}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-700 px-2 py-2">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => {
                                    const newParams = [...testParams]
                                    newParams[index].value = e.target.value
                                    setTestParams(newParams)
                                  }}
                                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                                  placeholder="Қиймат"
                                />
                              </td>
                              <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                {param.normalRange}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                {param.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Oddiy tahlillar uchun jadval */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm sm:text-sm sm:text-base font-semibold">Natija *</label>
                      <button
                        type="button"
                        onClick={addTableRow}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base hover:bg-green-600 flex items-center gap-1"
                      >
                        <span className="text-base sm:text-lg">+</span>
                        Qator qo'shish
                      </button>
                    </div>

                    <div className="border rounded-lg sm:rounded-lg sm:rounded-xl overflow-hidden sm:block">
                      <table className="w-full">
                        <tbody>
                          {tableRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b last:border-b-0">
                              <td className="p-0 w-1/2 border-r">
                                <input
                                  type="text"
                                  value={row[0]}
                                  onChange={(e) => updateTableCell(rowIndex, 0, e.target.value)}
                                  className="w-full px-3 py-2 sm:py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Parametr"
                                />
                              </td>
                              <td className="p-0 w-1/2 relative">
                                <input
                                  type="text"
                                  value={row[1]}
                                  onChange={(e) => updateTableCell(rowIndex, 1, e.target.value)}
                                  className="w-full px-3 py-2 sm:py-2.5 pr-10 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Qiymat"
                                />
                                {tableRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTableRow(rowIndex)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
                                  >
                                    <span className="text-base sm:text-lg">−</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Izohlar */}
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Izohlar</label>
                  <textarea
                    value={resultForm.notes}
                    onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl"
                    rows="3"
                    placeholder="Qo'shimcha izohlar..."
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-6">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmitResults}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-600"
                >
                  Natijani yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
