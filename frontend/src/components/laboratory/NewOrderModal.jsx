import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import laboratoryService from '../../services/laboratoryService'

export default function NewOrderModal({ isOpen, onClose, patients, doctors, tests, onSuccess, t, preselectedPatientId }) {
  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || '',
    doctor_id: '',
    priority: 'normal',
    notes: ''
  })
  const [selectedTests, setSelectedTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  // Testlarni kategoriya bo'yicha guruhlash
  const groupedTests = useMemo(() => {
    const groups = {}
    const filtered = tests.filter(test => {
      if (!searchQuery) return true
      return test.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             test.category?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    filtered.forEach(test => {
      const cat = test.category || 'Umumiy'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(test)
    })
    return groups
  }, [tests, searchQuery])

  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, testId) => {
      const test = tests.find(t => t.id === testId)
      return sum + (test?.price || 0)
    }, 0)
  }, [selectedTests, tests])

  const toggleTest = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    )
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const selectAllInCategory = (category) => {
    const categoryTestIds = groupedTests[category].map(t => t.id)
    const allSelected = categoryTestIds.every(id => selectedTests.includes(id))
    if (allSelected) {
      setSelectedTests(prev => prev.filter(id => !categoryTestIds.includes(id)))
    } else {
      setSelectedTests(prev => [...new Set([...prev, ...categoryTestIds])])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.patient_id || selectedTests.length === 0) {
      toast.error(t('lab.fillRequired'))
      return
    }

    try {
      setLoading(true)
      const results = await Promise.all(
        selectedTests.map(test_id =>
          laboratoryService.createOrder({
            ...formData,
            test_id
          })
        )
      )

      const successCount = results.filter(r => r.success).length
      toast.success(`${successCount} ta buyurtma yaratildi`)
      setSelectedTests([])
      onClose()
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-3 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('lab.newOrderTitle')}</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Bemor */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.patient')} <span className="text-red-500">*</span>
            </label>
            {preselectedPatientId ? (
              <div className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-semibold">
                {(() => {
                  const p = patients.find(p => (p.id || p._id) === preselectedPatientId)
                  return p ? `${p.first_name} ${p.last_name}${p.patient_number ? ' - ' + p.patient_number : ''}` : 'Bemor tanlangan'
                })()}
              </div>
            ) : (
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">{t('lab.selectPatient')}</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} - {patient.patient_number}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Shifokor */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.doctor')}
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">{t('lab.selectDoctor')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Tahlillar tanlash */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tahlillar <span className="text-red-500">*</span>
              {selectedTests.length > 0 && (
                <span className="ml-2 text-primary">({selectedTests.length} ta tanlandi)</span>
              )}
            </label>

            {/* Qidiruv */}
            <div className="relative mb-2">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tahlil nomini qidiring..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            {/* Kategoriyalar */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-[300px] overflow-y-auto">
              {Object.keys(groupedTests).length === 0 ? (
                <p className="p-4 text-center text-gray-500 text-sm">Tahlil topilmadi</p>
              ) : (
                Object.entries(groupedTests).map(([category, categoryTests]) => {
                  const isExpanded = expandedCategories[category] !== false
                  const selectedInCategory = categoryTests.filter(t => selectedTests.includes(t.id)).length
                  const allSelected = selectedInCategory === categoryTests.length

                  return (
                    <div key={category} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      {/* Kategoriya header */}
                      <div
                        className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">
                            {isExpanded ? 'expand_more' : 'chevron_right'}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{category}</span>
                          <span className="text-xs text-gray-500">({categoryTests.length})</span>
                          {selectedInCategory > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                              {selectedInCategory} tanlandi
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectAllInCategory(category) }}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          {allSelected ? 'Bekor' : 'Barchasini'}
                        </button>
                      </div>

                      {/* Testlar */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                          {categoryTests.map(test => {
                            const isSelected = selectedTests.includes(test.id)
                            return (
                              <label
                                key={test.id}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleTest(test.id)}
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                  />
                                  <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {test.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                  {(test.price || 0).toLocaleString()} so'm
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Tanlangan testlar summary */}
          {selectedTests.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-green-800 dark:text-green-200">Tanlangan tahlillar:</span>
                <span className="text-lg font-black text-green-700 dark:text-green-300">
                  {totalPrice.toLocaleString()} so'm
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTests.map(testId => {
                  const test = tests.find(t => t.id === testId)
                  return (
                    <span
                      key={testId}
                      className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200 px-2 py-1 rounded-full"
                    >
                      {test?.name}
                      <button
                        type="button"
                        onClick={() => toggleTest(testId)}
                        className="hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Muhimlik */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.priority')}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'normal', label: t('lab.normalPriority'), activeClass: 'bg-primary text-white' },
                { value: 'urgent', label: t('lab.urgent'), activeClass: 'bg-orange-600 text-white' },
                { value: 'stat', label: t('lab.stat'), activeClass: 'bg-red-600 text-white' }
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value })}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                    formData.priority === p.value ? p.activeClass : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              placeholder={t('lab.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            >
              {t('lab.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || selectedTests.length === 0}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {loading ? t('lab.loading') : `Buyurtma berish (${selectedTests.length} ta)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
