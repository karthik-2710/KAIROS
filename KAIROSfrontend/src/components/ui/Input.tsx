import * as React from "react"
import { cn } from "@/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-sm text-slate-800 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 font-medium pl-1">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
