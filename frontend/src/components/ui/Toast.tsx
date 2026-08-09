import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToastItem, ToastType } from "../../context/ToastContext"

interface ToastProps {
  toast: ToastItem
  onClose: (id: string) => void
}

const toastStyles: Record<ToastType, { border: string; bg: string; text: string; shadow: string; icon: React.ReactNode }> = {
  success: {
    border: "border-neon-emerald/30",
    bg: "bg-zinc-950/90",
    text: "text-neon-emerald",
    shadow: "shadow-[0_0_15px_rgba(0,255,135,0.1)]",
    icon: <CheckCircle2 className="h-4 w-4 text-neon-emerald shrink-0" />
  },
  error: {
    border: "border-red-500/30",
    bg: "bg-zinc-950/90",
    text: "text-red-400",
    shadow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    icon: <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
  },
  warning: {
    border: "border-orange-500/30",
    bg: "bg-zinc-950/90",
    text: "text-orange-400",
    shadow: "shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    icon: <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
  },
  info: {
    border: "border-cyan-500/30",
    bg: "bg-zinc-950/90",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    icon: <Info className="h-4 w-4 text-cyan-400 shrink-0" />
  }
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { id, message, type, duration } = toast
  const currentStyle = toastStyles[type] || toastStyles.info

  useEffect(() => {
    if (duration === undefined) return
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md min-w-[280px] max-w-[380px] shadow-lg pointer-events-auto",
        currentStyle.border,
        currentStyle.bg,
        currentStyle.shadow
      )}
      role="alert"
    >
      <div className="mt-0.5">{currentStyle.icon}</div>
      <div className="flex-1 text-left text-xs font-sans text-zinc-200 leading-snug">
        <p className={cn("font-heading font-black uppercase tracking-wider text-[10px] mb-0.5", currentStyle.text)}>
          {type} Message
        </p>
        <p className="opacity-90">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md p-1 transition-colors cursor-pointer shrink-0"
        aria-label="Close alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export const ToastContainer: React.FC<{ toasts: ToastItem[]; removeToast: (id: string) => void }> = ({
  toasts,
  removeToast
}) => {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-full"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
