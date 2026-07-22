import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Compass, 
  Satellite, 
  Activity, 
  CloudSun, 
  Brain, 
  Camera, 
  Check, 
  ArrowRight, 
  Play, 
  Droplets,
  Layers,
  Thermometer,
  Shield,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts'

export default function Landing() {
  const navigate = useNavigate()
  
  // Interactive Preview Demo state
  const [demoFarm, setDemoFarm] = React.useState(1)
  const [demoScanning, setDemoScanning] = React.useState(false)
  const [demoScanDone, setDemoScanDone] = React.useState(false)

  // Demo data for selector widget
  const demoFarmsData = {
    1: {
      name: "North Paddy Field (Rice)",
      health: 84,
      moisture: 54,
      temp: 28,
      ndvi: 0.65,
      weather: "Sunny & Clear",
      alert: "None",
      recommendation: "Foliage density is optimal. Next satellite pass scheduled in 4 days."
    },
    2: {
      name: "South Orchard (Mango)",
      health: 48,
      moisture: 28,
      temp: 34,
      ndvi: 0.38,
      weather: "Dry & Warm",
      alert: "Irrigate Immediately",
      recommendation: "Soil moisture critically low (28%). Vegetation stress detected. Initiate watering."
    },
    3: {
      name: "East Wheat Field (Wheat)",
      health: 91,
      moisture: 60,
      temp: 26,
      ndvi: 0.72,
      weather: "Light Breeze",
      alert: "None",
      recommendation: "Ideal moisture and canopy metrics. No actions required."
    }
  }

  const selectedDemo = demoFarmsData[demoFarm as keyof typeof demoFarmsData]

  // Mock charts for the landing page preview
  const demoChartData = [
    { hour: '08:00', moisture: demoFarm === 2 ? 32 : 50, temp: 26 },
    { hour: '12:00', moisture: demoFarm === 2 ? 30 : 52, temp: 31 },
    { hour: '16:00', moisture: demoFarm === 2 ? 28 : 54, temp: 29 },
    { hour: '20:00', moisture: demoFarm === 2 ? 28 : 53, temp: 27 },
  ]

  const handleRunDemoScan = async () => {
    setDemoScanning(true)
    setDemoScanDone(false)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setDemoScanning(false)
    setDemoScanDone(true)
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-800 antialiased overflow-hidden selection:bg-green-100 selection:text-green-950 font-sans">
      
      {/* ─── FLOAT BACKGROUND GLOWS ──────────────────────────────────────────────── */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-green-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-100/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-100/20 blur-[120px] pointer-events-none" />

      {/* ─── PUBLIC HEADER ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#DCE3D6]/50 bg-[#F7F9F5]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-md">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-slate-950">KAIROS</span>
            <span className="block text-[8px] font-bold text-[#2E7D32] uppercase tracking-wider -mt-1">Precision Ag</span>
          </div>
        </div>
        
        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="text-xs font-semibold bg-[#2E7D32] hover:bg-[#1B5E20]">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center max-w-4xl mx-auto space-y-8">
        
        {/* Floating elements art frame */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        
        {/* Small badge link */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 bg-white border border-[#DCE3D6]/80 px-3 py-1 rounded-full text-[10px] font-semibold text-slate-700 shadow-sm"
        >
          <Badge variant="accent" className="text-[8px] py-0 px-1.5 uppercase font-extrabold tracking-wide">SIH 2026</Badge>
          <span>Precision Agriculture Decision Engine</span>
          <ArrowRight className="h-3 w-3 text-[#2E7D32]" />
        </motion.div>

        {/* Title & Subtitle */}
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08] max-w-3xl mx-auto"
          >
            AI-Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] bg-clip-text text-transparent">Precision Agriculture</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            Increase crop yield using Artificial Intelligence, Sentinel-2 Satellite Analysis, IoT Telemetry, and Real-time Weather Intelligence.
          </motion.p>
        </div>

        {/* Hero CTA buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button onClick={() => navigate('/register')} size="lg" className="w-full sm:w-auto bg-[#2E7D32] hover:bg-[#1B5E20] font-semibold shadow-md">
            Connect First Field <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a href="#interactive-preview">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
              <Play className="mr-2 h-4 w-4 text-[#2E7D32] fill-current" /> Watch Live Demo
            </Button>
          </a>
        </motion.div>
      </section>

      {/* ─── VECTOR OUTLINE BACKGROUND DECORATION ──────────────────────────────────── */}
      <section className="px-6 py-6 border-t border-[#DCE3D6]/40 bg-white/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-[#2E7D32]">+30%</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Crop Yield Index</p>
          </div>
          <div className="space-y-1 border-l border-[#EDF1EA]">
            <p className="text-3xl font-extrabold text-[#2E7D32]">-40%</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Water Irrigation Waste</p>
          </div>
          <div className="space-y-1 border-l border-[#EDF1EA]">
            <p className="text-3xl font-extrabold text-[#2E7D32]">10m</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sentinel-2 Resolution</p>
          </div>
          <div className="space-y-1 border-l border-[#EDF1EA]">
            <p className="text-3xl font-extrabold text-[#2E7D32]">0</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">False Alert Rate</p>
          </div>
        </div>
      </section>

      {/* ─── CORE TECHNOLOGY GRID ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-md mx-auto">
          <Badge variant="secondary" className="px-2.5 py-0.5 text-[9px] uppercase font-extrabold tracking-wider text-[#2E7D32]">Agronomic Fusions</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Technological Layers</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Five independent layers verifying environmental datasets to support agricultural yield.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: AI Disease scanner */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6]">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Disease Classification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                MobileNetV3 convolutional neural networks trained on 38 distinct PlantVillage leaf datasets for instant diagnostic vector feedback.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Satellite NDVI */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6]">
                <Satellite className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Sentinel-2 NDVI Analysis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aggregates Band 4 (Red) and Band 8 (Near-Infrared) radiometric scans at 10-meter resolution for real-time foliage index zones mapping.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Weather Intell */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6]">
                <CloudSun className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Weather Frequencies</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Retrieves current canopy weather values and 24-hour precipitation forecasts via OpenWeatherMap APIs to predict fungal risk zones.
              </p>
            </CardContent>
          </Card>

          {/* Card 4: IoT Sensors */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6]">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">IoT Hardware Telemetry</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ESP32 nodes collecting high-frequency soil moisture profiles and air temperature metrics sent directly via HTTP endpoints.
              </p>
            </CardContent>
          </Card>

          {/* Card 5: Recommendation engine */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6]">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Advisory Engine</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero-noise cross-verification logic. Flagged recommendations require at least two independent sensor metrics to trigger.
              </p>
            </CardContent>
          </Card>

          {/* Card 6: SECURE HARDWARE SHELL */}
          <Card className="hover:border-[#C6D1BD] transition-all duration-300 bg-gradient-to-br from-green-50/30 to-[#E8F5E9]/10">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100/40 text-[#2E7D32] border border-green-200">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Hardware Authenticator</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restricted authorization scopes verifying hardware API signatures to prevent data tampering across distributed telemetry arrays.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── DYNAMIC INTERACTIVE DEMO PREVIEW WIDGET ──────────────────────────────── */}
      <section id="interactive-preview" className="px-6 py-20 bg-slate-900 text-slate-200 relative overflow-hidden">
        {/* Subtle glow nodes */}
        <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-green-950/40 blur-[90px]" />
        
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-5 items-center">
          {/* Left instructions block */}
          <div className="lg:col-span-2 space-y-6">
            <Badge variant="accent" className="bg-[#FFB300] text-slate-950 uppercase font-extrabold tracking-widest text-[9px]">
              Live Simulator
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Test-Drive the KAIROS Engine
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience the engine's core intelligence. Select a demo field layout below to observe how composite scores, charts, and recommendations update in real time.
            </p>
            
            {/* Farm buttons list */}
            <div className="space-y-3">
              {[1, 2, 3].map((fId) => (
                <button
                  key={fId}
                  onClick={() => { setDemoFarm(fId); setDemoScanDone(false) }}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition duration-200 text-xs font-semibold ${
                    demoFarm === fId 
                      ? 'border-[#2E7D32] bg-[#2E7D32]/10 text-white' 
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{demoFarmsData[fId as keyof typeof demoFarmsData].name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    demoFarmsData[fId as keyof typeof demoFarmsData].health >= 80 ? 'bg-green-950 text-green-400 border border-green-800' :
                    demoFarmsData[fId as keyof typeof demoFarmsData].health >= 60 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {demoFarmsData[fId as keyof typeof demoFarmsData].health}% Score
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right simulated dashboard layout */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl space-y-6 max-w-2xl mx-auto w-full">
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">KAIROS Engine Dashboard Preview</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedDemo.name}</h4>
              </div>
              <Badge className="bg-slate-900 text-green-400 border border-green-800/30 text-[9px] py-0.5 font-bold">
                ✓ Connected
              </Badge>
            </div>

            {/* Quick telemetry metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[8px] uppercase font-bold text-slate-500 flex items-center">
                  <Droplets className="h-3 w-3 mr-1 text-blue-500" /> Soil moisture
                </span>
                <p className="text-base font-extrabold text-white mt-1">{selectedDemo.moisture}%</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[8px] uppercase font-bold text-slate-500 flex items-center">
                  <Thermometer className="h-3 w-3 mr-1 text-amber-500" /> Air Temp
                </span>
                <p className="text-base font-extrabold text-white mt-1">{selectedDemo.temp}°C</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[8px] uppercase font-bold text-slate-500 flex items-center">
                  <Layers className="h-3 w-3 mr-1 text-emerald-500" /> NDVI Value
                </span>
                <p className="text-base font-extrabold text-white mt-1">{selectedDemo.ndvi}</p>
              </div>
            </div>

            {/* Recharts Area Chart widget preview */}
            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoChartData} margin={{ left: -30, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hour" stroke="#475569" fontSize={8} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#020617', borderColor: '#1e293b', fontSize: 10 }} />
                  <Area type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={1.5} fill="#3b82f6" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="temp" stroke="#eab308" strokeWidth={1.5} fill="#eab308" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Simulated Recommendation block */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-[#FFB300] tracking-wider flex items-center">
                  <Brain className="h-3.5 w-3.5 mr-1" /> Agronomist advisory directive
                </span>
                {selectedDemo.alert !== 'None' && (
                  <span className="text-[9px] font-bold bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                    {selectedDemo.alert}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {selectedDemo.recommendation}
              </p>
            </div>

            {/* Action Leaf Scanner trigger preview */}
            <div className="flex items-center space-x-3 pt-2">
              <Button 
                onClick={handleRunDemoScan} 
                disabled={demoScanning}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs py-2 px-4 shadow"
              >
                {demoScanning ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Scanning cells...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-3.5 w-3.5" /> Run Mock Leaf Scan
                  </>
                )}
              </Button>
              {demoScanDone && (
                <span className="text-[10px] text-green-400 font-semibold flex items-center">
                  <Check className="h-4 w-4 mr-1 shrink-0" /> Target Leaf: Healthy (98% confidence)
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PUBLIC TECHNOLOGY SCHEMATICS ────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider text-[#2E7D32]">Orbital & Neural Infrastructure</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Integration Schematic</h2>
          <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
            How KAIROS syncs Sentinel constellations, physical ESP32 nodes, and CNN model engines.
          </p>
        </div>

        {/* Dynamic visual grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-5 rounded-xl border border-[#DCE3D6]/70 space-y-3 shadow-sm">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Level 1: Space Segment</span>
            <h4 className="text-sm font-bold text-slate-900">Sentinel-2 Constellation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Orbital spacecraft scanning earth terrain across 13 spectral bands. Returns raw NIR data to map canopy chlorophyll indexes.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE3D6]/70 space-y-3 shadow-sm border-l-2 border-l-[#2E7D32]">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Level 2: Ground Segment</span>
            <h4 className="text-sm font-bold text-slate-900">IoT Edge Sensor Mesh</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              DHT11 relative humidity and capacitance soil moisture nodes operating at 12-bit ADC accuracy transmitting every 30s.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE3D6]/70 space-y-3 shadow-sm">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Level 3: Core Engine</span>
            <h4 className="text-sm font-bold text-slate-900">CNN Model Inference</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              MobileNetV3Small network weights optimized via Adam optimizer performing pixel classification on leaf snapshots.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#DCE3D6]/70 bg-white/50 px-6 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
              <Compass className="h-4 w-4" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900">KAIROS</span>
          </div>

          <div className="flex space-x-6 text-slate-400">
            <span className="hover:text-slate-600 cursor-pointer">SaaS Terms</span>
            <span className="hover:text-slate-600 cursor-pointer">API Schemas</span>
            <span className="hover:text-slate-600 cursor-pointer">Hackathon Docs</span>
          </div>

          <p>© 2026 KAIROS Platform. SIH Precision Agriculture Support Panel.</p>
        </div>
      </footer>
    </div>
  )
}
