import { useState, useEffect } from 'react'
import prescriptionTemplateService from '../services/prescriptionTemplateService'
import toast from 'react-hot-toast'

const EMPTY_MED = {
  medication_name: '', dosage: '', per_dose_amount: '', frequency: '',
  frequency_per_day: '', schedule_times: [], duration_days: '', instructions: '', is_urgent: false
}

export default function ChiefDoctorPrescriptionTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '', diagnosis: '', medications: [{ ...EMPTY_MED }],
    recommendations: [], notes: ''
  })
  const [newRec, setNewRec] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await prescriptionTemplateService.getAll()
      if (res.success) setTemplates(res.data)
    } catch {
      toast.error('Yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (t = null) => {
    if (t) {
      setEditing(t)
      setForm({
        title: t.title,
        diagnosis: t.diagnosis || '',
        medications: t.medications?.length ? t.medications : [{ ...EMPTY_MED }],
        recommendations: t.recommendations || [],
        notes: t.notes || ''
      })
    } else {
      setEditing(null)
      setForm({ title: '', diagnosis: '', medications: [{ ...EMPTY_MED }], recommendations: [], notes: '' })
    }
    setNewRec('')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null) }

  const updateMed = (i, field, value) => {
    const meds = [...form.medications]
    meds[i] = { ...meds[i], [field]: value }
    setForm(prev => ({ ...prev, medications: meds }))
  }

  const addMed = () => setForm(prev => ({ ...prev, medications: [...prev.medications, { ...EMPTY_MED }] }))

  const removeMed = (i) => setForm(prev => ({ ...prev, medications: prev.medications.filter((_, idx) => idx !== i) }))

  const addRec = () => {
    if (!newRec.trim()) return
    setForm(prev => ({ ...prev, recommendations: [...prev.recommendations, newRec.trim()] }))
    setNewRec('')
  }

  const removeRec = (i) => setForm(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Shablon nomini kiriting')
    const validMeds = form.medications.filter(m => m.medication_name.trim())
    if (validMeds.length === 0) return toast.error('Kamida 1 ta dori kiriting')
    try {
      const payload = { ...form, medications: validMeds }
      if (editing) {
        await prescriptionTemplateService.update(editing._id, payload)
        toast.success('Yangilandi')
      } else {
        await prescriptionTemplateService.create(payload)
        toast.success('Shablon qo\'shildi')
      }
      closeModal()
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Shablonni o\'chirmoqchimisiz?')) return
    try {
      await prescriptionTemplateService.delete(id)
      toast.success('O\'chirildi')
      loadData()
    } catch {
      toast.error('Xatolik')
    }
  }

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.diagnosis?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">library_books</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">RETSEPT SHABLONLARI</h1>
            <p className="text-base sm:text-lg opacity-90">Tayyor dori to'plamlari boshqaruvi</p>
          </div>
        </div>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shablon qidirish..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Yangi shablon
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">library_books</span>
          <p className="text-gray-500">Shablonlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => (
            <div key={t._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{t.title}</h4>
                  {t.diagnosis && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.diagnosis}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => openModal(t)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">{t.medications?.length || 0} ta dori:</p>
                <div className="flex flex-wrap gap-1">
                  {t.medications?.slice(0, 3).map((m, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 rounded-full">
                      {m.medication_name}
                    </span>
                  ))}
                  {(t.medications?.length || 0) > 3 && (
                    <span className="text-xs text-gray-400">+{t.medications.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg sm:text-xl font-bold">{editing ? 'Shablonni tahrirlash' : 'Yangi shablon'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1">Shablon nomi *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Masalan: ORVI standard, Bronxit kuchli..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-semibold mb-1">Tashxis</label>
                <input
                  type="text"
                  value={form.diagnosis}
                  onChange={(e) => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="Masalan: ORVI, o'tkir respirator infektsiya..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">Dorilar *</label>
                  <button onClick={addMed} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Dori qo'shish
                  </button>
                </div>
                <div className="space-y-3">
                  {form.medications.map((med, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Dori #{i + 1}</span>
                        {form.medications.length > 1 && (
                          <button onClick={() => removeMed(i)} className="text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={med.medication_name}
                        onChange={(e) => updateMed(i, 'medication_name', e.target.value)}
                        placeholder="Dori nomi *"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                          placeholder="Dozaj (masalan: 500mg)"
                          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          value={med.per_dose_amount}
                          onChange={(e) => updateMed(i, 'per_dose_amount', e.target.value)}
                          placeholder="Miqdor (1 ta, 1 choy.q.)"
                          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number"
                          value={med.frequency_per_day}
                          onChange={(e) => updateMed(i, 'frequency_per_day', e.target.value)}
                          placeholder="Kuniga necha marta"
                          min="1"
                          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number"
                          value={med.duration_days}
                          onChange={(e) => updateMed(i, 'duration_days', e.target.value)}
                          placeholder="Necha kun"
                          min="1"
                          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                        placeholder="Ko'rsatma (ovqatdan keyin, suv bilan...)"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-semibold mb-2">Maslahatlar</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRec}
                    onChange={(e) => setNewRec(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRec())}
                    placeholder="Maslahat qo'shing..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={addRec} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {form.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <span className="text-sm">{r}</span>
                      <button onClick={() => removeRec(i)} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-1">Izoh</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows="2"
                  placeholder="Qo'shimcha izoh..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90">
                {editing ? 'Yangilash' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
