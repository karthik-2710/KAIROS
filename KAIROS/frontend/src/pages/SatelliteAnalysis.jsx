import { useState, useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'
import { analysisAPI, satelliteAPI } from '@/services/api'
import FarmMap from '@/components/map/FarmMap'
import NDVIChart from '@/components/charts/NDVIChart'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Satellite, RefreshCw, Clock, TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

function NDVIColorBar() {
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 h-4 rounded-full"
        style={{ background: 'linear-gradient(to right, #DC2626, #F59E0B, #16A34A, #0F5132)' }}
      />
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] gap-4 w-full px-1">
        <span>0.0</span><span>0.3</span><span>0.5</span><span>1.0</span>
      </div>
    </div>
  )
}

export default function SatelliteAnalysis() {
  const { selectedFarm, farms, analysisData, analysisLoading, runAnalysis } = useFarmStore()
  const data = analysisData?.satellite
  const [history, setHistory] = useState([])
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedFarm?.id) {
        try {
          // Fetching history directly from analysisAPI for consistency
          const histRes = await analysisAPI.getHistory(selectedFarm.id)
          // We only want satellite history points
          const satHistory = histRes.data.map(h => ({
            timestamp: h.timestamp,
            ndvi_mean: h.ndvi_mean
          })).filter(h => h.ndvi_mean != null)
          setHistory(satHistory)
        } catch {
          setHistory([])
        }
      }
    }
    fetchHistory()
  }, [selectedFarm?.id, analysisData])

  const handleAnalyze = async () => {
    if (!selectedFarm) { toast.error('Select a farm first'); return }
    setAnalyzing(true)
    toast.loading('Running Unified Analysis Pipeline...', { id: 'sat' })
    try {
      await satelliteAPI.trigger(selectedFarm.id)
      await useFarmStore.getState().fetchAnalysis(selectedFarm.id, true)
      toast.success('Analysis complete!', { id: 'sat' })
    } catch {
      toast.error('Analysis failed.', { id: 'sat' })
    } finally {
      setAnalyzing(false)
    }
  }

  const ndvi = data?.ndvi_mean
  const ndviColor = !ndvi ? 'text-[var(--color-text-muted)]' : ndvi >= 0.5 ? 'text-[var(--color-primary)]' : ndvi >= 0.3 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'
  const ndviLabel = !ndvi ? 'No Data' : ndvi >= 0.5 ? 'Healthy Vegetation' : ndvi >= 0.3 ? 'Moderate Stress' : 'Severe Stress'
  const ndviVariant = !ndvi ? 'default' : ndvi >= 0.5 ? 'success' : ndvi >= 0.3 ? 'warning' : 'danger'

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Satellite Analysis</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Sentinel-2 · NDVI Vegetation Index</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => runAnalysis(selectedFarm?.id, false)}>Refresh</Button>
          <Button size="sm" icon={Satellite} loading={analyzing} onClick={handleAnalyze}>
            Trigger Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map and Charts (Left col, takes 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Field Boundary Map</h3>
              {data?.timestamp && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(data.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
            
            <div className="flex-grow min-h-[380px] w-full bg-slate-100 dark:bg-slate-800">
                <FarmMap
                  farms={farms}
                  selectedFarm={selectedFarm}
                  center={selectedFarm?.polygon ? JSON.parse(selectedFarm.polygon)[0] : [20.5937, 78.9629]}
                  zoom={selectedFarm ? 12 : 5}
                  height="100%"
                />
            </div>

            <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">NDVI Scale</p>
              <div className="flex flex-col gap-1 w-full">
                <NDVIColorBar />
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1 w-full px-1">
                  <span>Barren / Stressed</span><span>Moderate</span><span>Healthy / Dense</span>
                </div>
              </div>
            </div>
          </div>

          {/* NDVI History Chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">NDVI Trend</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Recent pipeline analyses</p>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[400px]">
                <NDVIChart data={history} />
              </div>
            </div>
          </div>
        </div>

        {/* Right panel (Stats & Breakdown) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current NDVI */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-2xl p-6 flex flex-col justify-center min-h-[220px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Current NDVI</h3>
              <Badge label={ndviLabel} variant={ndviVariant} dot />
            </div>
            
            <div className="mb-6">
                <p className={`text-6xl font-bold font-poppins tracking-tight ${ndviColor}`}>
                {ndvi?.toFixed(3) ?? '--'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">Mean Vegetation Index</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>Maximum NDVI</span>
                </div>
                <span className="font-semibold text-[var(--color-text-primary)]">{data?.ndvi_max?.toFixed(3) ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <TrendingDown className="w-4 h-4 text-[var(--color-danger)]" />
                  <span>Minimum NDVI</span>
                </div>
                <span className="font-semibold text-[var(--color-text-primary)]">{data?.ndvi_min?.toFixed(3) ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Cloud Coverage</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{data?.cloud_coverage ?? '--'}%</span>
              </div>
            </div>
          </div>

          {/* Zone breakdown */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Zone Breakdown</h3>
            <div className="space-y-5">
              {[
                { label: 'Healthy Zone', pct: data?.healthy_pct, color: 'bg-[var(--color-primary)]', textColor: 'text-[var(--color-primary)]', range: 'NDVI > 0.5' },
                { label: 'Moderate Stress', pct: data?.moderate_pct, color: 'bg-[var(--color-accent)]', textColor: 'text-[var(--color-accent)]', range: 'NDVI 0.3–0.5' },
                { label: 'Severe Stress', pct: data?.stress_pct, color: 'bg-[var(--color-danger)]', textColor: 'text-[var(--color-danger)]', range: 'NDVI < 0.3' },
              ].map(zone => (
                <div key={zone.label} className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{zone.label}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{zone.range}</span>
                    </div>
                    <span className={`text-lg font-bold ${zone.textColor}`}>{zone.pct ?? '--'}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
                    <div
                      className={`h-full ${zone.color} rounded-full transition-all duration-700`}
                      style={{ width: `${zone.pct || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Band data */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Spectral Bands</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-[var(--color-danger)] font-semibold uppercase tracking-wider mb-2">Red (B4)</p>
                <p className="text-xl font-bold text-[var(--color-danger)]">{data?.band_b4?.toFixed(3) ?? '--'}</p>
              </div>
              <div className="bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wider mb-2">NIR (B8)</p>
                <p className="text-xl font-bold text-[var(--color-primary)]">{data?.band_b8?.toFixed(3) ?? '--'}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-[var(--color-border)]">
              NDVI = (NIR − Red) / (NIR + Red)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
