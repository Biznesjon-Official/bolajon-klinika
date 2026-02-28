import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import servicesService from '../services/servicesService'

const PROCEDURE_TYPES = [
  { value: 'ukol', label: 'Ukol' },
  { value: 'kapelnitsa', label: 'Kapelnitsa' },
  { value: 'massaj', label: 'Massaj' },
  { value: 'xijoma', label: 'Xijoma' }
]

const emptyForm = {
  name: '',
  procedure_type: '',
  price: '',
  price_per_cup: '',
  is_cups_based: false,
  is_active: true
}

export default function ProceduresManagement() {
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchProcedures()
  }, [])

  const fetchProcedures = async () => {
    try {
      setLoading(true)
      const res = await servicesService.getServices({ category: 'Muolaja' })
      setProcedures(res.data || [])
    } catch {
      toast.error('Muolajalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      name: item.name || '',
      procedure_type: item.procedure_type || '',
      price: item.is_cups_based ? item.price_per_cup : item.price,
      price_per_cup: item.price_per_cup || '',
      is_cups_based: item.is_cups_based || false,
      is_active: item.is_active
    })
    setShowModal(true)
  }

  const handleTypeChange = (val) => {
    const isCups = val === 'xijoma'
    setForm(f => ({ ...f, procedure_type: val, is_cups_based: isCups }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nom majburiy')
    if (!form.procedure_type) return toast.error('Muolaja turini tanlang')

    const priceVal = parseFloat(form.price) || 0
    const payload = {
      name: form.name.trim(),
      category: 'Muolaja',
      procedure_type: form.procedure_type,
      is_cups_based: form.is_cups_based,
      is_active: form.is_active
    }

    if (form.is_cups_based) {
      if (!priceVal) return toast.error('1 idish narxini kiriting')
      payload.price_per_cup = priceVal
      payload.price = priceVal
    } else {
      payload.price = priceVal
      payload.price_per_cup = null
    }

    try {
      setSaving(true)
      if (editItem) {
        await servicesService.updateService(editItem._id, payload)
        toast.success('Muolaja yangilandi')
      } else {
        await servicesService.createService(payload)
        toast.success('Muolaja qo\'shildi')
      }
      setShowModal(false)
      fetchProcedures()
    } catch {
      toast.error('Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await servicesService.deleteService(id)
      toast.success('Muolaja o\'chirildi')
      setDeleteConfirm(null)
      fetchProcedures()
    } catch {
      toast.error('O\'chirishda xatolik')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Muolajalar</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Muolaja qo'shish
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : procedures.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          Hozircha muolajalar yo'q
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Tur</th>
                <th className="px-4 py-3 text-right">Narx</th>
                <th className="px-4 py-3 text-center">Holat</th>
                <th className="px-4 py-3 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {procedures.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">
                    {PROCEDURE_TYPES.find(t => t.value === item.procedure_type)?.label || item.procedure_type || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {item.is_cups_based
                      ? <span>{item.price_per_cup?.toLocaleString()} <span className="text-xs text-gray-400">/ idish</span></span>
                      : `${item.price?.toLocaleString()} so'm`
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {item.is_active ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                        title="Tahrirlash"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                        title="O'chirish"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editItem ? 'Muolajani tahrirlash' : 'Yangi muolaja'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Muolaja nomi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Muolaja turi *</label>
                <select
                  value={form.procedure_type}
                  onChange={e => handleTypeChange(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Turni tanlang</option>
                  {PROCEDURE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.is_cups_based ? '1 idish narxi (so\'m) *' : 'Narx (so\'m) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
                {form.is_cups_based && (
                  <p className="text-xs text-gray-400 mt-1">Jami narx = idish soni × 1 idish narxi</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Faol</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">O'chirishni tasdiqlang</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong>{deleteConfirm.name}</strong> muolajasi o'chirilsinmi?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
