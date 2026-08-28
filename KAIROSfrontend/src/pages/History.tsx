import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { historyAPI } from '@/services/api'
import { AnalysisHistoryItem } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
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
  Sprout, 
  CheckCircle2, 
  Layers, 
  Camera, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  Award, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  Info 
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { 
  localizeCrop, 
  localizeThreat, 
  localizeSeverity, 
  localizeRationale, 
  localizeAction 
} from '@/utils/localize'

export default function History() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId) || farms[0]
  const navigate = useNavigate()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('All')
  const [selectedSeverity, setSelectedSeverity] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Selected item for historical detail modal
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null)

  // Fetch real farm-scoped analysis history
  const { 
    data: historyEvents = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['analysisHistory', farmId],
    queryFn: () => historyAPI.getHistory(farmId),
    enabled: !!farmId
  })

  // Filter logic over real database records
  const filteredEvents = historyEvents.filter(e => {
    const matchesSearch = (e.primary_issue || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.diagnostic_summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.farm_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCrop = selectedCrop === 'All' || e.crop?.toLowerCase() === selectedCrop.toLowerCase()
    const matchesSeverity = selectedSeverity === 'All' || e.severity?.toLowerCase() === selectedSeverity.toLowerCase()
    const matchesStatus = selectedStatus === 'All' || e.overall_status?.toLowerCase() === selectedStatus.toLowerCase()
    return matchesSearch && matchesCrop && matchesSeverity && matchesStatus
  })

  // Dynamic Chart data from REAL events
  const severityCounts = {
    Critical: historyEvents.filter(e => e.severity === 'Critical').length,
    High: historyEvents.filter(e => e.severity === 'High').length,
    Moderate: historyEvents.filter(e => e.severity === 'Moderate').length,
    Low: historyEvents.filter(e => e.severity === 'Low' || e.severity === 'None').length
  }

  const chartData = [
    { name: t("High Risk"), count: severityCounts.Critical + severityCounts.High, color: '#dc2626' },
    { name: t("Moderate Risk"), count: severityCounts.Moderate, color: '#f59e0b' },
    { name: t("Optimal"), count: severityCounts.Low, color: '#16a34a' }
  ]

  const getEventIcon = (item: AnalysisHistoryItem) => {
    if (item.disease && item.disease !== 'Unknown' && item.disease !== 'Normal Leaf') {
      return <Camera className="h-4.5 w-4.5 text-amber-500" />
    }
    if (item.severity === 'Critical' || item.severity === 'High') {
      return <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
    }
    if (item.ndvi_mean !== undefined && item.ndvi_mean !== null) {
      return <Layers className="h-4.5 w-4.5 text-primary dark:text-primary-300" />
    }
    return <CheckCircle2 className="h-4.5 w-4.5 text-primary dark:text-primary-300" />
  }

  const getSeverityBadge = (sev: string) => {
    const localized = localizeSeverity(sev)
    switch (sev) {
      case 'Critical':
      case 'High':
        return <Badge variant="destructive" className="text-[9px] py-0 font-bold uppercase tracking-wider">{localized}</Badge>
      case 'Moderate':
        return <Badge variant="warning" className="text-[9px] py-0 font-bold uppercase tracking-wider">{localized}</Badge>
      default:
        return <Badge variant="success" className="text-[9px] py-0 font-bold uppercase tracking-wider">{localized}</Badge>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Attention Required':
        return <Badge className="bg-red-600 text-white text-[8px] py-0 px-1.5 font-bold uppercase"><ShieldAlert className="h-3 w-3 mr-1 shrink-0" /> {t("Needs Attention")}</Badge>
      case 'Analysis Incomplete':
        return <Badge className="bg-amber-600 text-white text-[8px] py-0 px-1.5 font-bold uppercase"><HelpCircle className="h-3 w-3 mr-1 shrink-0" /> {t("Unstable")}</Badge>
      default:
        return <Badge className="bg-[#2E7D32] text-white text-[8px] py-0 px-1.5 font-bold uppercase"><CheckCircle className="h-3 w-3 mr-1 shrink-0" /> {t("Optimal")}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t("Analysis History")}
            </h1>
            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 rounded-lg border-primary text-primary">
              {currentFarm?.name || `Farm #${farmId}`} ({localizeCrop(currentFarm?.crop_type)})
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {t("Chronological logging of synthesized agronomic recommendations.")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="rounded-xl border-slate-200 dark:border-white/10 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} /> {t("Refresh Analysis")}
          </Button>
          <Button 
            onClick={() => navigate('/app/leaf-inference')} 
            className="bg-primary hover:bg-primary-600 text-white shadow-premium rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {t("Run Analysis")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl w-full" />
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-xl w-full" />
            <Skeleton className="h-24 rounded-xl w-full" />
            <Skeleton className="h-24 rounded-xl w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* ─── CHARTS SUMMARIZING REAL EVENT HISTORY ────────────────────────────────────── */}
          {historyEvents.length > 0 && (
            <Card className="rounded-[2rem] shadow-premium border-slate-200/70 dark:border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    {t("Farm Health Score")} ({historyEvents.length} {t("Active")})
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{t("Farm")}: {currentFarm?.name}</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -25, right: 10, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc', opacity: 0.5 }} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Bar dataKey="count" fill="#2E7D32" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {chartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── DYNAMIC FILTERING & SEARCH BAR ─────────────────────────────────────── */}
          <Card className="bg-slate-50 dark:bg-dark-elevated border-slate-200/70 dark:border-white/5 rounded-[2rem] shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={t("Search history...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter Toggle headers */}
                <div className="flex items-center space-x-2 shrink-0 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                  <span>{t("Analytics")}</span>
                </div>
              </div>

              {/* Filtering selectors */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-xs font-semibold">
                {/* Crop select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("Crop")}</span>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  >
                    <option value="All">{t("All Crops")}</option>
                    <option value="Bajra">{localizeCrop('Bajra')}</option>
                    <option value="Banana">{localizeCrop('Banana')}</option>
                    <option value="Cotton">{localizeCrop('Cotton')}</option>
                    <option value="Jowar">{localizeCrop('Jowar')}</option>
                    <option value="Onion">{localizeCrop('Onion')}</option>
                    <option value="Orange">{localizeCrop('Orange')}</option>
                    <option value="Rice">{localizeCrop('Rice')}</option>
                    <option value="Soybean">{localizeCrop('Soybean')}</option>
                    <option value="Sugarcane">{localizeCrop('Sugarcane')}</option>
                    <option value="Wheat">{localizeCrop('Wheat')}</option>
                  </select>
                </div>

                {/* Severity select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("Threat")}</span>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  >
                    <option value="All">{t("All Severities")}</option>
                    <option value="Critical">{t("Critical")}</option>
                    <option value="High">{t("High")}</option>
                    <option value="Moderate">{t("Moderate")}</option>
                    <option value="Low">{t("Low")}</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("Health")}</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  >
                    <option value="All">{t("Optimal Baseline")}</option>
                    <option value="Optimal">{t("Optimal")}</option>
                    <option value="Attention Required">{t("Needs Attention")}</option>
                    <option value="Analysis Incomplete">{t("Unstable")}</option>
                  </select>
                </div>

                {/* Clear filters */}
                <div className="space-y-1 flex flex-col justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setSearchQuery(''); setSelectedCrop('All'); setSelectedSeverity('All'); setSelectedStatus('All') }}
                    className="h-9.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    {t("Cleared")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── TIMELINE SECTION ────────────────────────────────────────────────────── */}
          <div className="relative border-l-2 border-slate-100 dark:border-white/5 pl-6 ml-4 space-y-6 pt-2">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const itemProblem = localizeThreat(event.primary_issue)
                const itemSummary = localizeRationale(event.diagnostic_summary)
                const itemAction = localizeAction(event.action)

                return (
                  <div key={event.id} className="relative group cursor-pointer" onClick={() => setSelectedAnalysis(event)}>
                    
                    {/* Timeline Pin Dot */}
                    <div className="absolute -left-[32.5px] top-1 bg-white dark:bg-dark-surface h-5 w-5 rounded-full border-2 border-slate-100 dark:border-white/5 group-hover:border-primary flex items-center justify-center transition shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-primary" />
                    </div>

                    {/* Timeline Event Card */}
                    <Card className="hover:border-primary/50 dark:border-white/10 transition-all bg-white dark:bg-dark-surface shadow-sm hover:shadow-md">
                      <CardContent className="p-5 space-y-3">
                        
                        {/* Card Header: Type, Crop Badge, Date */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                              {getEventIcon(event)}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {itemProblem || t('Optimal Growth Baseline')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{event.id}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-400 font-mono flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {event.timestamp || event.date}
                            </span>
                            <Badge variant="secondary" className="text-[9px] py-0 font-bold uppercase tracking-wide">
                              <Sprout className="h-3 w-3 mr-1 text-primary dark:text-primary-300" /> {localizeCrop(event.crop)}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition" />
                          </div>
                        </div>

                        {/* Card Body: Title & Description */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
                            {itemSummary}
                          </p>
                          {itemAction && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                              {t("Action")}: {itemAction}
                            </p>
                          )}
                        </div>

                        {/* Card Footer: Severity, Status & Quick Metrics */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] text-slate-400 font-semibold uppercase">{t("Threat")}:</span>
                              {getSeverityBadge(event.severity)}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] text-slate-400 font-semibold uppercase">{t("Health")}:</span>
                              {getStatusBadge(event.overall_status)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                            {event.health_score !== undefined && (
                              <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 font-bold">
                                {t("Health")}: {event.health_score}/100
                              </span>
                            )}
                            {event.ndvi_mean !== undefined && event.ndvi_mean !== null && (
                              <span className="bg-primary-50 dark:bg-primary-950/30 text-primary px-2 py-0.5 rounded border border-primary/20 font-bold">
                                NDVI: {event.ndvi_mean.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                      </CardContent>
                    </Card>

                  </div>
                )
              })
            ) : (
              <div className="text-center py-16 px-4 bg-white dark:bg-dark-surface rounded-[2rem] border border-slate-200/70 dark:border-white/10 shadow-sm space-y-3">
                <Info className="h-8 w-8 mx-auto text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t("No historical analysis records found for this farm.")}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {t("Knowledge-driven Agricultural Intelligence for Sustainability.")}
                </p>
                <div className="pt-2">
                  <Button 
                    onClick={() => navigate('/app/leaf-inference')} 
                    className="bg-primary hover:bg-primary-600 text-white rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    {t("Run Analysis")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── HISTORICAL DETAIL MODAL (STORED RESULT SNAPSHOT) ───────────────────────── */}
      <Modal
        isOpen={!!selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        title={`${t("View Snapshot Details")} #${selectedAnalysis?.id} — ${selectedAnalysis?.farm_name}`}
        className="md:max-w-2xl"
      >
        {selectedAnalysis && (
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            
            {/* Header info badge block */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/70 dark:border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Crop")}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedAnalysis.farm_name} ({localizeCrop(selectedAnalysis.crop)})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Latest Capture")}</span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {selectedAnalysis.timestamp}
                </span>
              </div>
            </div>

            {/* Health & Severity Badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">{t("System Health Index")}</span>
                <span className="text-lg font-black text-primary">{selectedAnalysis.health_score}/100</span>
              </div>
              <div className="p-3 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">{t("Threat")}</span>
                <div className="mt-1">{getSeverityBadge(selectedAnalysis.severity)}</div>
              </div>
              <div className="p-3 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">{t("Health")}</span>
                <div className="mt-1">{getStatusBadge(selectedAnalysis.overall_status)}</div>
              </div>
            </div>

            {/* Threat & Diagnostic Summary */}
            <div className="p-4 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {t("AI Model Diagnosis")}
                </span>
                {selectedAnalysis.ai_confidence ? (
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {t("Confidence")}: {(selectedAnalysis.ai_confidence * 100).toFixed(1)}%
                  </span>
                ) : null}
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {localizeThreat(selectedAnalysis.primary_issue)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {localizeRationale(selectedAnalysis.diagnostic_summary)}
              </p>
            </div>

            {/* Agronomist Advisory Directive */}
            <div className="p-4 bg-primary-50/50 dark:bg-primary-950/20 border border-primary/20 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center">
                <Award className="h-4 w-4 mr-1 text-primary" /> {t("Agronomist Advisory Directive")}
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {localizeAction(selectedAnalysis.action)}
              </p>
            </div>

            {/* Stored Environmental Telemetry */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t("Canopy Weather & Telemetry")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-lg border border-slate-200/60 dark:border-white/5">
                  <span className="text-[9px] text-slate-400 block">{t("Temperature")}</span>
                  <span className="font-bold">{selectedAnalysis.temperature ? `${selectedAnalysis.temperature}°C` : 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-lg border border-slate-200/60 dark:border-white/5">
                  <span className="text-[9px] text-slate-400 block">{t("Humidity")}</span>
                  <span className="font-bold">{selectedAnalysis.humidity ? `${selectedAnalysis.humidity}%` : 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-lg border border-slate-200/60 dark:border-white/5">
                  <span className="text-[9px] text-slate-400 block">Sentinel-2 NDVI</span>
                  <span className="font-bold">{selectedAnalysis.ndvi_mean !== undefined && selectedAnalysis.ndvi_mean !== null ? selectedAnalysis.ndvi_mean.toFixed(3) : 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-lg border border-slate-200/60 dark:border-white/5">
                  <span className="text-[9px] text-slate-400 block">{t("Stress")}</span>
                  <span className="font-bold">{selectedAnalysis.stress_pct !== undefined && selectedAnalysis.stress_pct !== null ? `${selectedAnalysis.stress_pct}%` : 'Normal'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setSelectedAnalysis(null)} className="rounded-xl px-5 py-2 text-xs font-bold">
                {t("Close")}
              </Button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}
