import { Outlet } from 'react-router-dom'
import { Sprout } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#16A34A 1px, transparent 1px), linear-gradient(to right, #16A34A 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Glow effects */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-96 h-96 bg-[var(--color-secondary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-none ">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white font-poppins">KAIROS</h1>
              <p className="text-xs text-[var(--color-primary)] uppercase tracking-widest">AgriIntelligence</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">The Right Data. The Right Time. The Right Decision.</p>
        </div>

        {/* Auth card */}
        <div className="bg-[var(--color-surface)]/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-none">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
