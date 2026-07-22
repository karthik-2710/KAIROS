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
  created_at?: string
}

export interface SensorData {
  id?: number
  farm_id: number
  temperature: number
  humidity: number
  soil_moisture: number
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
  status: 'success' | 'warning' | 'danger'
}

export interface Recommendation {
  id?: number
  farm_id: number
  health_score: number
  type: string
  severity: string
  problem: string
  reason: string
  action: string
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
