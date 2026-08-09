import React from "react"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface Step {
  id: number
  label: string
  completed: boolean
}

interface StepIndicatorProps {
  steps: Step[]
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 px-2">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2.5 w-full sm:w-auto">
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
              s.completed
                ? "bg-neon-emerald/10 border-neon-emerald text-neon-emerald shadow-[0_0_10px_rgba(0,255,135,0.15)]"
                : "border-zinc-800 text-zinc-600 bg-zinc-950/20"
            }`}
          >
            {s.completed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : s.id}
          </span>
          <span
            className={`text-xs font-heading font-bold uppercase tracking-wider transition-colors duration-300 ${
              s.completed ? "text-zinc-300" : "text-zinc-500"
            }`}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-zinc-800 ml-auto sm:ml-1.5 hidden sm:inline shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}
