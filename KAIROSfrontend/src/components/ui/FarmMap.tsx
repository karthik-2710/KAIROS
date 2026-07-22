import React, { useRef, useEffect, useState } from 'react'
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import * as turf from '@turf/turf'

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
        map.fitBounds(layer.getBounds(), { padding: [20, 20] })
      } catch (e) {}
    }
  }, [geojson, map])
  return null
}

export function FarmMap({ mode, polygon, onChange, ndviColor, height = '400px' }: FarmMapProps) {
  const [mapCenter] = useState<[number, number]>([11.02, 76.95])
  const featureGroupRef = useRef<L.FeatureGroup>(null)

  // Parse existing polygon if available and format as GeoJSON
  const parsedGeoJSON = React.useMemo(() => {
    if (!polygon) return null
    try {
      const parsed = JSON.parse(polygon)
      
      // Handle legacy array format [[lat, lon], ...]
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return null
        // Convert to GeoJSON [lon, lat]
        const coords = parsed.map((p: any) => [Number(p[1]), Number(p[0])])
        // Ensure closed ring
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

  const handleCreated = (e: any) => {
    const layer = e.layer
    updateParentGeoJSON(layer)
  }

  const handleEdited = (e: any) => {
    const layers = e.layers
    layers.eachLayer((layer: any) => {
      updateParentGeoJSON(layer)
    })
  }

  const handleDeleted = () => {
    if (onChange) onChange('', 0)
  }

  const updateParentGeoJSON = (layer: any) => {
    if (!onChange) return
    const geojson = layer.toGeoJSON()
    // geojson is a Feature, we want just the Geometry (Polygon)
    const geometry = geojson.geometry
    
    // Calculate area
    try {
      const areaSqMeters = turf.area(geometry)
      const areaHa = areaSqMeters / 10000 // Convert to Hectares
      onChange(JSON.stringify(geometry), areaHa)
    } catch {
      onChange(JSON.stringify(geometry), 0)
    }
  }

  // Effect to load existing polygon into edit mode FeatureGroup
  useEffect(() => {
    if (mode === 'edit' && parsedGeoJSON && featureGroupRef.current) {
      const fg = featureGroupRef.current
      fg.clearLayers() // Clear existing to prevent duplicates on remount
      
      const layer = L.geoJSON(parsedGeoJSON)
      layer.eachLayer((l) => {
        fg.addLayer(l)
      })
    }
  }, [mode, parsedGeoJSON])

  const polyStyle = {
    color: ndviColor || '#2E7D32',
    weight: 3,
    fillOpacity: 0.4,
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri"
        />
        
        <MapBounds geojson={parsedGeoJSON} />
        
        {mode === 'edit' ? (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                }
              }}
            />
          </FeatureGroup>
        ) : (
          parsedGeoJSON && (
            <GeoJSON data={parsedGeoJSON} style={polyStyle} />
          )
        )}
      </MapContainer>
    </div>
  )
}
