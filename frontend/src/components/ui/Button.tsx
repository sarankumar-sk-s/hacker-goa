import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-heading font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neon-emerald/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    
    const variants = {
      primary: "bg-neon-emerald text-black font-semibold hover:bg-[#00e676] neon-glow-btn transition-shadow",
      secondary: "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20",
      ghost: "text-zinc-400 hover:text-white hover:bg-white/5",
      danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
    }

    const sizes = {
      sm: "px-3.5 py-1.5 text-xs rounded-md",
      md: "px-5 py-2.5 text-sm rounded-lg",
      lg: "px-7 py-3 text-base rounded-xl",
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = "Button"
