import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import Dashboard from '@/pages/Dashboard'
import MyFarms from '@/pages/MyFarms'
import AddFarm from '@/pages/AddFarm'
import SatelliteAnalysis from '@/pages/SatelliteAnalysis'
import LeafUpload from '@/pages/LeafUpload'
import Recommendation from '@/pages/Recommendation'
import History from '@/pages/History'
import DigitalTwin from '@/pages/DigitalTwin'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import { useAuthStore } from '@/store/authStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#16A34A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/farms" element={<MyFarms />} />
          <Route path="/farms/add" element={<AddFarm />} />
          <Route path="/satellite" element={<SatelliteAnalysis />} />
          <Route path="/upload" element={<LeafUpload />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/history" element={<History />} />
          <Route path="/twin" element={<DigitalTwin />} />
        </Route>
      </Routes>
    </Router>
  )
}
