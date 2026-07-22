import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F7F9F5] dark:bg-[#090e0c] transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4">
        {/* Glow loader */}
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#2E7D32]" />
          <div className="absolute h-10 w-10 rounded-full border border-green-200 dark:border-green-900/30 animate-pulse pointer-events-none" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">KAIROS</p>
          <p className="text-[10px] text-slate-400 font-semibold leading-none">Syncing precision data...</p>
        </div>
      </div>
    </div>
  )
}
export default LoadingState
