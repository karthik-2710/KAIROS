import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Compass, Leaf, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('demo@kairos.ag')
  const [password, setPassword] = React.useState('demo1234')
  
  // States
  const [rememberMe, setRememberMe] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  
  // Validation errors
  const [emailError, setEmailError] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')
  const [generalError, setGeneralError] = React.useState('')

  React.useEffect(() => {
    if (localStorage.getItem('kairos_token')) {
      navigate('/app')
    }
  }, [navigate])

  const validateEmail = (emailStr: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(emailStr)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear errors
    setEmailError('')
    setPasswordError('')
    setGeneralError('')

    let isValid = true

    if (!email) {
      setEmailError('Email is required')
      isValid = false
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    }

    if (!password) {
      setPasswordError('Password is required')
      isValid = false
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      isValid = false
    }

    if (!isValid) return

    setLoading(true)
    
    try {
      await authAPI.login({ email, password })
      if (rememberMe) {
        localStorage.setItem('kairos_remembered_email', email)
      } else {
        localStorage.removeItem('kairos_remembered_email')
      }
      navigate('/app')
    } catch (err: any) {
      setGeneralError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F9F5]">
      
      {/* ─── LEFT COLUMN: PREMIUM AGRICULTURAL SCHEMATIC ───────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#122c15] via-[#091a0c] to-[#040c06] p-12 text-white lg:flex overflow-hidden">
        {/* Glow Nodes */}
        <div className="absolute top-[-20%] left-[-20%] h-[500px] w-[500px] rounded-full bg-green-900/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-950/30 blur-[90px]" />

        {/* Custom SVG line illustrations representing smart agriculture fields, leaf cells, and satellite feeds */}
        <div className="absolute inset-0 z-0 opacity-20 flex items-center justify-center pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-[420px]">
            {/* Field Grid schema lines */}
            <path d="M50 350 L450 350" stroke="#2E7D32" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M50 400 L450 400" stroke="#2E7D32" strokeWidth="1.5" />
            <path d="M100 300 L200 450" stroke="#2E7D32" strokeWidth="1" />
            <path d="M250 300 L250 450" stroke="#2E7D32" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M400 300 L300 450" stroke="#2E7D32" strokeWidth="1" />

            {/* Satellite Orbital curve line */}
            <path d="M50 80 Q 250 200 450 80" stroke="#FFB300" strokeWidth="1.5" strokeDasharray="6 6" />
            
            {/* Satellite body vector schema */}
            <circle cx="250" cy="140" r="12" fill="#1B5E20" stroke="#FFB300" strokeWidth="2" />
            <rect x="220" y="137" width="15" height="6" fill="#0d1e11" stroke="#FFB300" strokeWidth="1.5" />
            <rect x="265" y="137" width="15" height="6" fill="#0d1e11" stroke="#FFB300" strokeWidth="1.5" />
            
            {/* Radiating telemetry signal waves */}
            <path d="M240 165 Q 250 175 260 165" stroke="#2E7D32" strokeWidth="1.5" />
            <path d="M230 180 Q 250 195 270 180" stroke="#2E7D32" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Ground sensor node dot */}
            <circle cx="250" cy="350" r="5" fill="#FFB300" />
            <circle cx="250" cy="350" r="14" stroke="#FFB300" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" />

            {/* Leaf nodes */}
            <path d="M90 320 Q 110 290 120 320" stroke="#2E7D32" strokeWidth="2" />
            <path d="M380 310 Q 395 285 410 310" stroke="#2E7D32" strokeWidth="2" />
          </svg>
        </div>

        {/* Top logo */}
        <div className="relative z-10 flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white border border-[#DCE3D6]/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight">KAIROS</span>
            <span className="block text-[8px] font-bold text-[#2E7D32] uppercase tracking-wider -mt-1">Precision Ag</span>
          </div>
        </div>

        {/* Middle copy text overlay */}
        <div className="relative z-10 space-y-4 max-w-sm">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Verify telemetry, optimize foliage.
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect distributed soil sensor nodes, retrieve high-frequency weather forecasts, and compute Sentinel-2 NDVI indexes on an investor-ready agronomic interface.
          </p>
        </div>

        {/* Bottom review card */}
        <div className="relative z-10 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="h-5 w-5 text-[#FFB300] shrink-0" />
            <span className="text-xs font-semibold">Zero-Noise Verification Active</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
            Recommendations require at least two validating datasets to trigger. Eliminates false readings and optimizes field water management.
          </p>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: GLASSMORPHISM LOGIN FORM CARD ───────────────────────────── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-[#F7F9F5] bg-grid-pattern relative">
        {/* Mobile top branding */}
        <div className="absolute top-6 left-6 flex items-center space-x-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
            <Compass className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-900">KAIROS</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Access Analytics Panel</h3>
            <p className="text-xs text-slate-500">Sign in to check live crop indices.</p>
          </div>

          {/* Glassmorphic Login Container */}
          <Card className="glass border-[#DCE3D6]/70 shadow-xl bg-white/75 backdrop-blur-md">
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {generalError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs font-semibold text-red-700">
                    {generalError}
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 pl-0.5 flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="farmer@kairos.ag"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center">
                      <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Password
                    </label>
                    <span className="text-[10px] text-[#2E7D32] hover:underline cursor-pointer font-medium">Forgot password?</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Remember me option */}
                <div className="flex items-center justify-between px-0.5 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#DCE3D6] text-[#2E7D32] focus:ring-green-600 h-4 w-4 transition cursor-pointer"
                    />
                    <span>Remember this machine</span>
                  </label>
                </div>

                <Button type="submit" isLoading={loading} className="w-full mt-2 bg-[#2E7D32] hover:bg-[#1B5E20]">
                  Enter Application Panel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              {/* Social authentication separator */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#EDF1EA]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                  <span className="bg-white px-2">Or verify with SSO</span>
                </div>
              </div>

              {/* Google login placeholder */}
              <button
                type="button"
                onClick={() => alert("Google Single Sign-On is currently under development.")}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-[#DCE3D6] bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#F7F9F5] active:scale-[0.98] transition duration-200"
              >
                {/* Simulated Google colorful G logo */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </CardContent>
          </Card>

          {/* Quick Demo Assist Info */}
          <div className="rounded-xl border border-[#DCE3D6]/50 bg-[#EDF1EA]/30 p-3 text-center text-[10px] text-slate-500 leading-normal flex items-start space-x-1.5">
            <Leaf className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
            <span>Use default credentials <strong>demo@kairos.ag</strong> / <strong>demo1234</strong> to enter preview mode.</span>
          </div>

          <div className="text-center text-xs text-slate-500">
            Need an agricultural profile?{' '}
            <Link to="/register" className="font-semibold text-[#2E7D32] hover:underline">
              Register parcel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
