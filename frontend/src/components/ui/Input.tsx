import React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl border border-white/8 bg-zinc-950/40 text-white font-sans text-sm placeholder:text-zinc-600 focus:outline-none focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30 transition-all duration-200",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-sans mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
