import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
}

// ─── Farms ────────────────────────────────────────────────────────
export const farmAPI = {
  getAll: () => api.get('/farms'),
  getById: (id) => api.get(`/farms/${id}`),
  create: (data) => api.post('/farms', data),
  update: (id, data) => api.put(`/farms/${id}`, data),
  delete: (id) => api.delete(`/farms/${id}`),
}

// ─── Dashboard ────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (farmId) => api.get('/dashboard', { params: { farm_id: farmId } }),
}

// ─── Sensor ───────────────────────────────────────────────────────
export const sensorAPI = {
  getLatest: (farmId) => api.get('/sensor/latest', { params: { farm_id: farmId } }),
  getHistory: (farmId, days = 7) => api.get('/sensor/history', { params: { farm_id: farmId, days } }),
  post: (data) => api.post('/sensor', data),
}

// ─── Weather ──────────────────────────────────────────────────────
export const weatherAPI = {
  get: (farmId) => api.get('/weather', { params: { farm_id: farmId } }),
}

// ─── Satellite ────────────────────────────────────────────────────
export const satelliteAPI = {
  get: (farmId) => api.get('/satellite', { params: { farm_id: farmId } }),
  trigger: (farmId) => api.post('/satellite/analyze', { farm_id: farmId }),
  getHistory: (farmId) => api.get('/satellite/history', { params: { farm_id: farmId } }),
}

// ─── AI Prediction ────────────────────────────────────────────────
export const predictionAPI = {
  predict: (formData) => api.post('/ai/analyze-leaf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  getHistory: (farmId) => api.get('/ai/history', { params: { farm_id: farmId } }),
}

// ─── Recommendation ───────────────────────────────────────────────
export const recommendationAPI = {
  get: (farmId) => api.get('/recommendation', { params: { farm_id: farmId } }),
  getHistory: (farmId) => api.get('/recommendation/history', { params: { farm_id: farmId } }),
}

// ─── Analysis ───────────────────────────────────────────────────────
export const analysisAPI = {
  run: (farmId, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('farm_id', farmId);
      return api.post('/api/ai/analyze-leaf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
    }
    return api.post('/analysis/run', { farm_id: farmId });
  },
  getHistory: (farmId) => api.get('/analysis/history', { params: { farm_id: farmId } }),
}

export default api
