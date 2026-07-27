import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { recommendationAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Brain, 
  AlertCircle, 
  ArrowUpRight, 
  Calendar,
  Layers,
  Thermometer,
  CloudSun,
  Camera,
  Activity,
  Award
} from 'lucide-react'

export default function Recommendations() {
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1

  // Fetch current recommendations
  const { 
    data: recommendation, 
    isLoading: currentLoading,
    refetch 
  } = useQuery({
    queryKey: ['recommendation', farmId],
    queryFn: () => recommendationAPI.get(farmId),
    enabled: !!farmId
  })

  // Fetch recommendation logs history
  const { 
    data: recHistory = [], 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ['recommendationHistory', farmId],
    queryFn: () => recommendationAPI.getHistory(farmId),
    enabled: !!farmId
  })

  if (currentLoading || historyLoading || !recommendation) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    )
  }

  // Map icon strings to Lucide components
  const renderSourceIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'droplets':
      case 'soil':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'satellite':
        return <Layers className="h-4 w-4 text-primary dark:text-primary-300" />
      case 'thermometer':
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-amber-500" />
      case 'cloud':
      case 'weather':
        return <CloudSun className="h-4 w-4 text-slate-400" />
      case 'leaf':
      case 'sparkles':
      case 'camera':
        return <Camera className="h-4 w-4 text-primary dark:text-primary-300" />
      default:
        return <Brain className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 pb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Agronomic Recommendations</h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Advisory panel synthesized from multiple telemetry feeds to guarantee zero-noise recommendations.
          </p>
        </div>
        <Button onClick={() => refetch()} className="bg-primary hover:bg-primary-600 text-white shadow-premium rounded-xl px-6 py-5">
          Run Analysis
        </Button>
      </div>

      {/* Featured Current Recommendation Card */}
      <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] relative overflow-hidden bg-white dark:bg-dark-surface/50 backdrop-blur-sm">
        {/* Border accent line */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${
          recommendation.severity === 'High' ? 'bg-status-critical' : 
          recommendation.severity === 'Moderate' ? 'bg-status-warning' : 'bg-primary'
        }`} />

        <CardHeader className="p-8 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-primary dark:text-primary-300 uppercase tracking-widest">
                Active Crop Advisory
              </span>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {recommendation.problem}
              </CardTitle>
            </div>
            <Badge variant={recommendation.severity === 'High' ? 'destructive' : recommendation.severity === 'Moderate' ? 'warning' : 'success'} className="px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm">
              {recommendation.severity === 'None' ? 'Optimal' : `${recommendation.severity} Severity`}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8 space-y-8">
          {/* Reason Section */}
          <div className="bg-slate-50 dark:bg-dark-elevated p-6 rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-inner">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2">Diagnostic Rationale</h4>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{recommendation.reason}</p>
          </div>

          {/* Action step items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary dark:text-primary-300 uppercase tracking-widest flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary dark:text-primary-300" /> Agronomist Advisory Directive
            </h4>
            <div className="border border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-surface p-6 rounded-2xl leading-relaxed text-slate-700 dark:text-slate-300 text-sm font-semibold shadow-sm">
              {recommendation.action}
            </div>
          </div>

          {/* Cross verified inputs indicators */}
          {recommendation.sources && recommendation.sources.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200/50 dark:border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Cross-Verified Evidence Sources</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-1.5">
                {recommendation.sources.map((src, i) => (
                  <div key={i} className="flex items-center space-x-3 bg-white dark:bg-dark-surface p-2.5 rounded-lg border border-slate-200 dark:border-white/10/60 text-xs shadow-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background dark:bg-dark-bg border border-slate-200 dark:border-white/10/50">
                      {renderSourceIcon(src.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-none">{src.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">{src.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Log Section */}
      <Card className="shadow-premium rounded-[2rem] border-slate-200/70 dark:border-white/10">
        <CardHeader className="p-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <CardTitle className="text-xl font-black">Advisory Log History</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Chronological logging of synthesized agronomic recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {recHistory.length > 0 ? (
            recHistory.map((item, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-4 border-b border-slate-100 dark:border-white/5/60 pb-4 last:border-b-0 last:pb-0"
              >
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                  item.severity === 'High' 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : item.severity === 'Moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-green-50 border-green-200 text-primary dark:text-primary-300'
                }`}>
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.problem}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'historical'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal line-clamp-2">{item.reason}</p>
                  <div className="pt-1 text-[10px] text-primary dark:text-primary-300 flex items-center">
                    Action: {item.action.slice(0, 75)}... <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No historical recommendation logs.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
