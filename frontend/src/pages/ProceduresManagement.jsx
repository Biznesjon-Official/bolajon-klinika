import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import servicesService from '../services/servicesService'

const PROCEDURE_TYPES = [
  { value: 'ukol', label: 'Ukol' },
  { value: 'kapelnitsa', label: 'Kapelnitsa' },
  { value: 'massaj', label: 'Massaj' },
  { value: 'xijoma', label: 'Xijoma' }
]

const emptyProcForm = {
  name: '',
  price: '',
  is_active: true
}

export default function ProceduresManagement() {
  // Categories (bo'limlar)
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', description: '', procedure_type: '' })
  const [catSaving, setCatSaving] = useState(false)
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null)

  // Procedures
  const [procedures, setProcedures] = useState([])
  const [procLoading, setProcLoading] = useState(false)
  const [showProcModal, setShowProcModal] = useState(false)
  const [editProc, setEditProc] = useState(null)
  const [procForm, setProcForm] = useState(emptyProcForm)
  const [procSaving, setProcSaving] = useState(false)
  const [deleteProcConfirm, setDeleteProcConfirm] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    if (selectedCat) fetchProcedures(selectedCat._id)
    else setProcedures([])
  }, [selectedCat])

  const fetchCategories = async () => {
    try {
      setCatLoading(true)
      const res = await servicesService.getProcedureCategories()
      setCategories(res.data || [])
      // Auto-select first
      if (!selectedCat && res.data?.length > 0) setSelectedCat(res.data[0])
    } catch {
      toast.error('Bo\'limlarni yuklashda xatolik')
    } finally {
      setCatLoading(false)
    }
  }

  const fetchProcedures = async (catId) => {
    try {
      setProcLoading(true)
      const res = await servicesService.getProceduresByCategory(catId)
      setProcedures(res.data || [])
    } catch {
      toast.error('Muolajalarni yuklashda xatolik')
    } finally {
      setProcLoading(false)
    }
  }

  // ── Category CRUD ──────────────────────────────────────
  const openAddCat = () => {
    setEditCat(null)
    setCatForm({ name: '', description: '' })
    setShowCatModal(true)
  }

  const openEditCat = (cat) => {
    setEditCat(cat)
    setCatForm({ name: cat.name, description: cat.description || '', procedure_type: cat.procedure_type || '' })
    setShowCatModal(true)
  }

  const handleSaveCat = async (e) => {
    e.preventDefault()
    if (!catForm.name.trim()) return toast.error('Nom majburiy')
    if (!catForm.procedure_type) return toast.error('Tur majburiy')
    try {
      setCatSaving(true)
      if (editCat) {
        await servicesService.updateProcedureCategory(editCat._id, catForm)
        toast.success('Bo\'lim yangilandi')
      } else {
        await servicesService.createProcedureCategory(catForm)
        toast.success('Bo\'lim qo\'shildi')
      }
      setShowCatModal(false)
      await fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCat = async (cat) => {
    try {
      await servicesService.deleteProcedureCategory(cat._id)
      toast.success('Bo\'lim o\'chirildi')
      setDeleteCatConfirm(null)
      if (selectedCat?._id === cat._id) setSelectedCat(null)
      await fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'O\'chirishda xatolik')
    }
  }

  // ── Procedure CRUD ─────────────────────────────────────
  const openAddProc = () => {
    setEditProc(null)
    setProcForm(emptyProcForm)
    setShowProcModal(true)
  }

  const openEditProc = (proc) => {
    setEditProc(proc)
    setProcForm({
      name: proc.name || '',
      price: proc.is_cups_based ? proc.price_per_cup : proc.price,
      is_active: proc.is_active
    })
    setShowProcModal(true)
  }

  const handleSaveProc = async (e) => {
    e.preventDefault()
    if (!procForm.name.trim()) return toast.error('Nom majburiy')
    if (!selectedCat) return toast.error('Avval bo\'lim tanlang')

    const isCups = selectedCat.procedure_type === 'xijoma'
    const priceVal = parseFloat(procForm.price) || 0
    const payload = {
      name: procForm.name.trim(),
      category: 'Muolaja',
      procedure_category_id: selectedCat._id,
      procedure_type: selectedCat.procedure_type,
      is_cups_based: isCups,
      is_active: procForm.is_active,
      price: priceVal,
      ...(isCups ? { price_per_cup: priceVal } : { price_per_cup: null })
    }

    if (isCups && !priceVal) return toast.error('1 idish narxini kiriting')

    try {
      setProcSaving(true)
      if (editProc) {
        await servicesService.updateService(editProc._id, payload)
        toast.success('Muolaja yangilandi')
      } else {
        await servicesService.createService(payload)
        toast.success('Muolaja qo\'shildi')
      }
      setShowProcModal(false)
      fetchProcedures(selectedCat._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Saqlashda xatolik')
    } finally {
      setProcSaving(false)
    }
  }

  const handleDeleteProc = async (proc) => {
    try {
      await servicesService.deleteService(proc._id)
      toast.success('Muolaja o\'chirildi')
      setDeleteProcConfirm(null)
      fetchProcedures(selectedCat._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik')
    }
  }

  return (
    <div className="p-4 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Muolajalar boshqaruvi</h1>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* ── LEFT: Bo'limlar ── */}
        <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Bo'limlar</h2>
            <button
              onClick={openAddCat}
              className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              title="Bo'lim qo'shish"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {catLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 px-4">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">category</span>
                <p className="text-sm text-gray-400">Bo'limlar yo'q</p>
                <button
                  onClick={openAddCat}
                  className="mt-3 text-sm text-primary hover:underline"
                >Birinchi bo'limni qo'shing</button>
              </div>
            ) : (
              <ul className="py-1">
                {categories.map(cat => (
                  <li
                    key={cat._id}
                    onClick={() => setSelectedCat(cat)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selectedCat?._id === cat._id
                        ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-primary'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${selectedCat?._id === cat._id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                        {cat.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {PROCEDURE_TYPES.find(t => t.value === cat.procedure_type)?.label || '—'}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditCat(cat) }}
                        className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteCatConfirm(cat) }}
                        className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT: Muolajalar ── */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col overflow-hidden">
          {!selectedCat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-3">vaccines</span>
              <p>Chap tarafdan bo'lim tanlang</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{selectedCat.name}</h2>
                  <p className="text-xs text-gray-400">{procedures.length} ta muolaja</p>
                </div>
                <button
                  onClick={openAddProc}
                  className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Muolaja qo'shish
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {procLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : procedures.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-3">vaccines</span>
                    <p className="text-sm">Bu bo'limda muolajalar yo'q</p>
                    <button
                      onClick={openAddProc}
                      className="mt-3 text-sm text-primary hover:underline"
                    >Birinchi muolajani qo'shing</button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Nom</th>
                        <th className="px-4 py-3 text-left font-semibold">Tur</th>
                        <th className="px-4 py-3 text-right font-semibold">Narx</th>
                        <th className="px-4 py-3 text-center font-semibold">Holat</th>
                        <th className="px-4 py-3 text-center font-semibold">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {procedures.map(proc => (
                        <tr key={proc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{proc.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {PROCEDURE_TYPES.find(t => t.value === proc.procedure_type)?.label || proc.procedure_type || '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                            {proc.is_cups_based
                              ? <span>{proc.price_per_cup?.toLocaleString()} <span className="text-xs text-gray-400">/ idish</span></span>
                              : `${proc.price?.toLocaleString()} so'm`
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              proc.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {proc.is_active ? 'Faol' : 'Nofaol'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditProc(proc)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => setDeleteProcConfirm(proc)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editCat ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim'}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Masalan: Ukol bo'limi, Xijoma..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tur *</label>
                <select
                  value={catForm.procedure_type}
                  onChange={e => setCatForm(f => ({ ...f, procedure_type: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">— Turni tanlang —</option>
                  {PROCEDURE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Ixtiyoriy..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                  Bekor qilish
                </button>
                <button type="submit" disabled={catSaving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition text-sm font-semibold">
                  {catSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Procedure Modal ── */}
      {showProcModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editProc ? 'Muolajani tahrirlash' : `Yangi muolaja — ${selectedCat?.name}`}
              </h2>
              <button onClick={() => setShowProcModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProc} className="p-4 space-y-3">
              <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                Tur: <span className="font-medium text-gray-700 dark:text-gray-300">
                  {PROCEDURE_TYPES.find(t => t.value === selectedCat?.procedure_type)?.label || '—'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={procForm.name}
                  onChange={e => setProcForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Muolaja nomi"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {selectedCat?.procedure_type === 'xijoma' ? '1 idish narxi (so\'m) *' : 'Narx (so\'m) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={procForm.price}
                  onChange={e => setProcForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="0"
                />
                {selectedCat?.procedure_type === 'xijoma' && (
                  <p className="text-xs text-gray-400 mt-1">Jami = idish soni × 1 idish narxi</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProcForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${procForm.is_active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${procForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Faol</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowProcModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                  Bekor qilish
                </button>
                <button type="submit" disabled={procSaving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition text-sm font-semibold">
                  {procSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete category confirm ── */}
      {deleteCatConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bo'limni o'chirish</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              <strong>{deleteCatConfirm.name}</strong> bo'limi o'chirilsinmi?
              Ichidagi muolajalar bo'lsa, avval ularni o'chirish kerak.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatConfirm(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                Bekor qilish
              </button>
              <button onClick={() => handleDeleteCat(deleteCatConfirm)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete procedure confirm ── */}
      {deleteProcConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Muolajani o'chirish</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              <strong>{deleteProcConfirm.name}</strong> o'chirilsinmi?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteProcConfirm(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                Bekor qilish
              </button>
              <button onClick={() => handleDeleteProc(deleteProcConfirm)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
