import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { FarmContextType } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts'
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Zap, 
  Compass, 
  Battery, 
  Activity, 
  Radio, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react'

// Define the sensor card schema
interface SensorCard {
  id: string
  name: string
  icon: any
  unit: string
  value: number
  status: 'Optimal' | 'Warning' | 'Critical'
  color: string
  history: number[]
}

export default function IoTMonitoring() {
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const currentFarm = farms.find(f => f.id === selectedFarmId) || farms[0]

  // Initialize live telemetry values
  const [sensors, setSensors] = React.useState<Record<string, SensorCard>>({
    temp: { id: 'temp', name: 'Air Temperature', icon: Thermometer, unit: '°C', value: 28.4, status: 'Optimal', color: '#FFB300', history: [27.2, 27.5, 27.9, 28.1, 28.4] },
    humidity: { id: 'humidity', name: 'Rel. Humidity', icon: Droplets, unit: '%', value: 64.2, status: 'Optimal', color: '#3b82f6', history: [62.1, 63.5, 63.8, 64.0, 64.2] },
    moisture: { id: 'moisture', name: 'Soil Moisture', icon: Droplets, unit: '%', value: 48.6, status: 'Optimal', color: '#1d4ed8', history: [45.1, 46.2, 47.0, 48.1, 48.6] },
    light: { id: 'light', name: 'Solar Radiation', icon: Sun, unit: 'Lux', value: 4520, status: 'Optimal', color: '#f59e0b', history: [4210, 4350, 4420, 4500, 4520] },
    nitrogen: { id: 'nitrogen', name: 'Soil Nitrogen (N)', icon: Activity, unit: 'mg/kg', value: 42.1, status: 'Optimal', color: '#10b981', history: [40.5, 41.2, 41.8, 42.0, 42.1] },
    phosphorus: { id: 'phosphorus', name: 'Soil Phosphorus (P)', icon: Activity, unit: 'mg/kg', value: 18.4, status: 'Warning', color: '#f59e0b', history: [19.2, 19.0, 18.8, 18.5, 18.4] },
    potassium: { id: 'potassium', name: 'Soil Potassium (K)', icon: Activity, unit: 'mg/kg', value: 342.0, status: 'Optimal', color: '#8b5cf6', history: [338.0, 339.5, 340.2, 341.5, 342.0] },
    ec: { id: 'ec', name: 'Conductivity (EC)', icon: Zap, unit: 'dS/m', value: 1.42, status: 'Optimal', color: '#10b981', history: [1.38, 1.40, 1.41, 1.42, 1.42] },
    ph: { id: 'ph', name: 'Soil pH', icon: Compass, unit: 'pH', value: 5.8, status: 'Warning', color: '#ef4444', history: [6.1, 6.0, 5.9, 5.9, 5.8] },
    battery: { id: 'battery', name: 'Node Battery', icon: Battery, unit: 'V', value: 3.82, status: 'Optimal', color: '#10b981', history: [3.90, 3.88, 3.86, 3.84, 3.82] }
  })

  // Simulated live logs feed
  const [logs, setLogs] = React.useState<Array<{ time: string; nodeId: string; event: string; status: 'info' | 'warn' | 'crit' }>>([
    { time: new Date().toLocaleTimeString(), nodeId: 'NODE_02', event: 'Transmitted NPK indices successfully', status: 'info' },
    { time: new Date(Date.now() - 4000).toLocaleTimeString(), nodeId: 'NODE_01', event: 'Telemetry check completed', status: 'info' },
    { time: new Date(Date.now() - 15000).toLocaleTimeString(), nodeId: 'NODE_03', event: 'Soil pH index dropped below 6.0', status: 'warn' },
    { time: new Date(Date.now() - 30000).toLocaleTimeString(), nodeId: 'NODE_04', event: 'Hardware battery critical warning (3.1V)', status: 'crit' }
  ])

  // Periodic ticking generator to simulate live IoT sensors streams
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => {
        const next = { ...prev }
        
        // Randomly modify a couple of values slightly
        const keys = Object.keys(next)
        const randomKeys = [
          keys[Math.floor(Math.random() * keys.length)],
          keys[Math.floor(Math.random() * keys.length)]
        ]

        randomKeys.forEach(key => {
          const s = next[key]
          let offset = 0
          
          if (s.id === 'light') {
            offset = Math.floor(Math.random() * 40 - 20)
          } else if (s.id === 'potassium') {
            offset = Math.floor(Math.random() * 6 - 3)
          } else if (s.id === 'ph' || s.id === 'ec' || s.id === 'battery' || s.id === 'temp') {
            offset = Math.round((Math.random() * 0.08 - 0.04) * 100) / 100
          } else {
            offset = Math.round((Math.random() * 0.4 - 0.2) * 10) / 10
          }

          const newValue = Math.round((s.value + offset) * 100) / 100
          const updatedHistory = [...s.history.slice(1), newValue]
          
          // Re-evaluate warnings
          let status = s.status
          if (s.id === 'ph') {
            status = newValue < 5.8 ? 'Critical' : newValue < 6.0 ? 'Warning' : 'Optimal'
          } else if (s.id === 'moisture') {
            status = newValue < 30 ? 'Critical' : newValue < 40 ? 'Warning' : 'Optimal'
          }

          next[key] = {
            ...s,
            value: newValue,
            status,
            history: updatedHistory
          }
        })

        return next
      })

      // Add a fresh log item randomly
      if (Math.random() > 0.4) {
        const demoNodes = ['NODE_01', 'NODE_02', 'NODE_03']
        const node = demoNodes[Math.floor(Math.random() * demoNodes.length)]
        const timestamp = new Date().toLocaleTimeString()
        
        setLogs(prev => [
          { time: timestamp, nodeId: node, event: 'Transmitted active telemetry packet', status: 'info' },
          ...prev.slice(0, 7)
        ])
      }

    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Map data to Recharts Sparkline formats
  const renderSparkline = (history: number[], color: string) => {
    const data = history.map((val, idx) => ({ id: idx, value: val }))
    return (
      <div className="h-10 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={1.5} 
              fill={`url(#grad-${color})`} 
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Active alarms count
  const warnings = Object.values(sensors).filter(s => s.status !== 'Optimal')

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">IoT Telemetry Grid</h1>
          <p className="text-xs text-slate-500">
            Live telemetry feed from node grids registered at {currentFarm?.name}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Telemetry Feed Active
          </span>
        </div>
      </div>

      {/* ─── SENSORS 10 CARDS GRID ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Object.values(sensors).map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.id} className="hover:border-[#DCE3D6] transition-all">
              <CardContent className="p-4 space-y-3 flex flex-col justify-between h-full">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.name}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDF1EA]/50 text-slate-600 border border-[#DCE3D6]/35">
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                </div>

                {/* Values & Sparkline Row */}
                <div className="flex items-end justify-between pt-1">
                  <div>
                    {/* Tick animated number representation */}
                    <p className="text-xl font-extrabold text-slate-900 leading-none tracking-tight">
                      {s.value}
                      <span className="text-xs font-semibold text-slate-400 ml-0.5">{s.unit}</span>
                    </p>
                    <Badge 
                      variant={s.status === 'Optimal' ? 'success' : s.status === 'Warning' ? 'warning' : 'destructive'}
                      className="text-[9px] py-0 px-1.5 mt-2.5 font-bold"
                    >
                      {s.status}
                    </Badge>
                  </div>
                  {renderSparkline(s.history, s.color)}
                </div>

                {/* Last updated footer */}
                <div className="text-[8px] text-slate-400 border-t border-[#EDF1EA]/50 pt-2 flex items-center justify-between">
                  <span>Sensor ID: IoT_{s.id.toUpperCase()}</span>
                  <span>Just now</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── BOTTOM SECTION: DIAGNOSTICS, SENSOR LOCATION MAP, ALERTS ────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Offline nodes & Location Map */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-[#EDF1EA]/50">
              <CardTitle>Hardware Node Spatial Map</CardTitle>
              <CardDescription>Geometric coordinates layout mapping registered nodes across the coordinates perimeter.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6 md:grid-cols-5 items-center">
              
              {/* SVG Map (3 cols) */}
              <div className="md:col-span-3 h-44 rounded-xl border border-[#DCE3D6]/70 bg-gradient-to-br from-[#F7F9F5] to-white relative overflow-hidden flex items-center justify-center shadow-inner">
                {/* Field schema grid backdrop */}
                <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                
                {/* Field outline perimeter polygon */}
                <svg className="h-full w-full max-w-[200px]" viewBox="0 0 100 100">
                  <polygon 
                    points="20,20 80,15 85,75 15,80" 
                    fill="rgba(46, 125, 50, 0.05)" 
                    stroke="#2E7D32" 
                    strokeWidth="1.2" 
                    strokeDasharray="2 2"
                  />
                  
                  {/* Blinking green nodes */}
                  <g>
                    {/* Node 1 */}
                    <circle cx="35" cy="35" r="3.5" fill="#2E7D32" />
                    <circle cx="35" cy="35" r="8" stroke="#2E7D32" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <text x="35" y="28" fontSize="6" fill="#64748b" fontWeight="bold" textAnchor="middle">N-01</text>
                  </g>

                  <g>
                    {/* Node 2 */}
                    <circle cx="65" cy="40" r="3.5" fill="#2E7D32" />
                    <circle cx="65" cy="40" r="8" stroke="#2E7D32" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '4s' }} />
                    <text x="65" y="33" fontSize="6" fill="#64748b" fontWeight="bold" textAnchor="middle">N-02</text>
                  </g>

                  <g>
                    {/* Node 3 */}
                    <circle cx="50" cy="65" r="3.5" fill="#2E7D32" />
                    <circle cx="50" cy="65" r="8" stroke="#2E7D32" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                    <text x="50" y="58" fontSize="6" fill="#64748b" fontWeight="bold" textAnchor="middle">N-03</text>
                  </g>

                  {/* Offline Red Blinking Node 4 */}
                  <g>
                    <circle cx="25" cy="60" r="3.5" fill="#ef4444" />
                    <circle cx="25" cy="60" r="7" stroke="#ef4444" strokeWidth="0.8" fill="none" className="animate-pulse" />
                    <text x="25" y="53" fontSize="6" fill="#ef4444" fontWeight="bold" textAnchor="middle">N-04</text>
                  </g>
                </svg>
              </div>

              {/* Status List side panel (2 cols) */}
              <div className="md:col-span-2 space-y-4 text-xs">
                <div className="space-y-1 border-b border-[#EDF1EA]/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Telemetry Health</span>
                  <p className="font-bold text-slate-800 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-[#2E7D32]" /> 3/4 Nodes Online
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Offline Warnings</span>
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2 space-y-1 text-[10px] text-red-800">
                    <p className="font-bold flex items-center">
                      <Lock className="h-3 w-3 mr-1" /> Node #04 (West boundary)
                    </p>
                    <p className="text-slate-500 leading-normal">Offline 4.2h: Voltage dropped below critical threshold (3.1V).</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Warnings log feed & Transaction Table */}
        <div className="space-y-6">
          
          {/* active alerts widget */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#EDF1EA]/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Node Alarms</CardTitle>
                <CardDescription>Telemetry values crossing baseline indices.</CardDescription>
              </div>
              <Badge variant={warnings.length > 0 ? 'warning' : 'secondary'}>
                {warnings.length} Flagged
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {warnings.length > 0 ? (
                warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{w.name} Threshold Breach</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        Current level is {w.value} {w.unit} ({w.status}). Target limits violated.
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  All metrics are in optimal range.
                </div>
              )}
            </CardContent>
          </Card>

          {/* live logs table */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#EDF1EA]/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Packet Feed</CardTitle>
                <CardDescription>Transmissions from distributed nodes.</CardDescription>
              </div>
              <Radio className="h-4 w-4 text-[#2E7D32] animate-pulse" />
            </CardHeader>
            <CardContent className="pt-4 max-h-48 overflow-y-auto pr-1">
              <div className="space-y-3 text-[10px]">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2 justify-between border-b border-[#EDF1EA]/40 pb-2 last:border-b-0 last:pb-0">
                    <span className="font-mono text-slate-400 shrink-0">{log.time}</span>
                    <span className="font-bold text-[#2E7D32] shrink-0">{log.nodeId}</span>
                    <span className="text-slate-600 text-left flex-1 pl-3 truncate">{log.event}</span>
                    <Badge variant={log.status === 'crit' ? 'destructive' : log.status === 'warn' ? 'warning' : 'secondary'} className="py-0 px-1 text-[8px]">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
