import { cn } from "@/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#EDF1EA] dark:bg-[#1e2e22]/50", className)}
      {...props}
    />
  )
}

export { Skeleton }
