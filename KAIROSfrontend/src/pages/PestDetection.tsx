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
  Bug, Leaf, Info, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { 
  localizeCrop, 
  localizeThreat, 
  localizeSeverity, 
  localizeRationale, 
  localizeAction 
} from '@/utils/localize'
import clsx from 'clsx'

const SUPPORTED_CROPS = [
  'Rice', 'Banana', 'Cotton', 'Wheat', 'Sugarcane', 
  'Soybean', 'Onion', 'Orange', 'Bajra', 'Jowar'
]

export default function PestDetection() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId)

  const [selectedCrop, setSelectedCrop] = useState<string>(currentFarm?.crop_type || 'Rice')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const { data: scanHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['pestScanHistory', farmId],
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
      setError('Invalid format. Please upload standard pest photograph (PNG, JPG, or WEBP).')
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
      "Initializing YOLO11s Pest Detector...", 
      "Extracting insect morphological features...", 
      "Mapping bounding boxes & confidence...", 
      "Cross-referencing CIBRC statutory guidelines..."
    ]
    for (let i = 0; i < steps.length; i++) {
      setScanStep(steps[i])
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('crop', selectedCrop)
    formData.append('farm_id', farmId.toString())

    try {
      const res = await aiAPI.detectPest(formData)
      if (res.success) {
        setResult(res)
        refetchHistory()
      } else {
        setError(res.error || 'Pest detection failed.')
      }
    } catch (err: any) {
      setError(err.message || 'YOLO11s pest model inference execution failed.')
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

  const isLowConfidence = result && result.confidence > 0 && result.confidence < 45.0

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Precision Ag Intelligence")}</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center">
            <Bug className="h-8 w-8 mr-3 text-emerald-600 dark:text-emerald-400" /> {t("Pest Detection")}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            YOLO11s Real-time Insect Vision // 14 Canonical Agricultural Pests
          </p>
        </div>
        
        {/* Crop Selector & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white dark:bg-dark-surface px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-xs font-bold text-slate-400">{t("Crop")}:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c} value={c} className="dark:bg-dark-surface">
                  {localizeCrop(c)}
                </option>
              ))}
            </select>
          </div>

          {(previewUrl || result) && (
            <Button onClick={resetUpload} variant="outline" size="sm" className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-white">
              <RefreshCw className="mr-2 h-4 w-4" /> {t("Cleared")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Main Viewport */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center glass dark:bg-dark-surface/90 px-4 py-2 rounded-2xl shadow-lg">
              <Activity className="h-4 w-4 mr-2 text-emerald-500" /> YOLO11s // PEST_INFERENCE
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
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200">{t("Upload Pest Image")}</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 text-center max-w-[280px]">
                    Drag & drop high-resolution photograph of the insect, leaf pest, or larvae.
                  </p>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black">
                  <img 
                    ref={imgRef}
                    src={previewUrl} 
                    alt="Pest Specimen" 
                    className="w-full h-[400px] object-contain opacity-90" 
                  />
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                        <Bug className="h-8 w-8 text-emerald-400 m-4 animate-pulse" />
                      </div>
                      <p className="mt-6 text-sm font-semibold text-emerald-300 tracking-wider uppercase animate-pulse">
                        {scanStep}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {previewUrl && !result && !scanning && (
                <Button 
                  onClick={triggerScan} 
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 shadow-premium font-bold text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" /> {t("Run Pest Detection")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pest Results Panel */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Uncertainty Warning for Low Confidence */}
              {isLowConfidence && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold">
                    <p className="font-bold">Low Model Confidence ({result.confidence}%)</p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      The confidence is under 45%. Consider capturing a closer, higher-contrast photograph of the pest for definitive diagnosis.
                    </p>
                  </div>
                </div>
              )}

              {/* Top Detection Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Bug className="h-6 w-6 text-emerald-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t("Pest Detected")}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">
                      {localizeThreat(result.pest)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Cpu className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t("Confidence")}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">{result.confidence}%</span>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Leaf className="h-6 w-6 text-amber-500 mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t("Crop")}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {localizeCrop(result.crop)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] shadow-sm bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" />
                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">{t("Objects")}</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1">
                      {result.detections_count || 0}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Detected Bounding Boxes Breakdown */}
              {result.detections && result.detections.length > 0 && (
                <Card className="rounded-[2rem] shadow-sm border-slate-200/70 dark:border-white/10 p-6">
                  <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    YOLO11s Spatial Detections ({result.detections.length})
                  </CardTitle>
                  <div className="space-y-2">
                    {result.detections.map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-semibold">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-900 dark:text-white">{localizeThreat(d.pest_name)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({d.raw_class})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500">Box: [{d.bbox_xyxy.map((v: number) => Math.round(v)).join(', ')}]</span>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5 font-bold">
                            {d.confidence}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendation Engine Directive */}
              {result.recommendations && (
                <Card className="rounded-[2rem] shadow-premium border-slate-200/70 dark:border-white/10">
                  <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
                          {localizeThreat(result.pest)}
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold text-slate-500 mt-1">
                          {localizeRationale(result.recommendations.headline) || t("Verified Recommendation Available")}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="font-bold text-xs px-3 py-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                        {localizeSeverity(result.recommendations.risk_level)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                        {t("Action")}
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-inner leading-relaxed">
                        {localizeAction(result.recommendations.primary_action) || t("No immediate chemical treatment required.")}
                      </p>
                    </div>
                    
                    {result.recommendations.safety_info && result.recommendations.safety_info.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                          {t("Safety Precautions")}
                        </h4>
                        <div className="space-y-2">
                          {result.recommendations.safety_info.map((s: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <span className="font-bold">{s.chemical_name || s.active_ingredient}: </span>
                              <span>{s.dosage_per_ha ? `Dosage: ${s.dosage_per_ha}. ` : ''}</span>
                              <span>{s.phi_days ? `PHI: ${s.phi_days} days. ` : ''}</span>
                              <span>{s.safety_notes || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </motion.div>
          )}
        </div>

        {/* Right Side: Timeline History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] h-full min-h-[600px]">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <Bug className="w-5 h-5 mr-2 text-emerald-500" /> {t("Analysis History")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {scanHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-semibold">
                  <Info className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  {t("No historical analysis records found for this farm.")}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[600px] overflow-y-auto">
                  {scanHistory.map((scan: any, i: number) => (
                    <div key={scan.id || i} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(scan.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge variant="outline" className={clsx(
                          "text-[10px] font-bold px-2 py-0.5",
                          scan.severity === 'None' ? 'border-primary text-primary' : 'border-status-critical text-status-critical'
                        )}>
                          {localizeThreat(scan.disease)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {localizeRationale(scan.description)}
                      </p>
                      <div className="mt-4 flex gap-3">
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-bold text-slate-500 flex items-center shadow-inner">
                          {t("Confidence")}: <span className="text-slate-900 dark:text-white ml-1.5">{scan.confidence}%</span>
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
