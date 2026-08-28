export interface User {
  id: number
  name: string
  email: string
  created_at?: string
}

export interface Farm {
  id: number
  user_id: number
  name: string
  crop_type: string
  area_ha: number
  polygon?: string | [number, number][]
  health_score: number
  phone?: string
  whatsapp?: string
  use_phone_as_whatsapp?: number
  email?: string
  preferred_language?: string
  created_at?: string
}

export interface SensorData {
  id?: number
  farm_id: number
  temperature: number
  humidity: number
  soil_moisture: number
  light?: number
  mq135?: number
  rain_detected: boolean | number
  timestamp?: string
  _is_mock?: boolean
}

export interface SatelliteData {
  id?: number
  farm_id: number
  ndvi_mean?: number
  ndvi_min?: number
  ndvi_max?: number
  healthy_pct?: number
  moderate_pct?: number
  stress_pct?: number
  cloud_coverage?: number
  timestamp?: string
  _is_mock?: boolean
}

export interface Prediction {
  id?: number
  farm_id: number
  image_path?: string
  disease: string
  confidence: number
  severity: string
  description: string
  recommendations?: string[]
  timestamp?: string
  _is_mock?: boolean
}

export interface RecommendationSource {
  name: string
  value: string
  icon: string
  status?: 'success' | 'warning' | 'danger'
}

export interface Recommendation {
  id?: number
  farm_id: number
  health_score: number
  type?: string
  severity: string
  problem: string
  reason: string
  action: string
  primary_issue?: string
  diagnostic_summary?: string
  recommended_actions?: string[]
  supporting_evidence?: string[]
  sources?: RecommendationSource[]
  sources_json?: string
  timestamp?: string
}

export interface DashboardStats {
  total_farms: number
  last_analysis: string | null
  alerts: number
  diseases_detected: number
}

export interface DashboardData {
  health_score: number
  sensor: SensorData
  weather: {
    temperature: number
    humidity: number
    wind_speed: number
    description: string
    location: string
    rain_forecast_mm: number
    pressure: number
    feels_like: number
    lat?: number
    lon?: number
    _is_mock?: boolean
  }
  satellite: SatelliteData
  recommendation: Recommendation
  stats: DashboardStats
}

export interface AnalysisHistoryItem {
  id: number
  analysis_id: number
  farm_id: number
  farm_name: string
  crop: string
  location: string
  timestamp: string
  date: string
  health_score: number
  severity: string
  overall_status: string
  primary_issue: string
  secondary_issue?: string
  diagnostic_summary: string
  action: string
  recommended_actions: string[]
  supporting_evidence: string[]
  safety_info?: Array<{
    chemical_name?: string
    dosage_per_ha?: string
    phi_days?: number
  }>
  rule_matched?: {
    rule_id?: string
    name?: string
    description?: string
  }
  model_statuses?: Record<string, any>
  disease?: string
  ai_confidence?: number
  temperature?: number
  humidity?: number
  soil_moisture?: number
  light?: number
  ndvi_mean?: number
  ndre_mean?: number
  ndwi_mean?: number
  stress_pct?: number
  healthy_pct?: number
}

export interface MandiPriceItem {
  market_name: string
  district: string
  state: string
  commodity: string
  variety?: string
  min_price: number | null
  max_price: number | null
  modal_price: number | null
  price_unit: string
  price_per_kg: number | null
  distance_km: number | null
  proximity_badge: 'Local District' | 'Nearby Market' | 'State-wide Market' | string
  arrival_date: string
  source: string
}

export interface MarketSummary {
  state_modal_avg: number | null
  min_price: number | null
  max_price: number | null
  price_unit: string
  price_per_kg_avg: number | null
  top_market: string | null
  top_market_price: number | null
  total_mandis_reporting: number
  price_change_pct: number | null
  trend_direction: 'UP' | 'DOWN' | 'STABLE'
  latest_observation_date: string
  source: string
  last_updated_at: string
}

export interface HistoricalMarketPoint {
  date: string
  modal_price: number | null
  min_price: number | null
  max_price: number | null
}

export interface MarketIntelligenceResponse {
  success: boolean
  crop_id: string
  crop_name: string
  state: string
  farm_location: { lat: number; lon: number }
  has_data: boolean
  summary: MarketSummary
  mandis: MandiPriceItem[]
  historical_trends: HistoricalMarketPoint[]
}

export interface MarketDashboardSummary {
  success: boolean
  crop_name: string
  state: string
  has_data: boolean
  modal_price: number | null
  price_unit: string
  price_per_kg: number | null
  price_change_pct: number | null
  trend_direction: 'UP' | 'DOWN' | 'STABLE'
  top_nearby_mandi: string | null
  top_nearby_distance_km: number | null
  latest_observation_date: string
  source: string
  last_updated_at: string
}

