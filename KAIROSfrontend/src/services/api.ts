import axios from 'axios'
import {
  Farm,
  SensorData,
  SatelliteData,
  Recommendation,
  DashboardData,
  User,
  AnalysisHistoryItem,
  MarketIntelligenceResponse,
  MarketDashboardSummary
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("kairos_token");

  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return config;
}, (error) => Promise.reject(error))

// Handle expired or invalid token
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kairos_token')
      localStorage.removeItem('kairos_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── RESILIENT LOCAL STORAGE MOCK DATA ─────────────────────────────────────────
// This fallback enables offline demonstration if the backend service is not running.
const SEED_USER: User = { id: 1, name: "Demo Farmer", email: "demo@kairos.ag" }

const SEED_FARMS: Farm[] = [
  { id: 1, user_id: 1, name: "North Paddy Field", crop_type: "Rice", area_ha: 3.2, polygon: "[[11.0168,76.9558],[11.0268,76.9558],[11.0268,76.9658],[11.0168,76.9658]]", health_score: 84 },
  { id: 2, user_id: 1, name: "South Orchard", crop_type: "Mango", area_ha: 5.4, polygon: "[[11.0068,76.9458],[11.0128,76.9458],[11.0128,76.9518],[11.0068,76.9518]]", health_score: 48 },
  { id: 3, user_id: 1, name: "East Wheat Field", crop_type: "Wheat", area_ha: 2.1, polygon: "[[11.0268,76.9658],[11.0328,76.9658],[11.0328,76.9718],[11.0268,76.9718]]", health_score: 91 },
]

function getMockFarms(): Farm[] {
  const data = localStorage.getItem('mock_farms')
  if (!data) {
    localStorage.setItem('mock_farms', JSON.stringify(SEED_FARMS))
    return SEED_FARMS
  }
  return JSON.parse(data)
}

function saveMockFarms(farms: Farm[]) {
  localStorage.setItem('mock_farms', JSON.stringify(farms))
}

// ─── API SERVICES ─────────────────────────────────────────────────────────────

export const authAPI = {
  login: async (credentials: any) => {
    try {
      const res = await client.post('/auth/login', credentials)
      localStorage.setItem('kairos_token', res.data.token)
      localStorage.setItem('kairos_user', JSON.stringify(res.data.user))
      return res.data
    } catch {
      // Mock Fallback
      if (credentials.email === 'demo@kairos.ag' && credentials.password === 'demo1234') {
        const token = "mock_jwt_token_for_kairos"
        localStorage.setItem('kairos_token', token)
        localStorage.setItem('kairos_user', JSON.stringify(SEED_USER))
        return { user: SEED_USER, token, farms: SEED_FARMS }
      }
      throw new Error("Invalid username or password")
    }
  },

  register: async (data: any) => {
    try {
      const res = await client.post('/auth/register', data)
      localStorage.setItem('kairos_token', res.data.token)
      localStorage.setItem('kairos_user', JSON.stringify(res.data.user))
      return res.data
    } catch {
      const token = "mock_jwt_token_for_kairos"
      const newUser = { id: Date.now(), name: data.name, email: data.email }
      localStorage.setItem('kairos_token', token)
      localStorage.setItem('kairos_user', JSON.stringify(newUser))
      return { user: newUser, token, farms: [] }
    }
  },

  me: async () => {
    try {
      const res = await client.get('/auth/me')
      return res.data
    } catch {
      const userStr = localStorage.getItem('kairos_user')
      return userStr ? JSON.parse(userStr) : SEED_USER
    }
  },

  logout: () => {
    localStorage.removeItem('kairos_token')
    localStorage.removeItem('kairos_user')
  }
}

export const farmAPI = {
  getAll: async (): Promise<Farm[]> => {
    try {
      const res = await client.get('/farms')
      return Array.isArray(res.data) ? res.data : []
    } catch {
      const mock = getMockFarms()
      return Array.isArray(mock) ? mock : []
    }
  },

  getById: async (id: number): Promise<Farm> => {
    try {
      const res = await client.get(`/farms/${id}`)
      return res.data
    } catch {
      const farm = getMockFarms().find(f => f.id === id)
      if (!farm) throw new Error("Farm not found")
      return farm
    }
  },

  create: async (data: Partial<Farm>): Promise<Farm> => {
    try {
      const res = await client.post('/farms', data)
      return res.data
    } catch {
      const farms = getMockFarms()
      const newFarm: Farm = {
        id: farms.length > 0 ? Math.max(...farms.map(f => f.id)) + 1 : 1,
        user_id: 1,
        name: data.name || "Unnamed Farm",
        crop_type: data.crop_type || "Unknown",
        area_ha: Number(data.area_ha) || 0,
        polygon: typeof data.polygon === 'string' ? data.polygon : JSON.stringify(data.polygon || []),
        health_score: 60,
        created_at: new Date().toISOString()
      }
      saveMockFarms([...farms, newFarm])
      return newFarm
    }
  },

  update: async (id: number, data: Partial<Farm>): Promise<Farm> => {
    try {
      const res = await client.put(`/farms/${id}`, data)
      return res.data
    } catch {
      const farms = getMockFarms()
      const updated = farms.map(f => f.id === id ? { ...f, ...data } : f)
      saveMockFarms(updated)
      const found = updated.find(f => f.id === id)
      if (!found) throw new Error("Farm not found")
      return found
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await client.delete(`/farms/${id}`)
    } catch {
      const farms = getMockFarms()
      saveMockFarms(farms.filter(f => f.id !== id))
    }
  }
}

export const dashboardAPI = {
  get: async (farmId?: number): Promise<DashboardData> => {
    const fId = farmId || 1
    const res = await client.get('/dashboard', { params: { farm_id: fId } })
    return res.data
  }
}

export const sensorAPI = {
  getLatest: async (farmId: number): Promise<SensorData> => {
    const res = await client.get('/sensor/latest', { params: { farm_id: farmId } })
    return res.data
  },

  getHistory: async (farmId: number, days = 7): Promise<SensorData[]> => {
    const res = await client.get('/sensor/history', { params: { farm_id: farmId, days } })
    return res.data
  }
}

export const weatherAPI = {
  get: async (farmId: number) => {
    const res = await client.get('/weather', { params: { farm_id: farmId } })
    return res.data
  },
  getFarmWeather: async (farmId: number): Promise<any> => {
    const res = await client.get(`/weather/farm/${farmId}`)
    return res.data
  },
  getAlerts: async (farmId: number): Promise<any> => {
    const res = await client.get(`/weather/alerts/${farmId}`)
    return res.data
  },
  evaluateAlerts: async (payload: { farm_id: number; force_send?: boolean; language?: string }): Promise<any> => {
    const res = await client.post('/weather/alerts/evaluate', payload)
    return res.data
  },
  sendTestWhatsApp: async (payload: { phone: string; crop: string; language: string; severity?: string }): Promise<any> => {
    const res = await client.post('/weather/alerts/send-whatsapp', payload)
    return res.data
  },
  getThresholds: async (): Promise<any> => {
    const res = await client.get('/weather/thresholds')
    return res.data
  },
  syncFarmLanguage: async (payload: { farm_id: number; language: string }): Promise<any> => {
    const res = await client.post('/weather/auto-dispatch/sync-language', payload)
    return res.data
  },
  triggerAutoDispatch: async (payload: { farm_id: number; language?: string }): Promise<any> => {
    const res = await client.post('/weather/auto-dispatch/trigger', payload)
    return res.data
  }
}

export const satelliteAPI = {
  get: async (farmId: number): Promise<SatelliteData> => {
    const res = await client.get('/satellite', { params: { farm_id: farmId } })
    return res.data
  },

  trigger: async (farmId: number): Promise<{ status: string; data: SatelliteData }> => {
    const res = await client.post(`/farms/${farmId}/calculate-ndvi`)
    return { status: 'ok', data: res.data }
  },

  getHistory: async (farmId: number): Promise<SatelliteData[]> => {
    const res = await client.get('/satellite/history', { params: { farm_id: farmId } })
    return res.data
  }
}

export const aiAPI = {
  analyzeLeaf: async (formData: FormData): Promise<any> => {
    const res = await client.post('/ai/analyze-leaf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  detectPest: async (formData: FormData): Promise<any> => {
    const res = await client.post('/ai/detect-pest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  forecastPest: async (payload: any): Promise<any> => {
    const res = await client.post('/ai/forecast-pest', payload)
    return res.data
  },

  forecastDisease: async (payload: any): Promise<any> => {
    const res = await client.post('/ai/forecast-disease', payload)
    return res.data
  },

  getForecastOptions: async (): Promise<any> => {
    const res = await client.get('/ai/forecast-options')
    return res.data
  },

  getHistory: async (farmId: number): Promise<any> => {
    const res = await client.get('/ai/history', { params: { farm_id: farmId } })
    return res.data
  }
}

export const cameraAPI = {
  listCameras: async (): Promise<any> => {
    const res = await client.get('/camera/list')
    return res.data
  },
  getStats: async (): Promise<any> => {
    const res = await client.get('/camera/stats')
    return res.data
  },
  scanLeaf: async (payload: { crop: string; camera_id?: string; farm_id?: number }): Promise<any> => {
    const res = await client.post('/camera/scan', payload)
    return res.data
  }
}

export const recommendationAPI = {
  get: async (farmId: number): Promise<Recommendation> => {
    try {
      const res = await client.get('/recommendation', { params: { farm_id: farmId } })
      return res.data
    } catch {
      return { farm_id: farmId, health_score: 0, type: "Error", severity: "Unknown", problem: "System Timeout", reason: "The recommendation engine took too long to respond. The LLM might be experiencing high demand or analyzing complex data.", action: "Please try running the analysis again in a few moments." }
    }
  },

  getHistory: async (farmId: number): Promise<Recommendation[]> => {
    try {
      const res = await client.get('/recommendation/history', { params: { farm_id: farmId } })
      return res.data
    } catch {
      return []
    }
  }
}

export const analysisAPI = {
  run: async (farmId: number): Promise<any> => {
    const res = await client.post('/analysis/run', { farm_id: farmId })
    return res.data
  },
  getHistory: async (farmId?: number): Promise<AnalysisHistoryItem[]> => {
    try {
      const res = await client.get('/analysis/history', { params: { farm_id: farmId } })
      return res.data
    } catch {
      return []
    }
  }
}

export const historyAPI = {
  getHistory: async (farmId?: number): Promise<AnalysisHistoryItem[]> => {
    try {
      const res = await client.get('/analysis/history', { params: { farm_id: farmId } })
      return res.data
    } catch {
      return []
    }
  },
  getDetail: async (analysisId: number, farmId?: number): Promise<AnalysisHistoryItem | null> => {
    try {
      const res = await client.get(`/analysis/history/${analysisId}`, { params: { farm_id: farmId } })
      return res.data
    } catch {
      return null
    }
  }
}

export const chatAPI = {
  sendMessage: async (
    message: string, 
    language: string = 'en', 
    farmId?: number, 
    history: Array<{ role: string; content: string }> = []
  ): Promise<string> => {
    try {
      const res = await client.post('/ai/assistant/chat', { 
        message, 
        language,
        farm_id: farmId || 1,
        history
      })
      if (res.data && res.data.success) {
        return res.data.response
      }
      return "Sorry, I received an unexpected response from the server."
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error("Failed to connect to AI Assistant server.")
    }
  },

  transcribeAudio: async (audioBlob: Blob, language: string = 'en'): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', language)

      const res = await client.post('/ai/transcribe-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data && res.data.success) {
        return res.data.transcript || ''
      }
      throw new Error(res.data?.error || "Audio transcription failed")
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error)
      }
      throw error
    }
  }
}

export const marketAPI = {
  getPrices: async (farmId?: number, crop?: string, state: string = 'Maharashtra'): Promise<MarketIntelligenceResponse> => {
    const res = await client.get('/market/prices', {
      params: { farm_id: farmId, crop, state }
    })
    return res.data
  },

  getSummary: async (farmId?: number, crop?: string, state: string = 'Maharashtra'): Promise<MarketDashboardSummary> => {
    const res = await client.get('/market/summary', {
      params: { farm_id: farmId, crop, state }
    })
    return res.data
  },

  getHistory: async (crop: string = 'Rice', state: string = 'Maharashtra') => {
    const res = await client.get('/market/history', {
      params: { crop, state }
    })
    return res.data
  }
}

