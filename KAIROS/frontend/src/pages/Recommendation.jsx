import { useState, useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'
import { recommendationAPI } from '@/services/api'
import HealthScoreRing from '@/components/ui/HealthScoreRing'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Lightbulb, Droplets, Flame, Bug, CheckCircle2,
  AlertTriangle, Satellite, Thermometer, Cloud, RefreshCw, Activity, ArrowRight, ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

// MOCK_REC removed

const sourceIcons = {
  'Satellite NDVI': Satellite,
  'Soil Moisture': Droplets,
  'Temperature': Thermometer,
  'Humidity': Cloud,
  'Weather Forecast': Cloud,
  'AI Leaf Scan': Bug,
}

const severityConfig = {
  'Critical': { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/15 border border-[var(--color-danger)]', gradient: '' },
  'High':     { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]', gradient: '' },
  'Moderate': { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]', gradient: '' },
  'Low':      { color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/15 border border-[var(--color-success)]', gradient: '' },
  'None':     { color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/15 border border-[var(--color-success)]', gradient: '' },
}

export default function Recommendation() {
  const { analysisData, analysisLoading: loading, fetchAnalysis, selectedFarm } = useFarmStore()
  const data = analysisData?.recommendation

  const handleRefresh = async () => {
    if (selectedFarm?.id) {
      await fetchAnalysis(selectedFarm.id)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-2 h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  const sevCfg = severityConfig[data?.severity || 'None']

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Agronomic Decision Engine</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            AI-driven recommendations cross-verified from {data?.supporting_evidence?.length ?? 0} data sources
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRefresh}>Refresh Analysis</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Scores & Evidence */}
        <div className="space-y-5">
          {/* Health & Confidence */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Farm Health Score</h3>
            <HealthScoreRing score={data?.health_score ?? 0} size={160} />
            
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Overall Confidence</h3>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">{data?.confidence}%</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Based on multi-source agreement</p>
            </div>
          </div>

          {/* Evidence Sources */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Supporting Evidence</h3>
            <div className="flex flex-wrap gap-2">
              {data?.supporting_evidence?.map((src, i) => {
                const SrcIcon = sourceIcons[src] || Activity
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{src}</span>
                  </motion.div>
                )
              })}
              {(!data?.supporting_evidence || data.supporting_evidence.length === 0) && (
                <span className="text-sm text-[var(--color-text-muted)]">No evidence available</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostics & Recommendations */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Main Diagnostic Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${sevCfg?.gradient} border rounded-2xl p-6`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-bold font-poppins text-[var(--color-text-primary)]">
                    Crop Status: {data?.severity || 'Normal'}
                  </h2>
                  <Badge label={`${data?.primary_issue || 'Status Normal'}`} variant={
                    data?.severity === 'Low' || data?.severity === 'None' ? 'success' :
                    data?.severity === 'Moderate' ? 'warning' : 'danger'
                  } />
                </div>
                {data?.secondary_issue && (
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-accent)]" />
                    Secondary: {data.secondary_issue}
                  </p>
                )}
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)]/50 dark:bg-black/20 p-4 rounded-xl mt-4">
                  {data?.diagnostic_summary}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Assessment Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="w-4 h-4 text-[var(--color-secondary)]" />
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Disease Assessment</h4>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{data?.assessments?.disease || 'No data'}</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Satellite className="w-4 h-4 text-[var(--color-secondary)]" />
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Vegetation Assessment</h4>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{data?.assessments?.vegetation || 'No data'}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-[var(--color-accent)]" />
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Environmental Assessment</h4>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{data?.assessments?.environmental || 'No data'}</p>
            </motion.div>
          </div>

          {/* Recommended Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[var(--color-primary)]/15 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4.5 h-4.5 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recommended Actions</h3>
            </div>
            
            <ul className="space-y-3 pl-2">
              {data?.recommended_actions?.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)]">{action}</span>
                </li>
              ))}
              {(!data?.recommended_actions || data.recommended_actions.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)]">No specific actions required at this time.</p>
              )}
            </ul>
          </motion.div>

          {/* Follow-up Monitoring */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[var(--color-secondary)]/15/50 dark:bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)] dark:border-[var(--color-secondary)] rounded-2xl p-6 flex items-start gap-3"
          >
            <Activity className="w-5 h-5 text-[var(--color-secondary)] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-secondary)] dark:text-[var(--color-secondary)]">Follow-up Monitoring</h3>
              <p className="text-sm text-[var(--color-secondary)]/80 dark:text-[var(--color-secondary)]/80 mt-1">{data?.follow_up}</p>
            </div>
          </motion.div>

          {/* Disease Knowledge Base Info */}
          {data?.Scientific_Name && data?.Scientific_Name !== 'N/A' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Knowledge Base Insights</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Scientific Name</p>
                    <p className="text-sm text-[var(--color-text-primary)] font-medium">{data.Scientific_Name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Cause</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{data.Cause}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Symptoms</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{data.Symptoms}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Treatment</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{data.Treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Prevention</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{data.Prevention}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">AI Confidence Context</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{data.Confidence_Explanation}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
