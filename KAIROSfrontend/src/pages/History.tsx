import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts'
import { 
  Calendar, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  CloudSun, 
  Sprout, 
  CheckCircle2, 
  Layers, 
  Camera, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react'

interface HistoryEvent {
  id: number
  type: 'disease' | 'weather' | 'sensor' | 'rec' | 'treatment'
  title: string
  crop: 'Rice' | 'Mango' | 'Wheat' | 'Cotton' | 'Barley'
  severity: 'Low' | 'Moderate' | 'High'
  status: 'Resolved' | 'Pending' | 'Applied'
  date: string // e.g. "2026-07-15"
  desc: string
  actionLabel?: string
}

export default function History() {
  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCrop, setSelectedCrop] = React.useState('All')
  const [selectedSeverity, setSelectedSeverity] = React.useState('All')
  const [selectedStatus, setSelectedStatus] = React.useState('All')

  // Seeded unified history events list
  const historyEvents: HistoryEvent[] = [
    {
      id: 1,
      type: 'disease',
      title: 'Bacterial Leaf Blight Diagnosed',
      crop: 'Rice',
      severity: 'High',
      status: 'Pending',
      date: '2026-07-15',
      desc: 'MobileNetV3 small network isolated cell structure vectors on North Paddy Field leaf snapshots. Recommended copper-based bactericide.',
      actionLabel: 'CNN Scanner: 97.4% confidence'
    },
    {
      id: 2,
      type: 'treatment',
      title: 'Fungicide Spray Treatment Applied',
      crop: 'Rice',
      severity: 'Moderate',
      status: 'Applied',
      date: '2026-07-14',
      desc: 'Applied copper hydroxide bactericide following leaf scan diagnostic warning protocols. Row sectors 3 and 4 covered.',
      actionLabel: 'Treatment: Copper Hydroxide'
    },
    {
      id: 3,
      type: 'sensor',
      title: 'Critically Low Soil Moisture Warning',
      crop: 'Mango',
      severity: 'High',
      status: 'Resolved',
      date: '2026-07-12',
      desc: 'IoT Node #02 capacitance sensor logged soil moisture levels at 24% for 3 consecutive hours. Triggered automatic moisture alerts.',
      actionLabel: 'IoT Sensor Grid: Node #02'
    },
    {
      id: 4,
      type: 'rec',
      title: 'Irrigation Advisory Dispatched',
      crop: 'Mango',
      severity: 'Moderate',
      status: 'Resolved',
      date: '2026-07-12',
      desc: 'Agronomist recommendation dispatched: Trigger pre-dawn deep watering cycle to mitigate ambient evaporation.',
      actionLabel: 'Advisory: Water Index rule'
    },
    {
      id: 5,
      type: 'weather',
      title: 'Dry Wind & High Heat Wave Event',
      crop: 'Wheat',
      severity: 'Low',
      status: 'Resolved',
      date: '2026-07-10',
      desc: 'OpenWeatherMap API flagged localized temperatures over 38°C with sub-20% relative humidity. Elevated transpiration rates noted.',
      actionLabel: 'Weather: Heat warning'
    },
    {
      id: 6,
      type: 'disease',
      title: 'Leaf Spot Pathology Cleared',
      crop: 'Barley',
      severity: 'Low',
      status: 'Resolved',
      date: '2026-07-06',
      desc: 'Leaf snapshot scanned via mobile diagnostics. Cell structure indicators analyzed as normal. No pathogen spores detected.',
      actionLabel: 'CNN Scanner: 99.1% healthy'
    },
    {
      id: 7,
      type: 'sensor',
      title: 'Soil Acidification Detected (pH 5.4)',
      crop: 'Rice',
      severity: 'High',
      status: 'Pending',
      date: '2026-07-02',
      desc: 'IoT Node #03 reports consecutive pH levels dropping to 5.4. Cross-referencing against moisture data to verify anomaly.',
      actionLabel: 'IoT Sensor Grid: Node #03'
    },
    {
      id: 8,
      type: 'treatment',
      title: 'Liming Fertilizer Application',
      crop: 'Cotton',
      severity: 'Low',
      status: 'Applied',
      date: '2026-06-28',
      desc: 'Applied agricultural lime to target field sectors to stabilize soil acidity levels back to WGS baseline limits.',
      actionLabel: 'Treatment: Soil Amendment'
    }
  ]

  // Filter logic
  const filteredEvents = historyEvents.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.desc.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCrop = selectedCrop === 'All' || e.crop === selectedCrop
    const matchesSeverity = selectedSeverity === 'All' || e.severity === selectedSeverity
    const matchesStatus = selectedStatus === 'All' || e.status === selectedStatus
    return matchesSearch && matchesCrop && matchesSeverity && matchesStatus
  })

  // Chart data calculations: Count of events by type
  const chartData = [
    { name: 'Disease Scans', count: historyEvents.filter(e => e.type === 'disease').length, color: '#FFB300' },
    { name: 'Sensor Alerts', count: historyEvents.filter(e => e.type === 'sensor').length, color: '#ef4444' },
    { name: 'Weather Events', count: historyEvents.filter(e => e.type === 'weather').length, color: '#3b82f6' },
    { name: 'Advisories', count: historyEvents.filter(e => e.type === 'rec').length, color: '#8b5cf6' },
    { name: 'Treatments', count: historyEvents.filter(e => e.type === 'treatment').length, color: '#2E7D32' },
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'disease':
        return <Camera className="h-4.5 w-4.5 text-[#FFB300]" />
      case 'weather':
        return <CloudSun className="h-4.5 w-4.5 text-blue-500" />
      case 'sensor':
        return <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
      case 'rec':
        return <Layers className="h-4.5 w-4.5 text-purple-500" />
      case 'treatment':
        return <CheckCircle2 className="h-4.5 w-4.5 text-[#2E7D32]" />
      default:
        return <HelpCircle className="h-4.5 w-4.5 text-slate-500" />
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'High':
        return <Badge variant="destructive" className="text-[9px] py-0 font-bold uppercase tracking-wider">High</Badge>
      case 'Moderate':
        return <Badge variant="warning" className="text-[9px] py-0 font-bold uppercase tracking-wider">Moderate</Badge>
      default:
        return <Badge variant="success" className="text-[9px] py-0 font-bold uppercase tracking-wider">Low</Badge>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Applied':
        return <Badge className="bg-[#2E7D32] text-white text-[8px] py-0 px-1.5 font-bold uppercase"><CheckCircle className="h-3 w-3 mr-1 shrink-0" /> Applied</Badge>
      case 'Resolved':
        return <Badge className="bg-blue-600 text-white text-[8px] py-0 px-1.5 font-bold uppercase"><CheckCircle className="h-3 w-3 mr-1 shrink-0" /> Resolved</Badge>
      default:
        return <Badge className="bg-amber-500 text-white text-[8px] py-0 px-1.5 font-bold uppercase"><ShieldAlert className="h-3 w-3 mr-1 shrink-0" /> Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Analysis & Event History</h1>
        <p className="text-xs text-slate-500">
          Chronological historical logs of crop diagnoses, weather indicators, sensor alerts, and treatment applications.
        </p>
      </div>

      {/* ─── CHARTS SUMMARIZING EVENT HISTORY ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Historical Events Distribution</span>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -30, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EA" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#DCE3D6', fontSize: 11 }} />
                <Bar dataKey="count" fill="#2E7D32" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── DYNAMIC FILTERING & SEARCH BAR ─────────────────────────────────────── */}
      <Card className="bg-[#EDF1EA]/10 border-[#DCE3D6]/70">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search historical logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Toggle headers */}
            <div className="flex items-center space-x-2 shrink-0 text-slate-500 font-bold text-xs">
              <SlidersHorizontal className="h-4.5 w-4.5" />
              <span>Filters</span>
            </div>
          </div>

          {/* Filtering selectors */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-xs font-semibold">
            {/* Crop select */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Crop type</span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
              >
                <option value="All">All Crops</option>
                <option value="Rice">Rice</option>
                <option value="Mango">Mango</option>
                <option value="Wheat">Wheat</option>
                <option value="Cotton">Cotton</option>
                <option value="Barley">Barley</option>
              </select>
            </div>

            {/* Severity select */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Severity level</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Status select */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status type</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Applied">Applied</option>
              </select>
            </div>

            {/* Date filter dropdown shortcut */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date Interval</span>
              <select
                disabled
                className="flex h-9.5 w-full rounded-lg border border-[#DCE3D6] bg-slate-50 px-3 py-1.5 text-xs text-slate-400 focus:outline-none"
              >
                <option value="All">All Time Logs</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── TIMELINE SECTION ────────────────────────────────────────────────────── */}
      <div className="relative border-l-2 border-[#EDF1EA] pl-6 ml-4 space-y-6 pt-2">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              
              {/* Timeline Pin Dot */}
              <div className="absolute -left-[32.5px] top-1 bg-white h-5 w-5 rounded-full border-2 border-[#EDF1EA] group-hover:border-[#2E7D32] flex items-center justify-center transition shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-[#2E7D32]" />
              </div>

              {/* Timeline Event Card */}
              <Card className="hover:border-[#DCE3D6] transition-all bg-white shadow-sm">
                <CardContent className="p-4 space-y-3">
                  
                  {/* Card Header: Type, Crop Badge, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF1EA]/50 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDF1EA]/30 border border-[#DCE3D6]/20">
                        {getEventIcon(event.type)}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {event.type === 'rec' ? 'Agronomist Advisory' : event.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> {event.date}
                      </span>
                      <Badge variant="secondary" className="text-[9px] py-0 font-bold uppercase tracking-wide">
                        <Sprout className="h-3 w-3 mr-1 text-[#2E7D32]" /> {event.crop}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Body: Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{event.desc}</p>
                  </div>

                  {/* Card Footer: Severity, Status & Action Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDF1EA]/40 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Severity:</span>
                        {getSeverityBadge(event.severity)}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Status:</span>
                        {getStatusBadge(event.status)}
                      </div>
                    </div>

                    {event.actionLabel && (
                      <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#2e7d32]/10">
                        {event.actionLabel}
                      </span>
                    )}
                  </div>

                </CardContent>
              </Card>

            </div>
          ))
        ) : (
          <div className="text-center py-12 text-xs text-slate-400">
            No events match your current filter parameters.
          </div>
        )}
      </div>

    </div>
  )
}
