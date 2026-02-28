import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import pharmacyService from '../../services/pharmacyService'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'tablet', label: 'Tabletka' },
  { value: 'syrup', label: 'Sirop' },
  { value: 'injection', label: 'Ukol' },
  { value: 'cream', label: 'Krem' },
  { value: 'drops', label: 'Tomchi' },
  { value: 'other', label: 'Boshqa' }
]

const UNITS = [
  { value: 'dona', label: 'Dona' },
  { value: 'ampula', label: 'Ampula' },
  { value: 'shisha', label: 'Shisha' },
  { value: 'quti', label: 'Quti' },
  { value: 'ml', label: 'ml' },
  { value: 'mg', label: 'mg' }
]

const emptyForm = {
  name: '', category: 'other', unit: 'dona', unit_price: '',
  quantity: '', expiry_date: '', floor: 1, description: ''
}

const NurseMedicineCabinet = ({ medicines, onDispense, onRefresh }) => {
  const { user } = useAuth()
  const isAdmin = ['admin', 'super admin'].includes(user?.role?.name)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const openAdd = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (med) => {
    setForm({
      name: med.name || '',
      category: med.category || 'other',
      unit: med.unit || 'dona',
      unit_price: med.unit_price || '',
      quantity: med.quantity || '',
      expiry_date: med.expiry_date ? med.expiry_date.split('T')[0] : '',
      floor: med.floor || 1,
      description: med.description || ''
    })
    setEditId(med._id || med.id)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Dori nomini kiriting')
    if (!form.unit_price) return toast.error('Narxni kiriting')
    try {
      setSaving(true)
      const data = { ...form, unit_price: Number(form.unit_price), quantity: Number(form.quantity) || 0 }
      if (editId) {
        await pharmacyService.updateMedicine(editId, data)
        toast.success('Dori yangilandi')
      } else {
        await pharmacyService.createMedicine(data)
        toast.success('Dori qo\'shildi')
      }
      setShowModal(false)
      onRefresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (med) => {
    if (!confirm(`"${med.name}" dorini o'chirmoqchimisiz?`)) return
    try {
      await pharmacyService.deleteMedicine(med._id || med.id)
      toast.success('Dori o\'chirildi')
      onRefresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold">Dori shkafi</h3>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Dori qo'shish
          </button>
        )}
      </div>

      {medicines.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">medical_services</span>
          <p className="text-gray-500">Dorilar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {medicines.map(medicine => (
            <div key={medicine._id || medicine.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-base sm:text-lg">{medicine.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{medicine.category}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  medicine.quantity > (medicine.reorder_level || 10)
                    ? 'bg-green-100 text-green-700'
                    : medicine.quantity > 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {medicine.quantity} {medicine.unit || 'dona'}
                </span>
              </div>

              <div className="space-y-1 text-sm mb-3">
                <p><span className="font-semibold">Narxi:</span> {medicine.unit_price?.toLocaleString()} so'm</p>
                {medicine.expiry_date && (
                  <p><span className="font-semibold">Yaroqlilik:</span> {new Date(medicine.expiry_date).toLocaleDateString('uz-UZ')}</p>
                )}
              </div>

              <div className="flex gap-2">
                {medicine.quantity > 0 && (
                  <button
                    onClick={() => onDispense(medicine)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">remove_circle</span>
                    Bemorga berish
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => openEdit(medicine)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      title="Tahrirlash"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(medicine)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      title="O'chirish"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editId ? 'Dorini tahrirlash' : 'Yangi dori qo\'shish'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dori nomi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Masalan: Paracetamol"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoriya</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birlik</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Narx (so'm) *</label>
                  <input
                    type="number"
                    value={form.unit_price}
                    onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miqdor</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yaroqlilik muddati</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qavat</label>
                  <select
                    value={form.floor}
                    onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={1}>1-qavat</option>
                    <option value={2}>2-qavat</option>
                    <option value={3}>3-qavat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Ixtiyoriy..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:opacity-90 transition text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : editId ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NurseMedicineCabinet
