import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFarmStore } from '@/store/farmStore'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Upload, Leaf, AlertTriangle, CheckCircle2, XCircle, Loader2, ImagePlus, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import SensorCard from '@/components/cards/SensorCard'
import WeatherCard from '@/components/cards/WeatherCard'
import SatelliteCard from '@/components/cards/SatelliteCard'
import RecommendationCard from '@/components/cards/RecommendationCard'

const SEVERITY_VARIANT = { Low: 'success', Moderate: 'warning', High: 'danger', Critical: 'danger', None: 'success' }

export default function LeafUpload() {
  const { selectedFarm, analysisData: data, analysisLoading: loading, runAnalysis } = useFarmStore()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted.length === 0) return
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => toast.error('File must be an image (JPG/PNG) under 10MB'),
  })

  const handlePredict = async () => {
    if (!file) { toast.error('Please upload a leaf image first'); return }
    if (!selectedFarm?.id) { toast.error('Please select a farm first'); return }
    setError(null)

    try {
      await runAnalysis(selectedFarm.id, false, file)
      toast.success('Unified Pipeline Analysis complete!')
    } catch (err) {
      setError(err.response?.data?.error || 'AI model prediction failed. Please try again.')
      toast.error('Prediction failed')
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setError(null)
  }

  const leafResult = data?.leaf_ai
  const diseaseColor = (disease) => {
    if (!disease || disease === 'Healthy') return 'text-[var(--color-primary)]'
    return 'text-[var(--color-danger)]'
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Leaf Disease Detection</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Upload a clear leaf image to trigger a full farm cross-validation pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
              Target Farm: {selectedFarm?.name || 'None Selected'}
            </h3>
            
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
                ${isDragActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 dark:bg-emerald-950/20'
                  : preview
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15/50'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/15/30'
                }`}
            >
              <input {...getInputProps()} />

              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Leaf preview"
                    className="max-h-48 mx-auto rounded-xl object-contain"
                  />
                  <p className="text-sm text-[var(--color-text-secondary)] truncate">{file?.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reset() }}
                    className="text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-[var(--color-primary)]/15 rounded-2xl flex items-center justify-center mx-auto">
                    <ImagePlus className="w-8 h-8 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {isDragActive ? 'Drop your leaf image here' : 'Drag & drop leaf image'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              fullWidth
              loading={loading}
              onClick={handlePredict}
              disabled={!file || !selectedFarm}
              icon={Leaf}
              size="lg"
            >
              {loading ? 'Running Unified Analysis...' : 'Analyze Pipeline'}
            </Button>
          </div>
        </div>

        {/* Middle & Right Column: Synchronized Dashboard Output */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center justify-center h-[400px]"
              >
                <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin mb-4" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Cross-Validating Data...</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Combining AI Leaf Scan with Satellite, Weather & IoT</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface)] border border-[var(--color-danger)] rounded-2xl p-8 flex flex-col items-center justify-center h-[400px]"
              >
                <XCircle className="w-12 h-12 text-[var(--color-danger)] mb-4" />
                <p className="text-sm font-medium text-[var(--color-danger)] text-center">{error}</p>
              </motion.div>
            ) : data && leafResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* AI Result Header */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                  <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-4">
                    AI Scan Diagnosis
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                        ${leafResult.disease === 'Healthy' ? 'bg-[var(--color-primary)]/15' : 'bg-[var(--color-danger)]/15'}`}
                      >
                        {leafResult.disease === 'Healthy'
                          ? <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" />
                          : <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
                        }
                      </div>
                      <div>
                        <p className={`text-xl font-bold font-poppins ${diseaseColor(leafResult.disease)}`}>{leafResult.disease}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Confidence: {leafResult.confidence?.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Badge label={leafResult.severity || 'None'} variant={SEVERITY_VARIANT[leafResult.severity || 'None'] || 'default'} />
                  </div>
                </div>

                {/* Final Recommendation */}
                <RecommendationCard data={data?.recommendation} />

                {/* Supporting Context Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Live IoT Context</h3>
                    <SensorCard data={data?.iot} />
                  </div>
                  <div className="col-span-1">
                    <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Weather Context</h3>
                    <WeatherCard data={data?.weather} />
                  </div>
                  <div className="col-span-1">
                    <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Satellite Context</h3>
                    <SatelliteCard data={data?.satellite} />
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center justify-center h-[400px] text-center"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Leaf className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">Unified Results Will Appear Here</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload an image and run the pipeline to see full diagnostic context.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
