import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { LoadingState } from '@/components/ui/LoadingState'

// Lazy Load Pages
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Farms = lazy(() => import('@/pages/Farms'))
const IoTMonitoring = lazy(() => import('@/pages/IoTMonitoring'))
const SatelliteAnalysis = lazy(() => import('@/pages/Satellite'))
const LeafInference = lazy(() => import('@/pages/LeafInference'))
const Recommendations = lazy(() => import('@/pages/Recommendations'))
const History = lazy(() => import('@/pages/History'))
const Settings = lazy(() => import('@/pages/Settings'))
const ErrorPage = lazy(() => import('@/pages/ErrorPage'))

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Core App Shelled inside Layout wrapper */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="farms" element={<Farms />} />
              <Route path="iot" element={<IoTMonitoring />} />
              <Route path="satellite" element={<SatelliteAnalysis />} />
              <Route path="leaf-scan" element={<LeafInference />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
              {/* Catch-all redirect inside app scope */}
              <Route path="*" element={<ErrorPage />} />
            </Route>
            
            {/* Fallback for other routes */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
