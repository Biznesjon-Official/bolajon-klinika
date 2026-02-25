import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import laboratoryService from '../services/laboratoryService'
import labPrintService from '../services/labPrintService'
import toast from 'react-hot-toast'

export default function LabResultView() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadResult()
  }, [orderId])

  const loadResult = async () => {
    try {
      setLoading(true)
      const response = await laboratoryService.getOrderResult(orderId)
      setResult(response.data)
    } catch (error) {
      toast.error('Natijani yuklashda xatolik')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Натижа юкланмоқда...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">science</span>
          <p className="text-lg text-gray-500 mb-4">Натижа топилмади</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold">
            Орқага
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <span className="material-symbols-outlined text-6xl text-green-500 mb-4">task_alt</span>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Таҳлил натижаси тайёр</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{result.test_name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Бемор: <span className="font-bold">{result.patient_name}</span> &bull; {result.order_number}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => labPrintService.printResult(result)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition"
          >
            <span className="material-symbols-outlined">print</span>
            Чоп этиш
          </button>
          <button
            onClick={() => {
              toast.success('PDF учун чоп этиш ойнасида "PDF сифатида сақлаш" ни танланг', { duration: 4000 })
              setTimeout(() => labPrintService.printResult(result), 500)
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 flex items-center justify-center gap-2 transition"
          >
            <span className="material-symbols-outlined">download</span>
            PDF юклаш
          </button>
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/lab')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-2 transition"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Орқага
          </button>
        </div>
      </div>
    </div>
  )
}
