import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 duration-200 select-none",
  {
    variants: {
      variant: {
        default: "bg-[#2E7D32] text-white hover:bg-[#1B5E20] shadow-sm active:scale-[0.98]",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
        outline: "border border-[#DCE3D6] bg-white text-slate-700 hover:bg-[#F7F9F5] hover:text-slate-900 active:scale-[0.98]",
        secondary: "bg-[#EDF1EA] text-slate-800 hover:bg-[#DCE3D6] active:scale-[0.98]",
        ghost: "hover:bg-[#EDF1EA] text-slate-700 hover:text-slate-900 active:scale-[0.98]",
        link: "text-[#2E7D32] underline-offset-4 hover:underline",
        accent: "bg-[#FFB300] text-slate-950 hover:bg-[#FFA000] shadow-sm active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
