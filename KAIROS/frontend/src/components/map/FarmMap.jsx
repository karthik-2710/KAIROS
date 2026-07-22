import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from 'react-leaflet'
import { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function PolygonDrawer({ onPolygonChange }) {
  const [points, setPoints] = useState([])

  useMapEvents({
    click(e) {
      const newPoints = [...points, [e.latlng.lat, e.latlng.lng]]
      setPoints(newPoints)
      onPolygonChange(newPoints)
    },
    dblclick() {
      setPoints([])
      onPolygonChange([])
    },
  })

  return points.length > 2 ? (
    <Polygon
      positions={points}
      pathOptions={{ color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.25, weight: 2 }}
    />
  ) : null
}

export default function FarmMap({
  farms = [],
  selectedFarm = null,
  drawMode = false,
  onPolygonChange,
  center = [20.5937, 78.9629],
  zoom = 5,
  height = '400px',
}) {
  return (
    <div style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Existing farms */}
        {farms.map(farm => {
          const polygon = typeof farm.polygon === 'string' ? JSON.parse(farm.polygon) : farm.polygon
          if (!polygon || polygon.length < 3) return null
          const isSelected = selectedFarm?.id === farm.id
          return (
            <Polygon
              key={farm.id}
              positions={polygon}
              pathOptions={{
                color: isSelected ? '#16A34A' : '#2563EB',
                fillColor: isSelected ? '#16A34A' : '#2563EB',
                fillOpacity: isSelected ? 0.3 : 0.15,
                weight: isSelected ? 3 : 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{farm.name}</p>
                  <p className="text-slate-500 text-xs">{farm.crop_type} · {farm.area_ha} ha</p>
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {/* Drawing mode */}
        {drawMode && <PolygonDrawer onPolygonChange={onPolygonChange} />}
      </MapContainer>
    </div>
  )
}
