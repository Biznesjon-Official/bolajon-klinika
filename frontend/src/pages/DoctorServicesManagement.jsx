import { useState, useEffect } from 'react'
import doctorServiceService from '../services/doctorServiceService'
import toast from 'react-hot-toast'

export default function DoctorServicesManagement() {
  const [doctors, setDoctors] = useState([])
  const [services, setServices] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [doctorServices, setDoctorServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({
    service_id: '',
    custom_price: '',
    revisit_rules: [
      { min_days: 0, max_days: 3, discount_percent: 100 },
      { min_days: 4, max_days: 7, discount_percent: 50 }
    ]
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDoctor) loadDoctorServices()
  }, [selectedDoctor])

  const loadInitialData = async () => {
    try {
      const [doctorsRes, servicesRes] = await Promise.all([
        doctorServiceService.getDoctorsList(),
        doctorServiceService.getServicesList()
      ])
      setDoctors(doctorsRes.data || [])
      setServices(servicesRes.data || [])
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    }
  }

  const loadDoctorServices = async () => {
    try {
      setLoading(true)
      const res = await doctorServiceService.getAll({ doctor_id: selectedDoctor })
      setDoctorServices(res.data || [])
    } catch {
      toast.error('Xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!form.service_id || form.custom_price === '' || form.custom_price === undefined) {
        return toast.error('Xizmat va narxni tanlang')
      }

      const data = {
        doctor_id: selectedDoctor,
        service_id: form.service_id,
        custom_price: parseFloat(form.custom_price),
        revisit_rules: form.revisit_rules.filter(r => r.discount_percent > 0)
      }

      if (editItem) {
        await doctorServiceService.update(editItem._id, data)
        toast.success('Yangilandi')
      } else {
        await doctorServiceService.create(data)
        toast.success('Xizmat biriktirildi')
      }

      setShowModal(false)
      setEditItem(null)
      resetForm()
      loadDoctorServices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    try {
      await doctorServiceService.delete(id)
      toast.success('O\'chirildi')
      loadDoctorServices()
    } catch {
      toast.error('Xatolik')
    }
  }

  const handleEdit = (item) => {
    setEditItem(item)
    setForm({
      service_id: item.service_id?._id || '',
      custom_price: item.custom_price || '',
      revisit_rules: item.revisit_rules?.length ? item.revisit_rules : [
        { min_days: 0, max_days: 3, discount_percent: 100 },
        { min_days: 4, max_days: 7, discount_percent: 50 }
      ]
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setForm({
      service_id: '',
      custom_price: '',
      revisit_rules: [
        { min_days: 0, max_days: 3, discount_percent: 100 },
        { min_days: 4, max_days: 7, discount_percent: 50 }
      ]
    })
  }

  const updateRule = (index, field, value) => {
    const updated = [...form.revisit_rules]
    updated[index] = { ...updated[index], [field]: parseInt(value) || 0 }
    setForm({ ...form, revisit_rules: updated })
  }

  const addRule = () => {
    setForm({
      ...form,
      revisit_rules: [...form.revisit_rules, { min_days: 0, max_days: 0, discount_percent: 0 }]
    })
  }

  const removeRule = (index) => {
    setForm({
      ...form,
      revisit_rules: form.revisit_rules.filter((_, i) => i !== index)
    })
  }

  const selectedDoctorData = doctors.find(d => d._id === selectedDoctor)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m'
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl sm:text-5xl">medical_services</span>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black">DOKTOR XIZMATLARI</h1>
            <p className="text-sm sm:text-base opacity-90">Har bir doktor uchun xizmatlar, narxlar va chegirma qoidalari</p>
          </div>
        </div>
      </div>

      {/* Doctor Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Doktorni tanlang</label>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Doktor tanlang --</option>
          {doctors.map(doc => (
            <option key={doc._id} value={doc._id}>
              Dr. {doc.first_name} {doc.last_name} {doc.specialization ? `(${doc.specialization})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Services */}
      {selectedDoctor && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Dr. {selectedDoctorData?.first_name} {selectedDoctorData?.last_name} — Xizmatlari
              </h2>
              <p className="text-sm text-gray-500">{selectedDoctorData?.specialization || ''}</p>
            </div>
            <button
              onClick={() => { resetForm(); setEditItem(null); setShowModal(true) }}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 transition"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Xizmat qo'shish
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : doctorServices.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">info</span>
              <p className="text-gray-500 dark:text-gray-400">Bu doktorga hali xizmat biriktirilmagan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Xizmat</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Kategoriya</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Umumiy narx</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Doktor narxi</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Chegirma qoidalari</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600 dark:text-gray-400">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorServices.map((ds) => (
                    <tr key={ds._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 dark:text-white">{ds.service_id?.name}</p>
                        {ds.service_id?.code && <p className="text-xs text-gray-500">{ds.service_id.code}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{ds.service_id?.category}</td>
                      <td className="py-3 px-4 text-right text-sm text-gray-500 line-through">{formatPrice(ds.service_id?.price || 0)}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{formatPrice(ds.custom_price)}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {ds.revisit_rules?.map((rule, i) => (
                            <span key={i} className="inline-block mr-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full font-semibold">
                              {rule.min_days}-{rule.max_days} kun: {rule.discount_percent}%
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(ds)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Tahrirlash"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(ds._id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="O'chirish"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {editItem ? 'Xizmatni tahrirlash' : 'Yangi xizmat biriktirish'}
                </h3>
                <button onClick={() => { setShowModal(false); setEditItem(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Service select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Xizmat</label>
                <select
                  value={form.service_id}
                  onChange={(e) => {
                    const svc = services.find(s => s._id === e.target.value)
                    setForm({ ...form, service_id: e.target.value, custom_price: svc?.price || form.custom_price })
                  }}
                  disabled={!!editItem}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                >
                  <option value="">-- Xizmat tanlang --</option>
                  {services.map(svc => (
                    <option key={svc._id} value={svc._id}>
                      {svc.name} ({svc.category}) — {formatPrice(svc.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom price */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Doktor narxi (so'm)</label>
                <input
                  type="number"
                  value={form.custom_price}
                  onChange={(e) => setForm({ ...form, custom_price: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Masalan: 50000"
                />
              </div>

              {/* Revisit Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Qayta qabul chegirmalari</label>
                  <button
                    onClick={addRule}
                    className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-bold hover:bg-blue-200"
                  >
                    + Qoida
                  </button>
                </div>

                <div className="space-y-3">
                  {form.revisit_rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Dan (kun)</label>
                          <input
                            type="number"
                            value={rule.min_days}
                            onChange={(e) => updateRule(i, 'min_days', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Gacha (kun)</label>
                          <input
                            type="number"
                            value={rule.max_days}
                            onChange={(e) => updateRule(i, 'max_days', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Chegirma %</label>
                          <input
                            type="number"
                            value={rule.discount_percent}
                            onChange={(e) => updateRule(i, 'discount_percent', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      {form.revisit_rules.length > 1 && (
                        <button
                          onClick={() => removeRule(i)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-4"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Masalan: 0-3 kun = 100% (bepul), 4-7 kun = 50% chegirma
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setEditItem(null) }}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                {editItem ? 'Saqlash' : 'Biriktirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
