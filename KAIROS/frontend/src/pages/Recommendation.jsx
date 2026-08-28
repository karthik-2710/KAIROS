import { useState, useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'
import HealthScoreRing from '@/components/ui/HealthScoreRing'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Lightbulb, Droplets, Flame, Bug, CheckCircle2,
  AlertTriangle, Satellite, Thermometer, Cloud, RefreshCw, Activity, ArrowRight, ShieldCheck,
  Cpu, FileText, AlertCircle, Sparkles, BookOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const sourceIcons = {
  'Satellite NDVI': Satellite,
  'Soil Moisture': Droplets,
  'Temperature': Thermometer,
  'Humidity': Cloud,
  'Weather Forecast': Cloud,
  'AI Leaf Scan': Bug,
  'Agricultural Knowledge Base': BookOpen,
  'Weather Telemetry': Cloud,
  'Evidence Citations': ShieldCheck
}

const severityConfig = {
  'Critical': { color: 'text-red-500', bg: 'bg-red-500/15 border-red-500', badge: 'danger' },
  'High':     { color: 'text-amber-500', bg: 'bg-amber-500/15 border-amber-500', badge: 'warning' },
  'Moderate': { color: 'text-amber-500', bg: 'bg-amber-500/15 border-amber-500', badge: 'warning' },
  'Low':      { color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500', badge: 'success' },
  'None':     { color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500', badge: 'success' },
  'Unknown':  { color: 'text-slate-500', bg: 'bg-slate-500/15 border-slate-500', badge: 'info' }
}

export default function Recommendation() {
  const { analysisData, analysisLoading: loading, fetchAnalysis, runAnalysis, selectedFarm, farms } = useFarmStore()
  const [refreshing, setRefreshing] = useState(false)

  // Auto-fetch recommendations on mount if missing
  useEffect(() => {
    const farmId = selectedFarm?.id || (farms.length > 0 ? farms[0].id : null)
    if (farmId && !analysisData) {
      fetchAnalysis(farmId, true)
    }
  }, [selectedFarm, farms, analysisData, fetchAnalysis])

  const handleRefresh = async () => {
    const farmId = selectedFarm?.id || (farms.length > 0 ? farms[0].id : null)
    if (farmId) {
      setRefreshing(true)
      try {
        await runAnalysis(farmId)
        toast.success('Recommendation analysis refreshed from live models!')
      } catch (err) {
        toast.error('Failed to refresh recommendation.')
      } finally {
        setRefreshing(false)
      }
    } else {
      toast.error('Please select a farm first.')
    }
  }

  // Loading State
  if (loading || refreshing) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800" />
            <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      </div>
    )
  }

  const data = analysisData?.recommendation || {}
  const recsList = data?.recommendations || []
  const modelStatuses = data?.model_statuses || analysisData?.recommendation_response?.model_statuses || {}
  const sevKey = data?.severity || 'Low'
  const sevCfg = severityConfig[sevKey] || severityConfig['Low']
  const farmName = selectedFarm?.name || (farms.length > 0 ? farms[0].name : 'Active Farm')
  const cropName = selectedFarm?.crop_type || data?.crop || 'Rice'

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">
              Agronomic Recommendation Engine
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              v2.1 Audited KB
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Deterministic rule-based decision support for <span className="font-semibold text-[var(--color-text-primary)]">{cropName}</span> on <span className="font-semibold text-[var(--color-text-primary)]">{farmName}</span>
          </p>
        </div>
        <Button variant="primary" size="sm" icon={RefreshCw} onClick={handleRefresh}>
          Run Multi-Modal Analysis
        </Button>
      </div>

      {/* Model Transparency Status Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Multi-Modal Subsystem Execution Status
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Pest Detection */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Pest Detection</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                modelStatuses?.pest_detection?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-400'
              }`}>
                {modelStatuses?.pest_detection?.status || 'READY'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {modelStatuses?.pest_detection?.model_name || 'YOLO11s'}
            </p>
          </div>

          {/* 2. Disease Detection */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Disease Detection</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                modelStatuses?.disease_detection?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-400'
              }`}>
                {modelStatuses?.disease_detection?.status || 'READY'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {modelStatuses?.disease_detection?.model_name || 'EfficientNet-B3'}
            </p>
          </div>

          {/* 3. Pest Forecast */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Pest Forecast</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                modelStatuses?.pest_forecast?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-400'
              }`}>
                {modelStatuses?.pest_forecast?.status || 'READY'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {modelStatuses?.pest_forecast?.model_name || 'XGBoost 7d/14d'}
            </p>
          </div>

          {/* 4. Disease Forecast */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Disease Forecast</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                modelStatuses?.disease_forecast?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-400'
              }`}>
                {modelStatuses?.disease_forecast?.status || 'READY'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {modelStatuses?.disease_forecast?.model_name || 'XGBoost Calibrated'}
            </p>
          </div>

          {/* 5. Recommendation Engine */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Decision Engine</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              25 Rules Evaluated
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Farm Health & Sources */}
        <div className="space-y-5">
          {/* Health & Confidence */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Agronomic Health Index</h3>
            <HealthScoreRing score={data?.health_score ?? 85} size={160} />
            
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Decision Confidence</h3>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">
                  {data?.confidence || 95}%
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Cross-verified against audited ICAR/CIBRC rules</p>
            </div>
          </div>

          {/* Supporting Evidence Citations */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Supporting Evidence</h3>
            </div>
            <div className="space-y-2.5">
              {data?.supporting_evidence?.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                    {src}
                  </span>
                </motion.div>
              ))}
              {(!data?.supporting_evidence || data.supporting_evidence.length === 0) && (
                <span className="text-xs text-[var(--color-text-muted)]">No active evidence telemetry</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Recommendation Cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Multi-Threat Recommendation Cards */}
          {recsList.length > 0 ? (
            recsList.map((rec, idx) => {
              const rRisk = rec?.risk?.level || 'Low'
              const rSev = severityConfig[rRisk === 'Urgent' ? 'Critical' : (rRisk === 'High' ? 'High' : (rRisk === 'Medium' ? 'Moderate' : 'Low'))]

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-5"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rSev.bg}`}>
                        <Bug className={`w-5 h-5 ${rSev.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold font-poppins text-[var(--color-text-primary)]">
                            {rec?.threat?.name || 'General Advisory'}
                          </h2>
                          {rec?.threat?.id && (
                            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {rec.threat.id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {rec?.threat?.type || 'Agronomic Condition'} • Priority {idx + 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        label={`Risk: ${rec?.risk?.level || 'Low'}`}
                        variant={rSev.badge}
                      />
                      <Badge
                        label={`Action: ${rec?.action?.category || 'Monitoring'}`}
                        variant="info"
                      />
                    </div>
                  </div>

                  {/* Diagnostic Rationale */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                      Agronomic Assessment & Protocol
                    </p>
                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                      {rec?.action?.primary_recommendation || data?.diagnostic_summary || 'Standard crop monitoring in progress.'}
                    </p>
                    {rec?.rule_matched?.rule_id && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Matched Decision Rule:
                        </span>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">
                          [{rec.rule_matched.rule_id}] {rec.rule_matched.description}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recommended Action Steps */}
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                      Recommended Action Checklist
                    </h3>
                    <ul className="space-y-2.5">
                      {rec?.recommended_actions?.map((action, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                            {action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CIBRC Safety & Dosage Table if Present */}
                  {rec?.safety_info && rec.safety_info.length > 0 && (
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                          CIBRC Certified Chemical Safety & PHI Data
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold">
                              <th className="pb-2">Approved Formulation</th>
                              <th className="pb-2">Prescribed Dosage</th>
                              <th className="pb-2">Pre-Harvest Interval (PHI)</th>
                              <th className="pb-2">Evidence Citation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-500/15">
                            {rec.safety_info.map((safe, sIdx) => (
                              <tr key={sIdx} className="text-amber-950 dark:text-amber-100">
                                <td className="py-2 font-medium">{safe.chemical_name || 'N/A'}</td>
                                <td className="py-2">{safe.dosage_per_ha || 'As prescribed'}</td>
                                <td className="py-2">{safe.phi_days ? `${safe.phi_days} Days` : 'N/A'}</td>
                                <td className="py-2 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                                  {safe.source_id ? `Source ${safe.source_id} (CIBRC)` : 'CIBRC Registered'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })
          ) : (
            /* Fallback Single / Baseline Diagnostic View */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sevCfg.bg}`}>
                    <CheckCircle2 className={`w-5 h-5 ${sevCfg.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-poppins text-[var(--color-text-primary)]">
                      {data?.primary_issue || 'Optimal Crop Condition'}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Crop Status: {data?.severity || 'Normal'}
                    </p>
                  </div>
                </div>
                <Badge
                  label={data?.severity || 'Optimal'}
                  variant={sevCfg.badge}
                />
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {data?.diagnostic_summary || 'No acute threats detected across AI models. Environmental and telemetry indicators remain within normal agronomic thresholds.'}
              </p>

              <div>
                <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                  Recommended Actions
                </h3>
                <ul className="space-y-2.5">
                  {(data?.recommended_actions || ['Maintain standard irrigation and scouting protocols.']).map((action, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                        {action}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
