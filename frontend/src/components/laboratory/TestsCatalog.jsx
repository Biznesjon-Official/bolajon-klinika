import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import laboratoryService from '../../services/laboratoryService'
import api from '../../services/api'

// Pre-built test parameter templates
const TEST_TEMPLATES = {
  'CBC': {
    name: 'Umumiy qon tahlili (OAK)',
    label: 'Umumiy qon tahlili',
    parameters: [
      { parameter: 'WBC — Лейкоциты', unit: '10⁹/л', normalRange: '4.0 — 9.0' },
      { parameter: 'Lym# — Лимфоциты', unit: '10⁹/л', normalRange: '0.8 — 4.0' },
      { parameter: 'Mon# — Моноциты', unit: '10⁹/л', normalRange: '0.1 — 1.2' },
      { parameter: 'Neu# — Нейтрофилы', unit: '10⁹/л', normalRange: '2.0 — 7.0' },
      { parameter: 'Lym% — Лимфоциты', unit: '%', normalRange: '20.0 — 40.0' },
      { parameter: 'Mon% — Моноциты', unit: '%', normalRange: '5.0 — 10.0' },
      { parameter: 'Neu% — Нейтрофилы', unit: '%', normalRange: '50.0 — 70.0' },
      { parameter: 'RBC — Эритроциты', unit: '10¹²/л', normalRange: '3.9 — 6.0' },
      { parameter: 'HGB — Гемоглобин (М)', unit: 'г/л', normalRange: '130.0 — 170.0' },
      { parameter: 'HGB — Гемоглобин (Ж)', unit: 'г/л', normalRange: '120.0 — 150.0' },
      { parameter: 'HCT — Гематокрит (М)', unit: '%', normalRange: '42.0 — 54.0' },
      { parameter: 'HCT — Гематокрит (Ж)', unit: '%', normalRange: '35.0 — 45.0' },
      { parameter: 'MCV — Средний корпускулярный объём эритроцитов', unit: 'фл', normalRange: '80.0 — 95.0' },
      { parameter: 'MCH — Средний эритроцитарный гемоглобин', unit: 'пг', normalRange: '26.0 — 34.0' },
      { parameter: 'MCHC — Средняя клеточная концентрация гемоглобина', unit: 'г/л', normalRange: '300.0 — 370.0' },
      { parameter: 'RDW-CV — Коэффициент вариации ширины распределения эритроцитов', unit: '%', normalRange: '11.5 — 14.5' },
      { parameter: 'RDW-SD — Стандартное отклонение ширины распределения эритроцитов', unit: 'фл', normalRange: '35.0 — 45.0' },
      { parameter: 'PLT — Число тромбоцитов', unit: '10⁹/л', normalRange: '180.0 — 320.0' },
      { parameter: 'MPV — Средний объём тромбоцитов', unit: 'фл', normalRange: '7.0 — 11.0' },
      { parameter: 'PDW — Ширина распределения тромбоцитов', unit: '', normalRange: '10.0 — 18.0' },
      { parameter: 'PCT — Тромбокрит', unit: '%', normalRange: '0.1 — 0.4' },
      { parameter: 'ESR — СОЭ (М)', unit: 'мм/час', normalRange: '2.0 — 10.0' },
      { parameter: 'ESR — СОЭ (Ж)', unit: 'мм/час', normalRange: '2.0 — 15.0' },
      { parameter: 'Qon ivish vaqti (boshlanishi)', unit: 'sek', normalRange: '30" — 2\'' },
      { parameter: 'Qon ivish vaqti (Suxarev usuli, tugashi)', unit: 'sek', normalRange: '3\' — 5\'' },
    ]
  },
  'URINE': {
    name: 'Umumiy siydik tahlili (OAM)',
    label: 'Umumiy siydik tahlili',
    parameters: [
      { parameter: 'Rangi', unit: '', normalRange: 'Somon sariq' },
      { parameter: 'Tiniqlik', unit: '', normalRange: 'Tiniq' },
      { parameter: 'Solishtirma og\'irlik', unit: '', normalRange: '1.010 — 1.025' },
      { parameter: 'pH', unit: '', normalRange: '5.0 — 7.0' },
      { parameter: 'Oqsil (Protein)', unit: 'g/L', normalRange: '0 — 0.033' },
      { parameter: 'Glyukoza', unit: 'mmol/L', normalRange: 'Manfiy' },
      { parameter: 'Bilirubin', unit: '', normalRange: 'Manfiy' },
      { parameter: 'Urobilinogen', unit: '', normalRange: 'Norma' },
      { parameter: 'Ketonlar', unit: '', normalRange: 'Manfiy' },
      { parameter: 'Nitritlar', unit: '', normalRange: 'Manfiy' },
      { parameter: 'Leykotsitlar', unit: 'ko\'ruv maydonida', normalRange: '0 — 5' },
      { parameter: 'Eritrotsitlar', unit: 'ko\'ruv maydonida', normalRange: '0 — 2' },
      { parameter: 'Epiteliy hujayralari', unit: 'ko\'ruv maydonida', normalRange: '0 — 5' },
      { parameter: 'Tuzlar', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'Bakteriyalar', unit: '', normalRange: 'Topilmadi' },
    ]
  },
  'BIOCHEM': {
    name: 'Biokimyoviy qon tahlili',
    label: 'Biokimyoviy tahlil',
    parameters: [
      { parameter: 'Glyukoza', unit: 'mmol/L', normalRange: '3.3 — 5.5' },
      { parameter: 'Umumiy oqsil', unit: 'g/L', normalRange: '65 — 85' },
      { parameter: 'Albumin', unit: 'g/L', normalRange: '35 — 50' },
      { parameter: 'Umumiy bilirubin', unit: 'mkmol/L', normalRange: '3.4 — 20.5' },
      { parameter: 'To\'g\'ri bilirubin', unit: 'mkmol/L', normalRange: '0 — 5.1' },
      { parameter: 'ALT', unit: 'U/L', normalRange: '0 — 40' },
      { parameter: 'AST', unit: 'U/L', normalRange: '0 — 40' },
      { parameter: 'Ishqoriy fosfataza (ALP)', unit: 'U/L', normalRange: '40 — 150' },
      { parameter: 'GGT', unit: 'U/L', normalRange: '0 — 55' },
      { parameter: 'Kreatinin', unit: 'mkmol/L', normalRange: '44 — 97' },
      { parameter: 'Mochevina (BUN)', unit: 'mmol/L', normalRange: '2.5 — 8.3' },
      { parameter: 'Siydik kislotasi', unit: 'mkmol/L', normalRange: '150 — 420' },
      { parameter: 'Xolesterin (umumiy)', unit: 'mmol/L', normalRange: '3.0 — 5.2' },
      { parameter: 'Triglitseridlar', unit: 'mmol/L', normalRange: '0.5 — 1.7' },
      { parameter: 'Temir (Fe)', unit: 'mkmol/L', normalRange: '9.0 — 30.0' },
      { parameter: 'Kaltsiy (Ca)', unit: 'mmol/L', normalRange: '2.15 — 2.55' },
      { parameter: 'Kaliy (K)', unit: 'mmol/L', normalRange: '3.5 — 5.0' },
      { parameter: 'Natriy (Na)', unit: 'mmol/L', normalRange: '136 — 145' },
    ]
  },
  'COAGULATION': {
    name: 'Koagulogramma',
    label: 'Koagulogramma',
    parameters: [
      { parameter: 'Protrombin vaqti (PT)', unit: 'sek', normalRange: '11 — 15' },
      { parameter: 'PTI (Protrombin indeksi)', unit: '%', normalRange: '70 — 120' },
      { parameter: 'INR', unit: '', normalRange: '0.85 — 1.15' },
      { parameter: 'Fibrinogen', unit: 'g/L', normalRange: '2.0 — 4.0' },
      { parameter: 'APTT', unit: 'sek', normalRange: '25 — 35' },
      { parameter: 'Trombin vaqti', unit: 'sek', normalRange: '14 — 21' },
    ]
  },
  'THYROID': {
    name: 'Tireoid gormonlar',
    label: 'Qalqonsimon bez',
    parameters: [
      { parameter: 'TSH', unit: 'mIU/L', normalRange: '0.4 — 4.0' },
      { parameter: 'T3 (erkin)', unit: 'pmol/L', normalRange: '3.1 — 6.8' },
      { parameter: 'T4 (erkin)', unit: 'pmol/L', normalRange: '12 — 22' },
      { parameter: 'T3 (umumiy)', unit: 'nmol/L', normalRange: '1.2 — 2.7' },
      { parameter: 'T4 (umumiy)', unit: 'nmol/L', normalRange: '60 — 120' },
      { parameter: 'Anti-TPO', unit: 'IU/mL', normalRange: '0 — 35' },
    ]
  },
  'COPRO': {
    name: 'Koprologiya (najas tahlili)',
    label: 'Koprologiya',
    parameters: [
      { parameter: 'Rangi', unit: '', normalRange: 'Jigarrang' },
      { parameter: 'Konsistensiya', unit: '', normalRange: 'Yumshoq/Shakllangan' },
      { parameter: 'Hid', unit: '', normalRange: 'Xarakterli' },
      { parameter: 'pH', unit: '', normalRange: '6.0 — 8.0' },
      { parameter: 'Shilliq', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'Qon', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'Muskul tolalari', unit: '', normalRange: 'Oz miqdorda' },
      { parameter: 'Yog\' tomchilari', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'Kraxmal', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'O\'simlik tolalari', unit: '', normalRange: 'Oz miqdorda' },
      { parameter: 'Leykotsitlar', unit: 'ko\'ruv maydonida', normalRange: '0 — 5' },
      { parameter: 'Eritrotsitlar', unit: 'ko\'ruv maydonida', normalRange: 'Topilmadi' },
      { parameter: 'Parazit tuxumlari', unit: '', normalRange: 'Topilmadi' },
      { parameter: 'Protozoylar', unit: '', normalRange: 'Topilmadi' },
    ]
  },
}

