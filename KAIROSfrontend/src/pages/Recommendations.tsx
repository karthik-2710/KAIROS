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
        return <Layers className="h-4 w-4 text-[#2E7D32]" />
      case 'thermometer':
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-amber-500" />
      case 'cloud':
      case 'weather':
        return <CloudSun className="h-4 w-4 text-slate-400" />
      case 'leaf':
      case 'sparkles':
      case 'camera':
        return <Camera className="h-4 w-4 text-[#2E7D32]" />
      default:
        return <Brain className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Agronomic Recommendations</h1>
          <p className="text-xs text-slate-500">
            Advisory panel synthesized from multiple telemetry feeds to guarantee zero-noise recommendations.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Run Analysis
        </Button>
      </div>

      {/* Featured Current Recommendation Card */}
      <Card className="border-[#DCE3D6]/70 shadow-lg relative overflow-hidden bg-white/50 backdrop-blur-sm">
        {/* Border accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          recommendation.severity === 'High' ? 'bg-red-500' : 
          recommendation.severity === 'Moderate' ? 'bg-[#FFB300]' : 'bg-[#2E7D32]'
        }`} />

        <CardHeader className="pb-3 mt-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-widest">
                Active Crop Advisory
              </span>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">
                {recommendation.problem}
              </CardTitle>
            </div>
            <Badge variant={recommendation.severity === 'High' ? 'destructive' : recommendation.severity === 'Moderate' ? 'warning' : 'success'}>
              {recommendation.severity === 'None' ? 'Optimal' : `${recommendation.severity} Severity`}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Reason Section */}
          <div className="bg-[#EDF1EA]/30 p-4 rounded-xl border border-[#DCE3D6]/50">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 pl-0.5">Diagnostic Rationale</h4>
            <p className="text-xs text-slate-600 leading-relaxed pl-0.5">{recommendation.reason}</p>
          </div>

          {/* Action step items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider pl-0.5 flex items-center">
              <Award className="h-4 w-4 mr-1 text-[#2E7D32]" /> Agronomist Advisory Directive
            </h4>
            <div className="border border-[#DCE3D6] bg-white p-4 rounded-xl leading-relaxed text-slate-700 text-xs font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
              {recommendation.action}
            </div>
          </div>

          {/* Cross verified inputs indicators */}
          {recommendation.sources && recommendation.sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#EDF1EA]/75">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Cross-Verified Evidence Sources</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-1.5">
                {recommendation.sources.map((src, i) => (
                  <div key={i} className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-[#DCE3D6]/60 text-xs shadow-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F9F5] border border-[#DCE3D6]/50">
                      {renderSourceIcon(src.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate leading-none">{src.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-1">{src.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Log Section */}
      <Card>
        <CardHeader>
          <CardTitle>Advisory Log History</CardTitle>
          <CardDescription>Chronological logging of synthesized agronomic recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recHistory.length > 0 ? (
            recHistory.map((item, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-4 border-b border-[#EDF1EA]/60 pb-4 last:border-b-0 last:pb-0"
              >
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                  item.severity === 'High' 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : item.severity === 'Moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-green-50 border-green-200 text-[#2E7D32]'
                }`}>
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{item.problem}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'historical'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal line-clamp-2">{item.reason}</p>
                  <div className="pt-1 text-[10px] text-[#2E7D32] flex items-center">
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
