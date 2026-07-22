import { useState, useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'
import { analysisAPI } from '@/services/api'
import SensorTrendChart from '@/components/charts/SensorTrendChart'
import NDVIChart from '@/components/charts/NDVIChart'
import Badge from '@/components/ui/Badge'
import { Activity, Satellite, BarChart3, Leaf, Clock } from 'lucide-react'

const TABS = [
  { id: 'sensors', label: 'Sensor Trends', icon: Activity },
  { id: 'ndvi', label: 'NDVI Trend', icon: Satellite },
  { id: 'health', label: 'Health Score', icon: BarChart3 },
  { id: 'predictions', label: 'AI Predictions', icon: Leaf },
]

export default function History() {
  const { selectedFarm } = useFarmStore()
  const [activeTab, setActiveTab] = useState('sensors')
  const [sensorHistory, setSensorHistory] = useState([])
  const [ndviHistory, setNdviHistory] = useState([])
  const [healthHistory, setHealthHistory] = useState([])
  const [envHealthHistory, setEnvHealthHistory] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSensor, setActiveSensor] = useState('temperature')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        if (!selectedFarm?.id) return
        const res = await analysisAPI.getHistory(selectedFarm.id)
        const historyData = res.data.reverse() // Sort oldest to newest for charts

        setSensorHistory(historyData.filter(d => d.temperature != null))
        setNdviHistory(historyData.filter(d => d.ndvi_mean != null))
        setHealthHistory(historyData.map(d => ({ ...d, health_score: d.farm_health_score })))
        setEnvHealthHistory(historyData.filter(d => d.env_health_index != null).map(d => ({ ...d, env_health_index: d.env_health_index })))
        setPredictions(historyData.filter(d => d.disease != null).map(d => ({
          disease: d.disease,
          confidence: d.ai_confidence,
          severity: d.severity,
          timestamp: d.timestamp
        })).reverse()) // Newest first for predictions table

      } catch (e) {
        console.error("Failed to load history", e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [selectedFarm?.id])

  const sensorConfigs = [
    { key: 'temperature', label: 'Temperature (°C)', color: '#F97316' },
    { key: 'humidity', label: 'Humidity (%)', color: '#3B82F6' },
    { key: 'soil_moisture', label: 'Soil Moisture (%)', color: '#16A34A' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">History & Trends</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Historical analysis and performance trends</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)] w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-none'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'sensors' && (
        <div className="space-y-5">
          {/* Sensor selector */}
          <div className="flex gap-2">
            {sensorConfigs.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSensor(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                  ${activeSensor === s.key
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {sensorConfigs.find(s => s.key === activeSensor)?.label}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">Last 7 days · {sensorHistory.length} readings</p>
              </div>
            </div>
            {loading
              ? <div className="h-[220px] bg-slate-100 rounded-xl animate-pulse" />
              : <SensorTrendChart
                  data={sensorHistory}
                  metric={activeSensor}
                  label={sensorConfigs.find(s => s.key === activeSensor)?.label}
                  color={sensorConfigs.find(s => s.key === activeSensor)?.color}
                />
            }
          </div>

          {/* Recent readings table */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Readings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Timestamp', 'Temp (°C)', 'Humidity (%)', 'Soil Moisture (%)', 'Rain'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensorHistory.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-5 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {new Date(row.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-[var(--color-accent)]">{row.temperature}</td>
                      <td className="px-5 py-3 text-xs font-medium text-[var(--color-secondary)]">{row.humidity}</td>
                      <td className="px-5 py-3 text-xs font-medium text-[var(--color-primary)]">{row.soil_moisture}</td>
                      <td className="px-5 py-3">
                        <Badge label={row.rain_detected ? 'Yes' : 'No'} variant={row.rain_detected ? 'info' : 'default'} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ndvi' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[var(--color-secondary)]/15 rounded-xl flex items-center justify-center">
              <Satellite className="w-4.5 h-4.5 text-[var(--color-secondary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">NDVI Over Time</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{ndviHistory.length} satellite passes</p>
            </div>
          </div>
          {loading
            ? <div className="h-[220px] bg-slate-100 rounded-xl animate-pulse" />
            : <NDVIChart data={ndviHistory} />
          }
          <div className="flex items-center gap-6 text-xs text-[var(--color-text-muted)] pt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-primary)]" /><span>Healthy (&gt;0.5)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-accent)]" /><span>Moderate (0.3–0.5)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-danger)]" /><span>Stressed (&lt;0.3)</span></div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[var(--color-secondary)]/15 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-[var(--color-secondary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Farm Health Score</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Unified systemic health score (last 14 days)</p>
              </div>
            </div>
            {loading
              ? <div className="h-[220px] bg-slate-100 rounded-xl animate-pulse" />
              : <SensorTrendChart data={healthHistory} metric="health_score" label="Farm Health Score" color="#8B5CF6" />
            }
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Environmental Health Index</h3>
                <p className="text-xs text-[var(--color-text-muted)]">IoT Hardware Intelligence (last 14 days)</p>
              </div>
            </div>
            {loading
              ? <div className="h-[220px] bg-slate-100 rounded-xl animate-pulse" />
              : <SensorTrendChart data={envHealthHistory} metric="env_health_index" label="Environmental Health Index" color="#10B981" />
            }
          </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Disease Prediction History</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{predictions.length} analyses</p>
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {predictions.map((p, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-[var(--color-bg)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${p.disease === 'Healthy' ? 'bg-[var(--color-primary)]/15' : 'bg-[var(--color-danger)]/15'}`}
                  >
                    <Leaf className={`w-4 h-4 ${p.disease === 'Healthy' ? 'text-[var(--color-primary)]' : 'text-[var(--color-danger)]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{p.disease}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(p.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{p.confidence?.toFixed(1)}%</p>
                    <p className="text-xs text-[var(--color-text-muted)]">confidence</p>
                  </div>
                  <Badge
                    label={p.severity}
                    variant={p.severity === 'None' ? 'success' : p.severity === 'Low' ? 'info' : p.severity === 'Moderate' ? 'warning' : 'danger'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