export default function TestsCatalog({ tests, onRefresh, t }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [formData, setFormData] = useState({
    test_name: '',
    price: '',
    description: '',
    turnaround_time: '',
    category: ''
  })
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfTableData, setPdfTableData] = useState([])
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await laboratoryService.getCategories()
      if (res.success) setCategories(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  // Filter tests by selected category
  const filteredTests = selectedCategory
    ? tests.filter(t => t.category === selectedCategory.name)
    : tests

  // Count tests per category
  const getTestCount = (catName) => tests.filter(t => t.category === catName).length

  // ========== CATEGORY CRUD ==========
  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '' })
    setShowCategoryModal(true)
  }

  const handleEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name, description: cat.description || '' })
    setShowCategoryModal(true)
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await laboratoryService.updateCategory(editingCategory._id, categoryForm)
        toast.success('Kategoriya yangilandi')
      } else {
        await laboratoryService.createCategory(categoryForm)
        toast.success('Kategoriya yaratildi')
      }
      setShowCategoryModal(false)
      loadCategories()
      onRefresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleDeleteCategory = async (cat) => {
    const count = getTestCount(cat.name)
    if (count > 0) {
      toast.error(`Bu kategoriyada ${count} ta test bor. Avval testlarni o'chiring`)
      return
    }
    if (!window.confirm(`"${cat.name}" kategoriyasini o'chirmoqchimisiz?`)) return
    try {
      await laboratoryService.deleteCategory(cat._id)
      toast.success('Kategoriya o\'chirildi')
      if (selectedCategory?._id === cat._id) setSelectedCategory(null)
      loadCategories()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // ========== TEST CRUD ==========
  const handleAdd = (presetCategory = '') => {
    setEditingTest(null)
    setFormData({
      test_name: '',
      price: '',
      description: '',
      turnaround_time: '',
      category: presetCategory || ''
    })
    setPdfFile(null)
    setPdfTableData([])
    setShowAddModal(true)
  }

  const handleEdit = (test) => {
    setEditingTest(test)
    setFormData({
      test_name: test.test_name || '',
      price: test.price || '',
      description: test.description || '',
      turnaround_time: test.turnaround_time || '',
      category: test.category || ''
    })
    setPdfFile(null)
    setPdfTableData([])
    setShowAddModal(true)
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Faqat PDF fayl yuklash mumkin')
      return
    }
    setPdfFile(file)
    setUploadingPdf(true)
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const response = await api.post('/laboratory/parse-pdf', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        toast.success(response.data.message || 'PDF yuklandi')
        if (response.data.data) {
          const pdfData = response.data.data
          setFormData(prev => ({
            ...prev,
            test_name: pdfData.test_name || prev.test_name,
            description: pdfData.description || prev.description
          }))
          if (pdfData.table_data?.length > 0) {
            setPdfTableData(pdfData.table_data)
          } else {
            setPdfTableData([{ parameter: '', value: '', unit: '', normalRange: '' }])
          }
        }
      }
    } catch (error) {
      toast.error('PDF yuklashda xatolik: ' + (error.response?.data?.message || error.message))
      setPdfFile(null)
      setPdfTableData([])
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const backendData = {
        name: formData.test_name,
        category: formData.category || 'Umumiy',
        price: formData.price,
        description: formData.description,
        duration_minutes: formData.turnaround_time ? parseInt(formData.turnaround_time) * 60 : null,
        test_parameters: pdfTableData.length > 0 ? pdfTableData.map(row => ({
          name: row.parameter,
          unit: row.unit,
          normal_range: row.normalRange
        })) : []
      }
      if (editingTest) {
        await laboratoryService.updateTest(editingTest.id, backendData)
        toast.success('Test yangilandi')
      } else {
        await laboratoryService.createTest(backendData)
        toast.success('Test qo\'shildi')
      }
      setShowAddModal(false)
      setPdfTableData([])
      onRefresh()
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDelete = async (testId) => {
    if (!window.confirm('Ushbu testni o\'chirmoqchimisiz?')) return
    try {
      await laboratoryService.deleteTest(testId)
      toast.success('Test o\'chirildi')
      onRefresh()
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-4">
      {/* Categories Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">category</span>
            Bo'limlar
          </h3>
          <button
            onClick={handleAddCategory}
            className="px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 flex items-center gap-1 text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Bo'lim qo'shish
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Bo'limlar topilmadi</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {/* All categories button */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                !selectedCategory
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-lg">apps</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Barchasi</span>
              </div>
              <p className="text-xs text-gray-500">{tests.length} ta test</p>
            </button>

            {categories.map(cat => (
              <div
                key={cat._id}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer group relative ${
                  selectedCategory?._id === cat._id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{cat.name}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(cat) }}
                      className="p-0.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat) }}
                      className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-xs text-gray-400 truncate">{cat.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{getTestCount(cat.name)} ta test</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tests Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {selectedCategory ? `${selectedCategory.name} testlari` : 'Barcha testlar'}
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredTests.length})</span>
          </h3>
          <button
            onClick={() => handleAdd(selectedCategory?.name || '')}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Test qo'shish
          </button>
        </div>

        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">science</span>
            <p className="text-gray-500 font-semibold">
              {selectedCategory ? `"${selectedCategory.name}" bo'limida testlar yo'q` : 'Testlar topilmadi'}
            </p>
            <button
              onClick={() => handleAdd(selectedCategory?.name || '')}
              className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
            >
              Test qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTests.map((test) => (
              <div key={test.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white break-words flex-1 text-sm">{test.test_name}</h4>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(test)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => handleDelete(test.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{test.category}</span>
                  <span className="text-sm font-bold text-primary">{(test.price || 0).toLocaleString()} so'm</span>
                </div>
                {test.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{test.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <form onSubmit={handleCategorySubmit} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim'}
                </h3>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Nomi *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  required
                  placeholder="Masalan: Gematologiya"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tavsif</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  rows="2"
                  placeholder="Qisqacha tavsif..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold">
                  Bekor
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-sm font-semibold">
                  {editingCategory ? 'Yangilash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{editingTest ? 'Testni tahrirlash' : 'Yangi test qo\'shish'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Test nomi *</label>
                  <input
                    type="text"
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Narxi (so'm) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tayyorlanish vaqti (soat)</label>
                    <input
                      type="number"
                      value={formData.turnaround_time}
                      onChange={(e) => setFormData({ ...formData, turnaround_time: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Bo'lim (kategoriya) *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    required
                  >
                    <option value="">Bo'lim tanlang...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    rows="2"
                  />
                </div>

                {!editingTest && (
                  <>
                    {/* Template & PDF section */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Template selector */}
                      <div className="flex-1 relative">
                        <label className="block text-sm font-semibold mb-2">
                          Tayyor shablon
                          <span className="text-gray-500 text-xs ml-2">(Parametrlarni avtomatik to'ldiradi)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                          className="w-full px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">description</span>
                          Shablondan tanlash
                          <span className="material-symbols-outlined text-sm">{showTemplateMenu ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showTemplateMenu && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                            {Object.entries(TEST_TEMPLATES).map(([key, tmpl]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setPdfTableData(tmpl.parameters.map(p => ({ ...p })))
                                  if (!formData.test_name) {
                                    setFormData(prev => ({ ...prev, test_name: tmpl.name }))
                                  }
                                  setShowTemplateMenu(false)
                                  toast.success(`"${tmpl.label}" shabloni yuklandi — ${tmpl.parameters.length} ta parametr`)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                              >
                                <div>
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{tmpl.label}</p>
                                  <p className="text-xs text-gray-500">{tmpl.parameters.length} ta parametr</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PDF upload */}
                      <div className="flex-1">
                        <label className="block text-sm font-semibold mb-2">
                          Natija varaqasi (PDF)
                          <span className="text-gray-500 text-xs ml-2">(Ixtiyoriy)</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-center">
                          <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" id="pdf-upload" disabled={uploadingPdf} />
                          <label htmlFor="pdf-upload" className="cursor-pointer flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-gray-400">upload_file</span>
                            {pdfFile ? (
                              <span className="text-sm font-semibold text-green-600">{pdfFile.name}</span>
                            ) : uploadingPdf ? (
                              <span className="text-sm text-gray-600">Yuklanmoqda...</span>
                            ) : (
                              <span className="text-sm text-gray-600 font-semibold">PDF yuklash</span>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {pdfTableData.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">table_chart</span>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Natija varaqasi jadvali</h4>
                          </div>
                          <button type="button" onClick={() => setPdfTableData([...pdfTableData, { parameter: '', value: '', unit: '', normalRange: '' }])}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Qator
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead className="bg-blue-100 dark:bg-blue-900/40">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold border">Parametr</th>
                                <th className="px-3 py-2 text-left font-semibold border">Birlik</th>
                                <th className="px-3 py-2 text-left font-semibold border">Me'yor</th>
                                <th className="px-3 py-2 text-center font-semibold border w-16">Amal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pdfTableData.map((row, index) => (
                                <tr key={index}>
                                  <td className="px-2 py-2 border">
                                    <input type="text" value={row.parameter}
                                      onChange={(e) => { const d = [...pdfTableData]; d[index].parameter = e.target.value; setPdfTableData(d) }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800" placeholder="Parametr" />
                                  </td>
                                  <td className="px-2 py-2 border">
                                    <input type="text" value={row.unit}
                                      onChange={(e) => { const d = [...pdfTableData]; d[index].unit = e.target.value; setPdfTableData(d) }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800" placeholder="Birlik" />
                                  </td>
                                  <td className="px-2 py-2 border">
                                    <input type="text" value={row.normalRange}
                                      onChange={(e) => { const d = [...pdfTableData]; d[index].normalRange = e.target.value; setPdfTableData(d) }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800" placeholder="Me'yor" />
                                  </td>
                                  <td className="px-2 py-2 text-center border">
                                    <button type="button" onClick={() => setPdfTableData(pdfTableData.filter((_, i) => i !== index))}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded">
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {pdfTableData.length === 0 && (
                      <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Yuqoridagi shablondan tanlang yoki qo'lda yarating</p>
                        <button type="button" onClick={() => setPdfTableData([{ parameter: '', value: '', unit: '', normalRange: '' }])}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto text-sm">
                          <span className="material-symbols-outlined">add_circle</span>
                          Qo'lda jadval yaratish
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                    Bekor
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 font-semibold text-sm">
                    {editingTest ? 'Yangilash' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
