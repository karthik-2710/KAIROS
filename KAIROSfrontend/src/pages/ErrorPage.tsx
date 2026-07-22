import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowLeft, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F9F5] dark:bg-[#090e0c] p-6 transition-colors duration-300">
      <div className="absolute top-8 left-8 flex items-center space-x-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
          <Compass className="h-4.5 w-4.5" />
        </div>
        <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">KAIROS</span>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-[#DCE3D6]/70 shadow-xl bg-white/80 dark:bg-[#0d1310] dark:border-white/5">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-900/30">
              <AlertOctagon className="h-7 w-7" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Path Resolution Failed</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                The requested URL path was not resolved by KAIROS routing nodes. It may have been unlinked or restricted.
              </p>
            </div>

            <Link to="/" className="inline-block w-full">
              <Button className="w-full bg-[#2E7D32] hover:bg-[#1B5E20]">
                <ArrowLeft className="mr-2 h-4 w-4" /> Redirect to Security Base
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
