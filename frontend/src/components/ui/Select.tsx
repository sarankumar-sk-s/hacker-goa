import React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all duration-200 appearance-none cursor-pointer",
              isGoaNight
                ? "bg-[#052017]/90 border-[#1E6F43]/40 text-white focus:border-[#00FF87] focus:ring-1 focus:ring-[#00FF87]/30"
                : theme === "light"
                ? "bg-white/95 border-[#0B4B2E]/20 text-[#052017] focus:border-[#1E6F43] focus:ring-1 focus:ring-[#1E6F43]/30"
                : "bg-zinc-950/40 border-white/8 text-white focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option 
                key={opt.value} 
                value={opt.value} 
                className={isGoaNight ? "bg-[#052017] text-white" : theme === "light" ? "bg-[#FFF7E6] text-[#052017]" : "bg-zinc-950 text-white"}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${
            isGoaNight ? "text-[#00FF87]" : theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"
          }`}>
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 font-sans mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"
