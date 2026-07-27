import * as React from "react"
import { cn } from "@/utils/cn"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function Tabs({ value, onValueChange, children, className }: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 dark:bg-white dark:bg-dark-surface/5/60 p-1 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10/40", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used inside Tabs")
  const active = context.value === value
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:pointer-events-none disabled:opacity-50 select-none",
        active 
          ? "bg-white dark:bg-dark-surface text-slate-900 dark:text-white shadow-sm font-semibold" 
          : "text-slate-500 dark:text-slate-400 hover:text-slate-950 hover:bg-white dark:bg-dark-surface/20",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used inside Tabs")
  if (context.value !== value) return null
  return (
    <div className={cn("focus-visible:outline-none", className)}>
      {children}
    </div>
  )
}
