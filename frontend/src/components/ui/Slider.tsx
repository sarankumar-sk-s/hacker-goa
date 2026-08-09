import React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  label?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  accentColor?: string
  className?: string
}

export const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  step = 0.1,
  value,
  onChange,
  accentColor = "neon-emerald",
  className
}) => {
  const percentage = ((value - min) / (max - min)) * 100

  const accentStyles: Record<string, { bg: string; thumb: string; ring: string }> = {
    "neon-green": {
      bg: "bg-[#39FF14]",
      thumb: "bg-[#39FF14]",
      ring: "focus:ring-[#39FF14]/30"
    },
    "cyber-cyan": {
      bg: "bg-[#00F0FF]",
      thumb: "bg-[#00F0FF]",
      ring: "focus:ring-[#00F0FF]/30"
    },
    "laser-purple": {
      bg: "bg-[#BD00FF]",
      thumb: "bg-[#BD00FF]",
      ring: "focus:ring-[#BD00FF]/30"
    },
    "sunset-orange": {
      bg: "bg-[#FF5C00]",
      thumb: "bg-[#FF5C00]",
      ring: "focus:ring-[#FF5C00]/30"
    },
    "neon-emerald": {
      bg: "bg-neon-emerald",
      thumb: "bg-neon-emerald",
      ring: "focus:ring-neon-emerald/30"
    }
  }

  const activeAccent = accentStyles[accentColor] || accentStyles["neon-emerald"]

  return (
    <div className={cn("w-full space-y-1.5 text-left", className)}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-heading">
            {label}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            {value.toFixed(1)}x
          </span>
        </div>
      )}
      <div className="relative flex items-center group h-6">
        {/* Track track bg */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-zinc-900 border border-white/5" />
        
        {/* Fill track */}
        <div
          className={cn("absolute left-0 h-1 rounded-full pointer-events-none transition-all duration-75", activeAccent.bg)}
          style={{ width: `${percentage}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full appearance-none bg-transparent cursor-pointer relative z-10 focus:outline-none 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all 
            [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20
            [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.5)]
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 
            [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:transition-all 
            [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.5)]
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:hover:scale-110"
        />
      </div>
    </div>
  )
}
