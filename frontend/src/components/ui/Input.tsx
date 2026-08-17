import React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    const { theme, activeGradient } = useTheme()
    const isGoaNight = activeGradient === "goa-night"

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className={cn(
            "block text-xs font-semibold uppercase tracking-wider font-heading",
            isGoaNight ? "text-zinc-200" : theme === "light" ? "text-[#052017]" : "text-zinc-400"
          )}>
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all duration-200",
            isGoaNight
              ? "bg-[#052017]/90 border-[#1E6F43]/40 text-white placeholder:text-zinc-500 focus:border-[#00FF87] focus:ring-1 focus:ring-[#00FF87]/30"
              : theme === "light"
              ? "bg-white/95 border-[#0B4B2E]/20 text-[#052017] placeholder:text-[#052017]/40 focus:border-[#1E6F43] focus:ring-1 focus:ring-[#1E6F43]/30"
              : "bg-zinc-950/40 border-white/8 text-white placeholder:text-zinc-600 focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30",
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
