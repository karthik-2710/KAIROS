import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2E7D32] text-white",
        secondary: "border-transparent bg-[#EDF1EA] text-slate-800",
        destructive: "border-transparent bg-red-50 text-red-700 border-red-100",
        outline: "text-slate-600 border-[#DCE3D6] bg-white",
        success: "border-transparent bg-green-50 text-green-800 border-green-100",
        warning: "border-transparent bg-amber-50 text-amber-800 border-amber-100",
        info: "border-transparent bg-blue-50 text-blue-800 border-blue-100",
        accent: "border-transparent bg-[#FFB300] text-slate-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
