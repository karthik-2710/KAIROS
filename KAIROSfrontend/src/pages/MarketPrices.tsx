import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { marketAPI } from '@/services/api'
import { MandiPriceItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  IndianRupee, 
  Store, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Info,
  Navigation,
  CheckCircle2,
  Filter
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { localizeCrop } from '@/utils/localize'

const SUPPORTED_CROPS = [
  'Rice',
  'Soybean',
  'Cotton',
  'Wheat',
  'Onion',
  'Banana',
  'Orange',
  'Bajra',
  'Jowar',
  'Sugarcane'
]

export default function MarketPrices() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId)

  // Selected crop (defaults to farm's crop, but user can toggle)
  const defaultCrop = currentFarm?.crop_type || 'Rice'
  const [selectedCrop, setSelectedCrop] = useState<string>(defaultCrop)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProximity, setSelectedProximity] = useState<'all' | 'local' | 'nearby'>('all')
  const [sortBy, setSortBy] = useState<'distance' | 'price_desc' | 'price_asc'>('distance')

  // Keep selected crop synced when farm changes unless user explicitly switched
  useMemo(() => {
    if (currentFarm?.crop_type) {
      setSelectedCrop(currentFarm.crop_type)
    }
  }, [currentFarm?.crop_type])

  // Fetch real market prices from KAIROS backend (AGMARKNET data.gov.in)
  const { 
    data: marketData, 
    isLoading, 
    refetch, 
    isFetching 
  } = useQuery({
    queryKey: ['market-prices', farmId, selectedCrop],
    queryFn: () => marketAPI.getPrices(farmId, selectedCrop, 'Maharashtra'),
    staleTime: 60000 * 30, // 30 mins
    refetchInterval: 60000 * 60 // 1 hr
  })

  const summary = marketData?.summary
  const mandis: MandiPriceItem[] = marketData?.mandis || []
  const historicalTrends = marketData?.historical_trends || []

  // Filter & sort mandis
  const filteredMandis = useMemo(() => {
    return mandis.filter((m: MandiPriceItem) => {
      const matchesSearch = 
        m.market_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.district.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesProximity = 
        selectedProximity === 'all' ? true :
        selectedProximity === 'local' ? (m.distance_km !== null && m.distance_km < 60) :
        selectedProximity === 'nearby' ? (m.distance_km !== null && m.distance_km < 200) : true

      return matchesSearch && matchesProximity
    }).sort((a: MandiPriceItem, b: MandiPriceItem) => {
      if (sortBy === 'distance') {
        return (a.distance_km ?? 9999) - (b.distance_km ?? 9999)
      } else if (sortBy === 'price_desc') {
        return (b.modal_price ?? 0) - (a.modal_price ?? 0)
      } else {
        return (a.modal_price ?? 0) - (b.modal_price ?? 0)
      }
    })
  }, [mandis, searchQuery, selectedProximity, sortBy])

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 p-6 md:p-8 rounded-3xl text-white shadow-premium relative overflow-hidden border border-white/10">
        {/* Subtle Background Pattern */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {t("Official AGMARKNET Mandi Intelligence")}
            </span>
            <span className="flex items-center space-x-1 text-[11px] text-green-200/80 font-medium">
              <MapPin className="h-3 w-3 text-emerald-400" />
              <span>Maharashtra, India</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Store className="h-7 w-7 text-emerald-400" />
            {t("Market Prices")}
          </h1>
          <p className="text-xs md:text-sm text-green-100/80 max-w-xl font-medium leading-relaxed">
            {t("Real-time APMC agricultural mandi auction prices and proximity analytics for your active farm.")}
          </p>
        </div>

        {/* Action / Selector Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Crop Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/15 shadow-inner">
            <span className="text-xs font-bold text-green-100 pl-2">{t("Crop")}:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-white dark:bg-dark-surface text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 border-0 focus:ring-2 focus:ring-emerald-400 shadow-sm cursor-pointer"
            >
              {SUPPORTED_CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {localizeCrop(crop)} ({crop})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 text-xs font-bold backdrop-blur-md shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            {t("Refresh")}
          </Button>
        </div>
      </div>

      {/* Hero KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Modal Market Price */}
        <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("Modal Price")}
              </CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            ) : summary?.state_modal_avg ? (
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{summary.state_modal_avg.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ quintal</span>
                </div>
                <div className="mt-1 flex items-center space-x-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>≈ ₹{summary.price_per_kg_avg} / kg</span>
                  {summary.price_change_pct !== null && (
                    <span className="flex items-center font-bold">
                      {summary.trend_direction === 'UP' ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500 mr-0.5" />
                      ) : summary.trend_direction === 'DOWN' ? (
                        <TrendingDown className="h-3 w-3 text-rose-500 mr-0.5" />
                      ) : (
                        <Minus className="h-3 w-3 text-slate-400 mr-0.5" />
                      )}
                      {summary.price_change_pct > 0 ? `+${summary.price_change_pct}%` : `${summary.price_change_pct}%`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-400 py-1">
                {t("No price reported today")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Price Range (Min - Max Spread) */}
        <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("Price Range")}
              </CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            ) : summary?.min_price && summary?.max_price ? (
              <div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{summary.min_price.toLocaleString('en-IN')} – ₹{summary.max_price.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  {t("Min & Max spread across reporting mandis")}
                </p>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-400 py-1">
                {t("Range data unavailable")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Top Reporting Mandi */}
        <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("Top Market")}
              </CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Store className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            ) : summary?.top_market ? (
              <div>
                <div className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
                  {summary.top_market}
                </div>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  ₹{summary.top_market_price?.toLocaleString('en-IN')} / quintal (Highest)
                </p>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-400 py-1">
                {t("No market reporting")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Active Mandis & Timestamp */}
        <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("Reporting Coverage")}
              </CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  {summary?.total_mandis_reporting || 0} {t("Mandis")}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center">
                  <span>{t("Observed")}: {summary?.latest_observation_date || "Today"}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Official Data Source Transparency Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-bold text-slate-900 dark:text-white">{t("Source")}:</strong> {summary?.source || "Government of India (AGMARKNET / data.gov.in)"}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
          <span>{t("Unit")}: <strong>{summary?.price_unit || "₹/quintal"} (100 kg)</strong></span>
          <span>•</span>
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            {t("Verified Daily Session")}
          </span>
        </div>
      </div>

      {/* Main Content Layout: Mandis Table + Price Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Relevant Nearby Mandis Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-surface shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    {t("Relevant Nearby Mandis")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {t("APMC markets ranked by proximity to your farm in")} {currentFarm?.name || "Maharashtra"}
                  </CardDescription>
                </div>

                {/* Search & Proximity Filters */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t("Search market or district...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary w-36 sm:w-48 transition-all"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="distance">{t("Sort: Nearest")}</option>
                    <option value="price_desc">{t("Sort: Highest Price")}</option>
                    <option value="price_asc">{t("Sort: Lowest Price")}</option>
                  </select>
                </div>
              </div>

              {/* Quick Proximity Filter Chips */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setSelectedProximity('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedProximity === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t("All Mandis")} ({mandis.length})
                </button>
                <button
                  onClick={() => setSelectedProximity('local')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedProximity === 'local'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t("Local District")} (&lt;60 km)
                </button>
                <button
                  onClick={() => setSelectedProximity('nearby')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedProximity === 'nearby'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t("Nearby")} (&lt;200 km)
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <p className="text-xs font-bold text-slate-500">{t("Fetching live AGMARKNET mandi data...")}</p>
                </div>
              ) : filteredMandis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-white/5">
                        <th className="py-3 px-4">{t("Market (Mandi)")}</th>
                        <th className="py-3 px-4">{t("District")}</th>
                        <th className="py-3 px-4">{t("Distance")}</th>
                        <th className="py-3 px-4 text-right">{t("Min Price")}</th>
                        <th className="py-3 px-4 text-right">{t("Max Price")}</th>
                        <th className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{t("Modal Price")}</th>
                        <th className="py-3 px-4 text-right">{t("Date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-700 dark:text-slate-200">
                      {filteredMandis.map((m: MandiPriceItem, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <Store className="h-3.5 w-3.5 text-slate-400" />
                            <span>{m.market_name}</span>
                          </td>
                          <td className="py-3 px-4">{m.district}</td>
                          <td className="py-3 px-4">
                            {m.distance_km !== null ? (
                              <Badge className={
                                m.distance_km < 60
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : m.distance_km < 200
                                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                              }>
                                {m.distance_km} km
                              </Badge>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-500">
                            {m.min_price ? `₹${m.min_price.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-500">
                            {m.max_price ? `₹${m.max_price.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {m.modal_price ? `₹${m.modal_price.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                            {m.arrival_date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Info className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("No market data found for the selected filter.")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("Try selecting another crop or clearing the search query.")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Historical Price Trends & Mandi Advisory Rules */}
        <div className="space-y-6">
          {/* Price Trend Chart Card */}
          <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-surface shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>{t("Price Trend")} — {selectedCrop}</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {t("Real historical market price observations")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicalTrends.length >= 2 ? (
                <div className="h-56 w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalTrends}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        stroke="#888888"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="#888888"
                        domain={['dataMin - 100', 'dataMax + 100']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        formatter={(val: any) => [`₹${val} / quintal`, 'Modal Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="modal_price" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 mt-2">
                  <Calendar className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("Historical price trend is compiling.")}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t("KAIROS records daily official observations to maintain real trend fidelity without synthetic estimates.")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Intelligence Guidance Card */}
          <Card className="rounded-3xl border-slate-200/70 dark:border-white/10 bg-emerald-500/5 border-emerald-500/20 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider">{t("Market Intelligence Guidelines")}</h4>
            </div>
            <ul className="text-[11px] font-medium text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <strong>{t("Official Mandi Auctions")}:</strong> {t("Prices reflect actual daily modal transactions recorded across Maharashtra APMC yards.")}
              </li>
              <li>
                <strong>{t("Standard Quintal Unit")}:</strong> {t("1 quintal = 100 kg. Retail prices may vary depending on moisture and grading.")}
              </li>
              <li>
                <strong>{t("Independent Decision Support")}:</strong> {t("Market prices are strictly informational and decoupled from Farm Health and agronomic spray rules.")}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
