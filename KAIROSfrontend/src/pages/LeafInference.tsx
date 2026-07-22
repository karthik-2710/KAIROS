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
    <div className="space-y-6 text-slate-300">
      
      {/* Header */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0 border-b border-[#1e2e22]/50 pb-4">
        <div>
          <span className="text-[9px] font-bold text-[#2E7D32] uppercase tracking-wider">AI Intelligence Module</span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center">
            <Cpu className="h-5 w-5 mr-2 text-[#2E7D32]" /> AI Crop Health Intelligence
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
          <Card className="border-[#1e2e22] bg-[#0A0F0D] overflow-hidden relative shadow-2xl">
            <div className="absolute top-3 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
              <Activity className="h-3 w-3 mr-1 text-[#2E7D32]" /> VIEWER-A // CANOPY_INFERENCE
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
                    "flex flex-col items-center justify-center border border-dashed rounded-xl p-16 cursor-pointer select-none transition relative",
                    dragActive ? "border-[#2E7D32] bg-[#1e2e22]/30" : "border-[#1e2e22] hover:border-[#2E7D32]/50 hover:bg-slate-900/30"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                  <div className="rounded-full bg-slate-900 p-4 mb-4 ring-1 ring-slate-800">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-200">Upload Leaf Specimen</h3>
                  <p className="text-xs text-slate-500 mt-2 text-center max-w-[250px]">
                    Drag and drop a clear, focused image of the affected leaf surface.
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#1e2e22] bg-black">
                  <img src={previewUrl} alt="Leaf Specimen" className="w-full h-[400px] object-cover opacity-80 mix-blend-screen" />
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-[#0A0F0D]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-[#2E7D32] animate-spin"></div>
                        <Cpu className="h-8 w-8 text-[#2E7D32] m-4 animate-pulse" />
                      </div>
                      <p className="mt-6 text-sm font-semibold text-[#2E7D32] tracking-wider uppercase animate-pulse">
                        {scanStep}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {previewUrl && !result && !scanning && (
                <Button 
                  onClick={triggerScan} 
                  className="w-full mt-6 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white hover:from-[#1B5E20] hover:to-[#144d18] shadow-lg shadow-green-900/20"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Run Intelligence Sequence
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AI Confidence Dashboard */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center border-b border-[#1e2e22] pb-2">
                <ShieldAlert className="mr-2 h-4 w-4 text-[#2E7D32]" /> AI Confidence Dashboard
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 border-[#1e2e22]">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Cpu className="h-6 w-6 text-blue-400 mb-2" />
                    <span className="text-xs text-slate-400 font-semibold">Leaf AI</span>
                    <span className="text-lg font-bold text-white mt-1">{result.confidence}%</span>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-[#1e2e22]">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Satellite className="h-6 w-6 text-emerald-400 mb-2" />
                    <span className="text-xs text-slate-400 font-semibold">Satellite</span>
                    <span className="text-xs font-bold text-emerald-300 mt-2 text-center leading-tight">
                      {result.cross_validation?.satellite}
                    </span>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-[#1e2e22]">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <ThermometerSun className="h-6 w-6 text-amber-400 mb-2" />
                    <span className="text-xs text-slate-400 font-semibold">Weather</span>
                    <span className="text-xs font-bold text-amber-300 mt-2 text-center leading-tight">
                      {result.cross_validation?.weather}
                    </span>
                  </CardContent>
                </Card>
                <Card className="bg-[#2E7D32]/10 border-[#2E7D32]/30">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-6 w-6 text-[#2E7D32] mb-2" />
                    <span className="text-xs text-[#2E7D32] font-semibold">Overall Match</span>
                    <span className="text-sm font-bold text-white mt-1">
                      {result.cross_validation?.overall_confidence}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Disease Knowledge Base & Recommendations */}
              <Card className="border-[#1e2e22] bg-[#0A0F0D]">
                <CardHeader className="border-b border-[#1e2e22] pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center">
                        {result.disease}
                      </CardTitle>
                      <CardDescription className="text-slate-400 italic">
                        {result.scientific_name}
                      </CardDescription>
                    </div>
                    <Badge variant={result.healthy ? 'outline' : 'destructive'} className="font-mono text-xs">
                      {result.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Immediate Action</h4>
                    <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-[#1e2e22]">
                      {result.recommendations?.immediate_action || "No immediate action required."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Treatment</h4>
                      <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-[#1e2e22] min-h-[80px]">
                        {result.recommendations?.treatment || "N/A"}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prevention</h4>
                      <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-[#1e2e22] min-h-[80px]">
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
          <Card className="border-[#1e2e22] bg-[#0A0F0D] h-full min-h-[600px]">
            <CardHeader className="border-b border-[#1e2e22]">
              <CardTitle className="text-sm font-semibold flex items-center text-slate-200">
                <Leaf className="w-4 h-4 mr-2 text-[#2E7D32]" /> Farm Scan History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {scanHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <Info className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No scan history available for this farm yet.
                </div>
              ) : (
                <div className="divide-y divide-[#1e2e22]/50 max-h-[600px] overflow-y-auto">
                  {scanHistory.map((scan: any, i: number) => (
                    <div key={scan.id || i} className="p-4 hover:bg-slate-900/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(scan.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge variant="outline" className={clsx(
                          "text-[9px] px-1.5 py-0",
                          scan.severity === 'None' ? 'border-green-900 text-green-400' : 'border-red-900 text-red-400'
                        )}>
                          {scan.disease}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {scan.description}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <div className="px-2 py-1 bg-slate-900 rounded text-[10px] text-slate-400 flex items-center">
                          AI: <span className="text-white ml-1">{scan.confidence}%</span>
                        </div>
                        <div className="px-2 py-1 bg-slate-900 rounded text-[10px] text-slate-400 flex items-center">
                          NDVI: <span className="text-white ml-1">{scan.ndvi || 'N/A'}</span>
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
