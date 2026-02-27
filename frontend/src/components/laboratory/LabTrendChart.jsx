import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import laboratoryService from '../../services/laboratoryService'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function LabTrendChart({ patientId }) {
  const [history, setHistory] = useState([])
  const [parameters, setParameters] = useState([])
  const [selectedParam, setSelectedParam] = useState('')
  const [trendData, setTrendData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patientId) loadHistory()
  }, [patientId])

  const loadHistory = async () => {
    try {
      const res = await laboratoryService.getPatientHistory(patientId)
      if (res.success) {
        setHistory(res.data)
        // Extract unique parameter names
        const paramSet = new Set()
        res.data.forEach(order => {
          order.results?.forEach(r => paramSet.add(r.parameter_name))
        })
        setParameters([...paramSet])
      }
    } catch (error) {
      // silent
    }
  }

  useEffect(() => {
    if (selectedParam && patientId) loadTrend()
  }, [selectedParam])

  const loadTrend = async () => {
    try {
      setLoading(true)
      const res = await laboratoryService.getPatientTrend(patientId, selectedParam)
      if (res.success) setTrendData(res.data)
    } catch (error) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const chartData = trendData ? {
    labels: trendData.map(d => new Date(d.date).toLocaleDateString('uz-UZ')),
    datasets: [{
      label: selectedParam,
      data: trendData.map(d => parseFloat(d.value?.replace(',', '.')) || 0),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const idx = items[0]?.dataIndex
            if (idx !== undefined && trendData[idx]) {
              const d = trendData[idx]
              return [`Me'yor: ${d.normal_range || '-'}`, `Birlik: ${d.unit || '-'}`]
            }
            return []
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: false }
    }
  }

  if (!patientId) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-2xl text-primary">show_chart</span>
        <h3 className="text-lg font-bold">Tahlil trend grafigi</h3>
      </div>

      <select
        value={selectedParam}
        onChange={(e) => setSelectedParam(e.target.value)}
        className="w-full px-4 py-2.5 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Parametr tanlang...</option>
        {parameters.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {chartData && !loading && (
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {!selectedParam && !loading && (
        <p className="text-center text-gray-500 py-8">Parametr tanlang</p>
      )}
    </div>
  )
}
