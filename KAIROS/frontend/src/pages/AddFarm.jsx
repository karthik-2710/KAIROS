import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { farmAPI } from '@/services/api'
import { useFarmStore } from '@/store/farmStore'
import FarmMap from '@/components/map/FarmMap'
import Button from '@/components/ui/Button'
import { MapPin, Info, ChevronLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const CROP_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mango', 'Coconut', 'Groundnut', 'Sunflower', 'Other']

function calculateArea(polygon) {
  if (!polygon || polygon.length < 3) return 0
  let area = 0
  const R = 6371000
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const lat1 = polygon[i][0] * Math.PI / 180
    const lat2 = polygon[j][0] * Math.PI / 180
    const dlng = (polygon[j][1] - polygon[i][1]) * Math.PI / 180
    area += Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng / 2) * R * R
  }
  return Math.abs(area / 1e4).toFixed(2) // hectares approx
}

export default function AddFarm() {
  const navigate = useNavigate()
  const { addFarm, setSelectedFarm } = useFarmStore()
  const [polygon, setPolygon] = useState([])
  const [form, setForm] = useState({ name: '', crop_type: 'Rice', area_ha: '' })
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // 1: Map, 2: Details

  const estimatedArea = calculateArea(polygon)

  const handlePolygonChange = (pts) => {
    setPolygon(pts)
    if (pts.length >= 3) {
      setForm(f => ({ ...f, area_ha: calculateArea(pts) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (polygon.length < 3) {
      toast.error('Please draw your farm boundary on the map (min. 3 points)')
      setStep(1)
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      crop_type: form.crop_type,
      area_ha: parseFloat(form.area_ha || estimatedArea),
      polygon: JSON.stringify(polygon),
    }
    try {
      const res = await farmAPI.create(payload)
      const newFarm = res.data
      addFarm(newFarm)
      setSelectedFarm(newFarm)
      toast.success(`Farm "${form.name}" created!`)
      navigate('/farms')
    } catch {
      // Optimistic local add
      const local = { ...payload, id: Date.now(), health_score: 50, created_at: new Date().toISOString() }
      addFarm(local)
      setSelectedFarm(local)
      toast.success(`Farm "${form.name}" saved locally`)
      navigate('/farms')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/farms')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg)] border border-[var(--color-border)] transition-colors">
          <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Add New Farm</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Draw your field boundary and fill in the details</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        {[1, 2].map((s) => (
          <button key={s} onClick={() => setStep(s)} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step >= s ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm font-medium ${step >= s ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              {s === 1 ? 'Draw Boundary' : 'Farm Details'}
            </span>
          </button>
        ))}
        {step > 0 && <div className="flex-1 h-px bg-[var(--color-border)] mx-2 max-w-16" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map — left */}
        <div className="lg:col-span-3">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Draw Farm Boundary</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Info className="w-3.5 h-3.5" />
                Click map to add points · Dbl-click to reset
              </div>
            </div>
            <FarmMap
              drawMode
              onPolygonChange={handlePolygonChange}
              center={[20.5937, 78.9629]}
              zoom={5}
              height="400px"
            />
            {polygon.length > 0 && (
              <div className="px-5 py-3 bg-[var(--color-primary)]/15 dark:bg-emerald-950/30 flex items-center justify-between">
                <span className="text-xs text-[var(--color-primary)] font-medium">
                  {polygon.length} points · ~{estimatedArea} ha estimated
                </span>
                <button
                  onClick={() => { setPolygon([]); setForm(f => ({ ...f, area_ha: '' })) }}
                  className="text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form — right */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Farm Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Farm Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. North Paddy Field"
                  required
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Crop Type *</label>
                <select
                  value={form.crop_type}
                  onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-400 transition-colors"
                >
                  {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Area (hectares)
                  {polygon.length >= 3 && <span className="ml-2 text-[var(--color-primary)]">Auto-calculated</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.area_ha}
                  onChange={e => setForm(f => ({ ...f, area_ha: e.target.value }))}
                  placeholder={polygon.length >= 3 ? estimatedArea : '0.0'}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>

              {/* Boundary status */}
              <div className={`rounded-xl p-3 text-xs flex items-center gap-2 
                ${polygon.length >= 3 ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'}`}
              >
                {polygon.length >= 3
                  ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Field boundary drawn ({polygon.length} points)</>
                  : <><Info className="w-4 h-4 flex-shrink-0" /> Draw at least 3 points on the map</>
                }
              </div>

              <Button type="submit" fullWidth loading={saving} className="mt-2">
                Save Farm
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
