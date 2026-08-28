import React, { useRef, useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import * as turf from '@turf/turf'
import { Pencil, Pentagon, Trash2 } from 'lucide-react'

// Fix default marker icon issues in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface FarmMapProps {
  mode: 'view' | 'edit'
  polygon?: string // GeoJSON string
  onChange?: (geojson: string, areaHa: number) => void
  ndviColor?: string
  height?: string
}

function MapBounds({ geojson }: { geojson: any }) {
  const map = useMap()
  useEffect(() => {
    if (geojson) {
      try {
        const layer = L.geoJSON(geojson)
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] })
        }
      } catch (e) {}
    }
  }, [geojson, map])
  return null
}

export function FarmMap({ mode, polygon, onChange, ndviColor, height = '400px' }: FarmMapProps) {
  const [mapCenter] = useState<[number, number]>([11.02, 76.95])
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const isInternalChange = useRef(false)
  const [drawTool, setDrawTool] = useState<'freehand' | 'polygon' | null>('freehand')
  const [isDrawing, setIsDrawing] = useState(false)
  const [pointCount, setPointCount] = useState(0)

  // Parse existing polygon if available and format as GeoJSON
  const parsedGeoJSON = React.useMemo(() => {
    if (!polygon) return null
    try {
      const parsed = JSON.parse(polygon)
      
      // Handle legacy array format [[lat, lon], ...]
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return null
        const coords = parsed.map((p: any) => [Number(p[1]), Number(p[0])])
        const first = coords[0]
        const last = coords[coords.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push([...first])
        }
        return {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
      
      return parsed
    } catch {
      return null
    }
  }, [polygon])

  const updateParentGeoJSON = useCallback((layer: any) => {
    if (!onChange) return
    isInternalChange.current = true
    const geojson = layer.toGeoJSON()
    const geometry = geojson.geometry
    
    try {
      const areaSqMeters = turf.area(geometry)
      const areaHa = Math.round((areaSqMeters / 10000) * 100) / 100 // Convert to Hectares
      onChange(JSON.stringify(geometry), areaHa)
    } catch {
      onChange(JSON.stringify(geometry), 0)
    }
  }, [onChange])

  // Effect to load existing polygon into edit mode FeatureGroup
  useEffect(() => {
    if (mode === 'edit' && parsedGeoJSON && featureGroupRef.current) {
      if (isInternalChange.current) {
        isInternalChange.current = false
        return
      }

      const fg = featureGroupRef.current
      fg.clearLayers()
      
      const layer = L.geoJSON(parsedGeoJSON, {
        style: {
          color: '#10b981',
          weight: 3,
          fillColor: '#10b981',
          fillOpacity: 0.3
        }
      })
      layer.eachLayer((l) => {
        fg.addLayer(l)
      })
    }
  }, [mode, parsedGeoJSON])

  const handleClear = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    if (onChange) onChange('', 0)
    setPointCount(0)
  }

  // Freehand and Native Draw Controller Component
  const FreehandAndDrawManager = () => {
    const map = useMap()
    const isMouseDown = useRef(false)
    const pointsRef = useRef<L.LatLng[]>([])
    const activePolylineRef = useRef<L.Polyline | null>(null)

    useEffect(() => {
      if (mode !== 'edit' || !featureGroupRef.current) return

      const fg = featureGroupRef.current

      // If in standard polygon mode, initialize Leaflet.Draw polygon handler
      if (drawTool === 'polygon') {
        const drawControl = new L.Control.Draw({
          edit: { featureGroup: fg, remove: true },
          draw: {
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: {
                color: '#10b981',
                weight: 3,
                fillOpacity: 0.3
              }
            }
          }
        })

        map.addControl(drawControl)

        const onCreated = (e: any) => {
          fg.clearLayers()
          fg.addLayer(e.layer)
          updateParentGeoJSON(e.layer)
        }

        map.on(L.Draw.Event.CREATED, onCreated)

        return () => {
          map.removeControl(drawControl)
          map.off(L.Draw.Event.CREATED, onCreated)
        }
      }

      // If in Freehand mode, listen to mouse/touch drag events
      if (drawTool === 'freehand') {
        const mapContainer = map.getContainer()
        mapContainer.style.cursor = 'crosshair'

        const onMouseDown = (e: L.LeafletMouseEvent) => {
          // Disable map panning while freehand drawing
          map.dragging.disable()
          isMouseDown.current = true
          setIsDrawing(true)
          pointsRef.current = [e.latlng]

          if (activePolylineRef.current) {
            map.removeLayer(activePolylineRef.current)
          }

          activePolylineRef.current = L.polyline([e.latlng], {
            color: '#10b981',
            weight: 3.5,
            opacity: 0.9,
            dashArray: '4, 4'
          }).addTo(map)
        }

        const onMouseMove = (e: L.LeafletMouseEvent) => {
          if (!isMouseDown.current || !activePolylineRef.current) return

          const lastPt = pointsRef.current[pointsRef.current.length - 1]
          if (lastPt) {
            const dist = map.distance(lastPt, e.latlng)
            // Only add point if moved at least 2 meters to avoid redundant dense points
            if (dist > 2) {
              pointsRef.current.push(e.latlng)
              activePolylineRef.current.setLatLngs(pointsRef.current)
              setPointCount(pointsRef.current.length)
            }
          }
        }

        const onMouseUp = () => {
          if (!isMouseDown.current) return
          isMouseDown.current = false
          setIsDrawing(false)
          map.dragging.enable()

          if (activePolylineRef.current) {
            map.removeLayer(activePolylineRef.current)
            activePolylineRef.current = null
          }

          const rawPoints = pointsRef.current
          if (rawPoints.length >= 3) {
            // Close the loop
            const coords = rawPoints.map(p => [p.lng, p.lat])
            coords.push([rawPoints[0].lng, rawPoints[0].lat])

            const rawPoly = turf.polygon([coords])
            // Simplify slightly to ensure smooth, clean topology
            let simplified = rawPoly
            try {
              simplified = turf.simplify(rawPoly, { tolerance: 0.00003, highQuality: true })
            } catch (err) {}

            fg.clearLayers()
            const finalLayer = L.geoJSON(simplified, {
              style: {
                color: '#10b981',
                weight: 3,
                fillColor: '#10b981',
                fillOpacity: 0.35
              }
            })

            finalLayer.eachLayer(l => fg.addLayer(l))
            updateParentGeoJSON(finalLayer)
          }
          pointsRef.current = []
        }

        map.on('mousedown', onMouseDown)
        map.on('mousemove', onMouseMove)
        map.on('mouseup', onMouseUp)

        // Touch support
        const onTouchStart = (e: any) => {
          if (e.touches && e.touches.length === 1) {
            const touch = e.touches[0]
            const containerPoint = L.point(touch.clientX, touch.clientY)
            const latlng = map.containerPointToLatLng(containerPoint)
            onMouseDown({ latlng } as any)
          }
        }
        const onTouchMove = (e: any) => {
          if (e.touches && e.touches.length === 1) {
            const touch = e.touches[0]
            const containerPoint = L.point(touch.clientX, touch.clientY)
            const latlng = map.containerPointToLatLng(containerPoint)
            onMouseMove({ latlng } as any)
          }
        }
        const onTouchEnd = () => onMouseUp()

        mapContainer.addEventListener('touchstart', onTouchStart, { passive: true })
        mapContainer.addEventListener('touchmove', onTouchMove, { passive: true })
        mapContainer.addEventListener('touchend', onTouchEnd)

        return () => {
          mapContainer.style.cursor = ''
          map.dragging.enable()
          map.off('mousedown', onMouseDown)
          map.off('mousemove', onMouseMove)
          map.off('mouseup', onMouseUp)
          mapContainer.removeEventListener('touchstart', onTouchStart)
          mapContainer.removeEventListener('touchmove', onTouchMove)
          mapContainer.removeEventListener('touchend', onTouchEnd)
        }
      }

      return () => {}
    }, [drawTool, map, mode, updateParentGeoJSON])

    return null
  }

  const polyStyle = {
    color: ndviColor || '#1F4E46',
    weight: 3,
    opacity: 1,
    fillOpacity: 0.25,
    className: 'farm-polygon-glow'
  }

  const hoverStyle = {
    weight: 5,
    fillOpacity: 0.4,
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
      
      {/* ─── FLOATING FREEHAND & POLYGON TOOLBAR (EDIT MODE) ────────────────────────── */}
      {mode === 'edit' && (
        <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg text-xs">
          
          {/* Freehand Tool Button */}
          <button
            type="button"
            onClick={() => setDrawTool('freehand')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition shadow-sm ${
              drawTool === 'freehand'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Hold mouse down and draw freeflow organic boundaries"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Freehand Draw</span>
            {drawTool === 'freehand' && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
          </button>

          {/* Corner-by-Corner Polygon Button */}
          <button
            type="button"
            onClick={() => setDrawTool('polygon')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              drawTool === 'polygon'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Click corners to create straight-line polygon"
          >
            <Pentagon className="h-3.5 w-3.5" />
            <span>Corner Points</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Clear shape and redraw"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          {/* Helper / Instruction Badge */}
          {drawTool === 'freehand' && (
            <div className="hidden sm:flex items-center space-x-1 px-2 text-[10px] font-semibold text-slate-500 font-mono">
              <span>{isDrawing ? `Drawing... (${pointCount} pts)` : 'Click & hold to trace field'}</span>
            </div>
          )}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri"
          zIndex={1}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          zIndex={2}
        />
        
        <MapBounds geojson={parsedGeoJSON} />
        
        {mode === 'edit' ? (
          <FeatureGroup ref={featureGroupRef}>
            <FreehandAndDrawManager />
          </FeatureGroup>
        ) : (
          parsedGeoJSON && (
            <GeoJSON 
              data={parsedGeoJSON} 
              style={polyStyle} 
              eventHandlers={{
                mouseover: (e) => {
                  e.layer.setStyle(hoverStyle)
                },
                mouseout: (e) => {
                  e.layer.setStyle(polyStyle)
                }
              }}
            />
          )
        )}
      </MapContainer>
    </div>
  )
}
