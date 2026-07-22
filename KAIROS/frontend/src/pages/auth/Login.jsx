import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useFarmStore } from '@/store/farmStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { setFarms, setSelectedFarm } = useFarmStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      login(res.data.user, res.data.token)
      if (res.data.farms) {
        setFarms(res.data.farms)
        if (res.data.farms.length > 0) setSelectedFarm(res.data.farms[0])
      }
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Demo login
  const handleDemo = async () => {
    setForm({ email: 'demo@kairos.ag', password: 'demo1234' })
    setLoading(true)
    try {
      const res = await authAPI.login({ email: 'demo@kairos.ag', password: 'demo1234' })
      login(res.data.user, res.data.token)
      if (res.data.farms?.length) {
        setFarms(res.data.farms)
        setSelectedFarm(res.data.farms[0])
      }
      toast.success('Logged in as Demo Farmer 🌿')
      navigate('/')
    } catch {
      // Fallback: create demo session locally
      login({ id: 1, name: 'Demo Farmer', email: 'demo@kairos.ag' }, 'demo-token')
      toast.success('Demo mode activated 🌿')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-7">Sign in to your KAIROS account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="farmer@example.com"
              required
              className="w-full bg-[var(--color-surface)]/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
              className="w-full bg-[var(--color-surface)]/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-surface)]/10" />
        <span className="text-slate-500 text-xs">or</span>
        <div className="flex-1 h-px bg-[var(--color-surface)]/10" />
      </div>

      <button
        onClick={handleDemo}
        disabled={loading}
        className="w-full py-2.5 rounded-xl border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)]/10 transition-colors"
      >
        🌿 Try Demo Account
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--color-primary)] font-medium hover:text-[var(--color-primary)]">Create one</Link>
      </p>
    </div>
  )
}
