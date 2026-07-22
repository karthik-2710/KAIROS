import { useState, useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'
import { farmAPI } from '@/services/api'
import { Search, Plus, Trash2, Edit3, MapPin, Sprout, Ruler, MoreVertical } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Helper to parse polygon string to lat/lng pairs
const parsePolygon = (polyStr) => {
  try {
    return JSON.parse(polyStr).map(([lat, lng]) => [lat, lng])
  } catch (e) {
    return []
  }
}

// Helper to get centroid
const getCentroid = (coords) => {
  if (!coords || coords.length === 0) return [20, 0]
  let lat = 0, lng = 0
  coords.forEach(c => { lat += c[0]; lng += c[1] })
  return [lat / coords.length, lng / coords.length]
}

export default function MyFarms() {
  const navigate = useNavigate()
  const { farms, setFarms, setSelectedFarm, removeFarm } = useFarmStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await farmAPI.getAll()
        setFarms(res.data)
      } catch {
        // MOCK removed
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = farms.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.crop_type?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await farmAPI.delete(deleteTarget.id)
      removeFarm(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted`)
    } catch {
      removeFarm(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" removed`)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const healthColor = (score) =>
    score >= 75 ? 'success' : score >= 50 ? 'warning' : 'danger'

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">My Farms</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{farms.length} farm{farms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/farms/add')}>Add Farm</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or crop..."
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-400 transition-colors"
        />
      </div>

      {/* Farm cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-20 bg-slate-200 rounded mb-6" />
              <div className="space-y-2">{[1,2,3].map(j => <div key={j} className="h-3 bg-slate-200 rounded" />)}</div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-[var(--color-text-secondary)] mb-2">
            {search ? 'No farms match your search' : 'No farms yet'}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {search ? 'Try a different search term' : 'Add your first farm to get started'}
          </p>
          {!search && <Button icon={Plus} onClick={() => navigate('/farms/add')}>Add Your First Farm</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((farm, i) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 card-hover group"
              >
                {/* Card top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{farm.name}</h3>
                      <p className="text-xs text-[var(--color-text-muted)]">{farm.crop_type}</p>
                    </div>
                  </div>
                  <Badge label={`${farm.health_score ?? '--'}/100`} variant={healthColor(farm.health_score)} />
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <Ruler className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                    <span>{farm.area_ha} hectares</span>
                  </div>
                </div>

                {/* Map */}
                <div className="h-32 bg-gray-100 rounded-xl mb-5 overflow-hidden border border-[var(--color-border)]">
                  {(() => {
                    const coords = parsePolygon(farm.polygon)
                    if (coords.length > 0) {
                      const center = getCentroid(coords)
                      return (
                        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Polygon positions={coords} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }} />
                        </MapContainer>
                      )
                    }
                    return <div className="h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">No polygon data</div>
                  })()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setSelectedFarm(farm); navigate('/') }}
                    className="flex-1 text-xs py-2 px-3 bg-[var(--color-primary)]/15 text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] font-medium transition-colors"
                  >
                    Select Farm
                  </button>
                  <button
                    onClick={() => setDeleteTarget(farm)}
                    className="p-2 rounded-lg hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)] text-[var(--color-text-muted)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Farm" size="sm">
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will remove all associated data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>Delete Farm</Button>
        </div>
      </Modal>
    </div>
  )
}
