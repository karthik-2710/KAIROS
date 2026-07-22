import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, password: form.password })
      login(res.data.user, res.data.token)
      toast.success('Account created! Welcome to KAIROS 🌿')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, name, type = 'text', placeholder, icon: Icon, rightEl }) => (
    <div>
      <label className="block text-xs text-slate-400 font-medium mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={type}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          required
          className="w-full bg-[var(--color-surface)]/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
        {rightEl}
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
      <p className="text-slate-400 text-sm mb-7">Start optimizing your farm with KAIROS</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name" name="name" placeholder="John Farmer" icon={User} />
        <Field label="Email address" name="email" type="email" placeholder="farmer@example.com" icon={Mail} />
        <Field
          label="Password"
          name="password"
          type={showPass ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          icon={Lock}
          rightEl={
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <Field
          label="Confirm Password"
          name="confirm"
          type={showPass ? 'text' : 'password'}
          placeholder="Repeat password"
          icon={Lock}
        />
        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--color-primary)] font-medium hover:text-[var(--color-primary)]">Sign in</Link>
      </p>
    </div>
  )
}
