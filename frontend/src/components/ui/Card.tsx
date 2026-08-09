import React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  glowEffect?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = true, glowEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card overflow-hidden relative",
          hoverEffect && "glass-card-hover",
          glowEffect && "border-neon-emerald/30 shadow-[0_0_20px_-5px_rgba(0,255,135,0.15)]",
          className
        )}
        {...props}
      >
        {glowEffect && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-emerald to-transparent opacity-65" />
        )}
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"
