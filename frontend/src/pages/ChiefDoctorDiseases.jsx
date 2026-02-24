import { useState, useEffect } from 'react'
import diseaseService from '../services/diseaseService'
import toast from 'react-hot-toast'

export default function ChiefDoctorDiseases() {
  const [diseases, setDiseases] = useState([])
  const [diseaseSearch, setDiseaseSearch] = useState('')
  const [showDiseaseModal, setShowDiseaseModal] = useState(false)
  const [editingDisease, setEditingDisease] = useState(null)
  const [diseaseForm, setDiseaseForm] = useState({
    name: '', category: '', diagnoses: [], recommendations: [], can_be_secondary: true
  })
  const [newDiagnosis, setNewDiagnosis] = useState('')
  const [newRecommendation, setNewRecommendation] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [diseaseSearch])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await diseaseService.getAll({ search: diseaseSearch })
      if (response.success) {
        setDiseases(response.data)
      }
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const resetDiseaseForm = () => {
    setDiseaseForm({ name: '', category: '', diagnoses: [], recommendations: [], can_be_secondary: true })
    setNewDiagnosis('')
    setNewRecommendation('')
    setEditingDisease(null)
  }

  const handleOpenDiseaseModal = (disease = null) => {
    if (disease) {
      setEditingDisease(disease)
      setDiseaseForm({
        name: disease.name,
        category: disease.category || '',
        diagnoses: disease.diagnoses || [],
        recommendations: disease.recommendations || [],
        can_be_secondary: disease.can_be_secondary !== false
      })
    } else {
      resetDiseaseForm()
    }
    setShowDiseaseModal(true)
  }

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.trim()) return
    setDiseaseForm(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, { text: newDiagnosis.trim(), is_default: true }]
    }))
    setNewDiagnosis('')
  }

  const handleAddRecommendation = () => {
    if (!newRecommendation.trim()) return
    setDiseaseForm(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, { text: newRecommendation.trim(), is_default: true }]
    }))
    setNewRecommendation('')
  }

  const handleSaveDisease = async () => {
    if (!diseaseForm.name.trim()) return toast.error('Kasallik nomini kiriting')
    try {
      if (editingDisease) {
        await diseaseService.update(editingDisease._id, diseaseForm)
        toast.success('Kasallik yangilandi')
      } else {
        await diseaseService.create(diseaseForm)
        toast.success('Kasallik qo\'shildi')
      }
      setShowDiseaseModal(false)
      resetDiseaseForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleDeleteDisease = async (id) => {
    if (!confirm('Kasallikni o\'chirmoqchimisiz?')) return
    try {
      await diseaseService.delete(id)
      toast.success('O\'chirildi')
      loadData()
    } catch (error) {
      toast.error('Xatolik')
    }
  }

  return (
    <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">medical_information</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">KASALLIKLAR BAZASI</h1>
            <p className="text-base sm:text-lg opacity-90">Tashxis va maslahatlar boshqaruvi</p>
          </div>
        </div>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            value={diseaseSearch}
            onChange={(e) => setDiseaseSearch(e.target.value)}
            placeholder="Kasallik qidirish..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => handleOpenDiseaseModal()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Yangi kasallik
        </button>
      </div>

      {/* Diseases grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : diseases.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">medical_information</span>
          <p className="text-gray-500">Kasalliklar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diseases.map(disease => (
            <div key={disease._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{disease.name}</h4>
                  {disease.category && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">{disease.category}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenDiseaseModal(disease)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => handleDeleteDisease(disease._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              {disease.diagnoses?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Tashxislar ({disease.diagnoses.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {disease.diagnoses.slice(0, 3).map((d, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">{d.text}</span>
                    ))}
                    {disease.diagnoses.length > 3 && <span className="text-xs text-gray-400">+{disease.diagnoses.length - 3}</span>}
                  </div>
                </div>
              )}
              {disease.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Maslahatlar ({disease.recommendations.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {disease.recommendations.slice(0, 2).map((r, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded">{r.text}</span>
                    ))}
                    {disease.recommendations.length > 2 && <span className="text-xs text-gray-400">+{disease.recommendations.length - 2}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disease Modal */}
      {showDiseaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold">{editingDisease ? 'Kasallikni tahrirlash' : 'Yangi kasallik'}</h3>
              <button onClick={() => { setShowDiseaseModal(false); resetDiseaseForm() }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Kasallik nomi *</label>
                <input
                  type="text"
                  value={diseaseForm.name}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masalan: ORVI, Bronxit, Pnevmoniya..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Kategoriya</label>
                <input
                  type="text"
                  value={diseaseForm.category}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masalan: Nafas yo'llari, Yurak, Oshqozon..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={diseaseForm.can_be_secondary}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, can_be_secondary: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label className="text-sm">Yondosh kasallik sifatida ishlatilsin</label>
              </div>

              {/* Tashxislar */}
              <div>
                <label className="block text-sm font-semibold mb-2">Tashxislar</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDiagnosis())}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tashxis matni..."
                  />
                  <button onClick={handleAddDiagnosis} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {diseaseForm.diagnoses.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d.is_default}
                          onChange={() => {
                            const updated = [...diseaseForm.diagnoses]
                            updated[i] = { ...updated[i], is_default: !updated[i].is_default }
                            setDiseaseForm(prev => ({ ...prev, diagnoses: updated }))
                          }}
                          className="w-3.5 h-3.5 accent-green-500"
                        />
                        <span className="text-sm">{d.text}</span>
                      </div>
                      <button onClick={() => setDiseaseForm(prev => ({ ...prev, diagnoses: prev.diagnoses.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maslahatlar */}
              <div>
                <label className="block text-sm font-semibold mb-2">Maslahatlar</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecommendation())}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Maslahat matni..."
                  />
                  <button onClick={handleAddRecommendation} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {diseaseForm.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={r.is_default}
                          onChange={() => {
                            const updated = [...diseaseForm.recommendations]
                            updated[i] = { ...updated[i], is_default: !updated[i].is_default }
                            setDiseaseForm(prev => ({ ...prev, recommendations: updated }))
                          }}
                          className="w-3.5 h-3.5 accent-amber-500"
                        />
                        <span className="text-sm">{r.text}</span>
                      </div>
                      <button onClick={() => setDiseaseForm(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowDiseaseModal(false); resetDiseaseForm() }} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleSaveDisease} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90">
                {editingDisease ? 'Yangilash' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
