import React, { useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { aiAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import { 
  Upload, Sparkles, AlertCircle, RefreshCw, Cpu, Activity,
  CheckCircle, ShieldAlert, ThermometerSun, Leaf, Satellite, Info
} from 'lucide-react'
import clsx from 'clsx'

export default function LeafInference() {
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1

  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: scanHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['scanHistory', farmId],
    queryFn: () => aiAPI.getHistory(farmId).then(res => res.history || []),
    enabled: !!farmId
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid format. Please upload standard leaf PNG, JPG, or WEBP files.')
      return
    }
    setError('')
    setSelectedFile(file)
    setResult(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const triggerScan = async () => {
    if (!selectedFile) return
    setScanning(true)
    setError('')
    
    const steps = [
      "Initializing EfficientNet-B3...", 
      "Extracting leaf morphological features...", 
      "Cross-referencing Satellite NDVI...", 
      "Synthesizing confidence score..."
    ]
    for (let i = 0; i < steps.length; i++) {
      setScanStep(steps[i])
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('farm_id', farmId.toString())

    try {
      const res = await aiAPI.analyzeLeaf(formData)
      if (res.success) {
        setResult(res)
        refetchHistory()
      } else {
        setError(res.error || 'AI Inference failed.')
      }
    } catch (err: any) {
      setError(err.message || 'AI model inference execution failed.')
    } finally {
      setScanning(false)
      setScanStep('')
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Intelligence Module</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center">
            <Cpu className="h-8 w-8 mr-3 text-primary dark:text-primary-300" /> AI Crop Health Intelligence
          </h1>
        </div>
        {(previewUrl || result) && (
          <Button onClick={resetUpload} variant="outline" size="sm" className="border-[#1e2e22] text-slate-400 hover:text-white bg-slate-950/40">
            <RefreshCw className="mr-2 h-4 w-4" /> Reset Scanner
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Main Viewport */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center glass dark:bg-dark-surface/90 px-4 py-2 rounded-2xl shadow-lg">
              <Activity className="h-4 w-4 mr-2 text-accent" /> VIEWER-A // CANOPY_INFERENCE
            </div>

            <CardContent className="p-6 pt-10">
              {error && (
                <div className="rounded-lg bg-red-950/40 border border-red-900/60 p-3 text-xs font-semibold text-red-400 mb-4 flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {!previewUrl ? (
                  <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 cursor-pointer select-none transition relative",
                    dragActive ? "border-primary bg-primary/5" : "border-slate-300 dark:border-white/20 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                  <div className="rounded-2xl bg-white dark:bg-dark-surface p-5 mb-4 shadow-sm border border-slate-200 dark:border-white/10">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200">Upload Leaf Specimen</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 text-center max-w-[250px]">
                    Drag and drop a clear, focused image of the affected leaf surface.
                  </p>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black">
                  <img src={previewUrl} alt="Leaf Specimen" className="w-full h-[400px] object-cover opacity-80" />
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                        <Cpu className="h-8 w-8 text-primary dark:text-primary-300 m-4 animate-pulse" />
                      </div>
                      <p className="mt-6 text-sm font-semibold text-primary dark:text-primary-300 tracking-wider uppercase animate-pulse">
                        {scanStep}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {previewUrl && !result && !scanning && (
                <Button 
                  onClick={triggerScan} 
                  className="w-full mt-6 bg-primary hover:bg-primary-600 text-white rounded-xl py-6 shadow-premium font-bold text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" /> Run Intelligence Sequence
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AI Confidence Dashboard */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center border-b border-slate-200/50 dark:border-white/5 pb-4">
                <ShieldAlert className="mr-3 h-6 w-6 text-primary dark:text-primary-300" /> AI Confidence Dashboard
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Cpu className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Leaf AI</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-2">{result.confidence}%</span>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Satellite className="h-6 w-6 text-emerald-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Satellite</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-emerald-400 mt-2 text-center leading-tight">
                      {result.cross_validation?.satellite}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <ThermometerSun className="h-6 w-6 text-amber-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Weather</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-amber-400 mt-2 text-center leading-tight">
                      {result.cross_validation?.weather}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] shadow-sm bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <CheckCircle className="h-6 w-6 text-primary mb-2" />
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">Overall Match</span>
                    <span className="text-lg font-black text-primary mt-2">
                      {result.cross_validation?.overall_confidence}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Disease Knowledge Base & Recommendations */}
              <Card className="rounded-[2rem] shadow-premium border-slate-200/70 dark:border-white/10">
                <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
                        {result.disease}
                      </CardTitle>
                      <CardDescription className="text-sm font-semibold text-slate-500 mt-1">
                        {result.scientific_name}
                      </CardDescription>
                    </div>
                    <Badge variant={result.healthy ? 'outline' : 'destructive'} className="font-bold text-xs px-3 py-1">
                      {result.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Immediate Action</h4>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-inner">
                      {result.recommendations?.immediate_action || "No immediate action required."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Treatment</h4>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 min-h-[100px] shadow-inner">
                        {result.recommendations?.treatment || "N/A"}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Prevention</h4>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 min-h-[100px] shadow-inner">
                        {result.recommendations?.prevention || "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Side: Timeline History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] h-full min-h-[600px]">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <Leaf className="w-5 h-5 mr-2 text-primary dark:text-primary-300" /> Farm Scan History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {scanHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-semibold">
                  <Info className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No scan history available for this farm yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[600px] overflow-y-auto">
                  {scanHistory.map((scan: any, i: number) => (
                    <div key={scan.id || i} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(scan.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge variant="outline" className={clsx(
                          "text-[10px] font-bold px-2 py-0.5",
                          scan.severity === 'None' ? 'border-primary text-primary' : 'border-status-critical text-status-critical'
                        )}>
                          {scan.disease}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {scan.description}
                      </p>
                      <div className="mt-4 flex gap-3">
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-bold text-slate-500 flex items-center shadow-inner">
                          AI: <span className="text-slate-900 dark:text-white ml-1.5">{scan.confidence}%</span>
                        </div>
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-bold text-slate-500 flex items-center shadow-inner">
                          NDVI: <span className="text-slate-900 dark:text-white ml-1.5">{scan.ndvi || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
