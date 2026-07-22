import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Compass, ArrowRight, ShieldCheck, Mail, Lock, User, Globe, Sprout, Ruler } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  
  // Fields
  const [name, setName] = React.useState('')
  const [farmName, setFarmName] = React.useState('')
  const [farmSize, setFarmSize] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [cropType, setCropType] = React.useState('Rice')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  // State
  const [loading, setLoading] = React.useState(false)
  
  // Validation Errors
  const [errors, setErrors] = React.useState<Record<string, string>>({})

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
    
    // Clear validation states
    setErrors({})
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!name.trim()) {
      newErrors.name = 'Full name is required'
      isValid = false
    }

    if (!farmName.trim()) {
      newErrors.farmName = 'Farm name is required'
      isValid = false
    }

    if (!farmSize.trim()) {
      newErrors.farmSize = 'Farm acreage is required'
      isValid = false
    } else {
      const sizeNum = parseFloat(farmSize)
      if (isNaN(sizeNum) || sizeNum <= 0) {
        newErrors.farmSize = 'Farm size must be a positive numeric value'
        isValid = false
      }
    }

    if (!location.trim()) {
      newErrors.location = 'Farm location is required'
      isValid = false
    }

    if (!email) {
      newErrors.email = 'Email address is required'
      isValid = false
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email syntax'
      isValid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      isValid = false
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    if (!isValid) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    
    try {
      await authAPI.register({ 
        name: name.trim(), 
        email: email.trim(), 
        password,
        farm_name: farmName.trim(),
        farm_size: parseFloat(farmSize),
        location: location.trim(),
        crop_type: cropType
      })
      navigate('/app')
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed. Try again.' })
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

        {/* Custom SVG line illustrations */}
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
            
            {/* Radiating telemetry signal waves */}
            <path d="M240 165 Q 250 175 260 165" stroke="#2E7D32" strokeWidth="1.5" />
            <path d="M230 180 Q 250 195 270 180" stroke="#2E7D32" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Ground sensor node dot */}
            <circle cx="250" cy="350" r="5" fill="#FFB300" />
            <circle cx="250" cy="350" r="14" stroke="#FFB300" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" />
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
            Register and start monitoring today.
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create an agronomic profile, define your agricultural coordinates parcel size, specify your crop cultivation parameters, and access our unified diagnostics dashboard.
          </p>
        </div>

        {/* Bottom review card */}
        <div className="relative z-10 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="h-5 w-5 text-[#FFB300] shrink-0" />
            <span className="text-xs font-semibold">Zero-Noise Verification Active</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
            KAIROS synthesizes IoT canopy temperature, soil profiles, Sentinel-2 indices, and weather projections to eliminate single-sensor noise warnings.
          </p>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: GLASSMORPHISM REGISTRATION FORM CARD ─────────────────────── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-[#F7F9F5] bg-grid-pattern relative overflow-y-auto">
        {/* Mobile top branding */}
        <div className="absolute top-6 left-6 flex items-center space-x-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
            <Compass className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-900">KAIROS</span>
        </div>

        <div className="w-full max-w-md space-y-6 pt-10 lg:pt-0">
          <div className="space-y-1 text-center lg:text-left">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Create Farm Profile</h3>
            <p className="text-xs text-slate-500">Provide land details to activate satellite indices tracking.</p>
          </div>

          {/* Glassmorphic signup card */}
          <Card className="glass border-[#DCE3D6]/70 shadow-xl bg-white/75 backdrop-blur-md">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {errors.general && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs font-semibold text-red-700">
                    {errors.general}
                  </div>
                )}

                {/* Grid Split Name & Farm Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <User className="h-3 w-3 mr-1 text-slate-400" /> Farmer Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <Sprout className="h-3 w-3 mr-1 text-slate-400" /> Farm Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Paddy Fields"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      error={errors.farmName}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Grid Split Farm Size & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <Ruler className="h-3 w-3 mr-1 text-slate-400" /> Size (Hectares)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      error={errors.farmSize}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <Globe className="h-3 w-3 mr-1 text-slate-400" /> Location (City)
                    </label>
                    <Input
                      type="text"
                      placeholder="Coimbatore"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      error={errors.location}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Crop Type Dropdown selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                    <Sprout className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Crop Cultivation
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  >
                    <option value="Rice">Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Mango">Mango</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Barley">Barley</option>
                  </select>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="farmer@kairos.ag"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Password field split inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <Lock className="h-3 w-3 mr-1 text-slate-400" /> Password
                    </label>
                    <Input
                      type="password"
                      placeholder="At least 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                      <Lock className="h-3 w-3 mr-1 text-slate-400" /> Confirm
                    </label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={loading} className="w-full mt-4 bg-[#2E7D32] hover:bg-[#1B5E20]">
                  Register Agrarian Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#2E7D32] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
