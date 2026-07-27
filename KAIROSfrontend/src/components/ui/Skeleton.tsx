import { cn } from "@/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-100 dark:bg-white/10 dark:bg-white dark:bg-dark-surface/5 dark:bg-[#1e2e22]/50", className)}
      {...props}
    />
  )
}

export { Skeleton }
