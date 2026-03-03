import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import billingService from '../services/billingService'
import toast, { Toaster } from 'react-hot-toast'

export default function ReceptionCashier() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        billingService.getStats(),
        billingService.getInvoices({ from_date: today, to_date: today, limit: 200 })
      ])
      if (statsRes.success) setStats(statsRes.data)
      if (invoicesRes.success) setInvoices(invoicesRes.data || [])
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  const methodLabel = { cash: 'Naqd', click: 'Click', humo: 'Humo', uzcard: 'Uzcard' }
  const methodColor = {
    cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    click: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    humo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    uzcard: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  }

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  const formatDate = () =>
    new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const by = stats?.todayByMethod || {}

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Bugungi Kassa</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate()}</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Jami kirim */}
        <div className="col-span-2 sm:col-span-4 bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 sm:p-5 text-white">
          <p className="text-sm opacity-80">Bugungi jami kirim</p>
          <p className="text-3xl sm:text-4xl font-black mt-1">
            {(stats?.todayRevenue || 0).toLocaleString()} <span className="text-lg font-semibold opacity-70">so'm</span>
          </p>
          <p className="text-sm opacity-70 mt-1">{invoices.length} ta tranzaksiya</p>
        </div>

        {/* To'lov usullari */}
        {[
          { key: 'cash', icon: 'payments' },
          { key: 'click', icon: 'smartphone' },
          { key: 'humo', icon: 'credit_card' },
          { key: 'uzcard', icon: 'credit_card' }
        ].map(({ key, icon }) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-gray-400 text-base">{icon}</span>
              <span className="text-xs font-semibold text-gray-500">{methodLabel[key]}</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
              {(by[key] || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">so'm</p>
          </div>
        ))}
      </div>

      {/* Yo'nalish bo'yicha kirim */}
      {stats?.todayByDirection?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Bugun yo'nalish bo'yicha kirim</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.todayByDirection.map((d, i) => {
              const labels = {
                consultation: { label: 'Konsultatsiya', icon: 'stethoscope', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                laboratory: { label: 'Laboratoriya', icon: 'science', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                service: { label: 'Muolajalar', icon: 'healing', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
                bed_charge: { label: 'Statsionar', icon: 'bed', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
                medication: { label: 'Dori-darmon', icon: 'medication', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
                reagent: { label: 'Reagent', icon: 'biotech', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
                other: { label: 'Boshqa', icon: 'receipt', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
              }
              const info = labels[d._id] || labels.other
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${info.color}`}>
                    <span className="material-symbols-outlined text-base">{info.icon}</span>
                  </div>
                  <p className="flex-1 font-semibold text-sm text-gray-900 dark:text-white">{info.label}</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white flex-shrink-0">
                    {(d.total || 0).toLocaleString()} so'm
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Doktorlar bo'yicha kirim */}
      {stats?.todayByDoctor?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Bugun doktorlar bo'yicha kirim</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.todayByDoctor.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(d.doctor_name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {d.doctor_name || 'Noma\'lum'}
                  </p>
                  <div className="flex gap-3 mt-0.5">
                    {d.lab > 0 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Lab: {d.lab.toLocaleString()}
                      </span>
                    )}
                    {d.procedure > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Muolaja: {d.procedure.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-bold text-sm text-gray-900 dark:text-white flex-shrink-0">
                  {d.total.toLocaleString()} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bugungi tranzaksiyalar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Bugungi tranzaksiyalar</h2>
          <span className="text-sm text-gray-500">{invoices.length} ta</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-2">receipt_long</span>
            <p>Bugun hali tranzaksiya yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.map(inv => (
              <div
                key={inv._id || inv.id}
                onClick={() => navigate(`/patients/${inv.patient_id?._id || inv.patient_id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(inv.first_name || '?')[0]}{(inv.last_name || '')[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {inv.first_name} {inv.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTime(inv.created_at)} · {inv.invoice_number}
                  </p>
                </div>

                {/* Payment method */}
                {inv.payment_method && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${methodColor[inv.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                    {methodLabel[inv.payment_method] || inv.payment_method}
                  </span>
                )}

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    {(inv.total_amount || 0).toLocaleString()} so'm
                  </p>
                  <span className={`text-xs font-semibold ${
                    inv.payment_status === 'paid'
                      ? 'text-green-600'
                      : inv.payment_status === 'partial'
                      ? 'text-yellow-600'
                      : 'text-red-500'
                  }`}>
                    {inv.payment_status === 'paid' ? 'To\'langan' : inv.payment_status === 'partial' ? 'Qisman' : 'Kutilmoqda'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
