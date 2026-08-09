import React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  glow?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, glow = false, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-900 border border-white/5 relative overflow-hidden",
        glow && "shadow-[0_0_15px_-5px_rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    >
      {/* Shimmer sweep animation overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  )
}
