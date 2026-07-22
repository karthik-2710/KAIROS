import axios from 'axios'
import {
  Farm,
  SensorData,
  SatelliteData,
  Recommendation,
  DashboardData,
  User
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("kairos_token");

  console.log("TOKEN:", token);

  if (token) {
    console.log("ATTACHING TOKEN", token);
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    console.log("NO TOKEN FOUND");
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
    const res = await client.post('/api/ai/analyze-leaf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  getHistory: async (farmId: number): Promise<any> => {
    const res = await client.get('/api/ai/history', { params: { farm_id: farmId } })
    return res.data
  }
}
export const recommendationAPI = {
  get: async (farmId: number): Promise<Recommendation> => {
    try {
      const res = await client.get('/recommendation', { params: { farm_id: farmId } })
      return res.data
    } catch {
      return { farm_id: farmId, health_score: 0, type: "", severity: "", problem: "", reason: "", action: "" }
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
