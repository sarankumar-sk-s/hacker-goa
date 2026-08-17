import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Check, Sparkles } from "lucide-react"
import { useTheme, type GoaGradient } from "../context/ThemeContext"

const GRADIENTS: { id: GoaGradient; name: string; css: string }[] = [
  {
    id: "goa-night",
    name: "GOA NIGHT",
    css: "linear-gradient(135deg, #052017 0%, #0B4B2E 50%, #1E6F43 100%)",
  },
  {
    id: "palm-sunset",
    name: "PALM SUNSET",
    css: "linear-gradient(135deg, #1E6F43 0%, #FFC700 100%)",
  },
  {
    id: "ocean-breeze",
    name: "OCEAN BREEZE",
    css: "linear-gradient(135deg, #1E6F43 0%, #B7DCC6 50%, #FFF7E6 100%)",
  },
  {
    id: "tropical-vibes",
    name: "TROPICAL VIBES",
    css: "linear-gradient(135deg, #052017 0%, #FF5CA8 100%)",
  },
]

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, activeGradient, setActiveGradient } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentGradient = GRADIENTS.find((g) => g.id === activeGradient) || GRADIENTS[0]

  return (
    <div className="relative inline-flex items-center gap-2.5 z-50" ref={menuRef}>
      {/* 1. Dark / Light Switch Pill */}
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-heading font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm ${
          theme === "dark"
            ? "bg-black/60 border-white/15 text-white hover:bg-black/80 hover:border-white/30"
            : "bg-white/90 border-[#0B4B2E]/20 text-[#052017] hover:bg-white"
        }`}
      >
        {theme === "dark" ? (
          <>
            <Moon className="h-3.5 w-3.5 text-cyan-400" />
            <span>DARK</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5 text-[#1E6F43]" />
            <span>LIGHT</span>
          </>
        )}
      </button>

      {/* 2. Goa Gradient Theme Switcher Pill (Matching screenshot pill style) */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-heading font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm ${
            activeGradient === "goa-night"
              ? "bg-[#052017]/90 border-[#00FF87]/50 text-white shadow-[0_0_15px_rgba(0,255,135,0.2)] hover:border-[#00FF87]"
              : theme === "light"
              ? "bg-white/90 border-[#0B4B2E]/20 text-[#052017] hover:bg-white"
              : "bg-zinc-900/90 border-white/15 text-white hover:border-white/30"
          }`}
          title="Select Theme Gradient Palette"
        >
          <Sun className="h-3.5 w-3.5 text-[#FFC700] animate-spin-slow" />
          <span>{currentGradient.name}</span>
        </button>

        {/* Dropdown Menu for Goa Gradients */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 w-56 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl z-50 text-left ${
                theme === "light"
                  ? "bg-[#FFF7E6] border border-[#0B4B2E]/20 text-[#052017]"
                  : "bg-[#052017]/95 border border-[#1E6F43]/40 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
              }`}
            >
              <div className={`flex items-center gap-1.5 px-2 py-1 mb-1.5 border-b select-none ${
                theme === "light" ? "border-[#0B4B2E]/10" : "border-white/10"
              }`}>
                <Sparkles className="h-3.5 w-3.5 text-[#FFC700]" />
                <span className="text-[10px] font-black uppercase tracking-widest font-heading">
                  Goa Theme Palettes
                </span>
              </div>

              <div className="space-y-1">
                {GRADIENTS.map((g) => {
                  const isSelected = activeGradient === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveGradient(g.id)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer border ${
                        isSelected
                          ? "bg-[#1E6F43]/30 text-white border-[#FFC700]/60 shadow-sm"
                          : theme === "light"
                          ? "hover:bg-white/60 text-[#052017]/80 border-transparent"
                          : "hover:bg-white/5 text-zinc-300 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-md border border-black/20 shadow-sm shrink-0"
                          style={{ background: g.css }}
                        />
                        <span className="text-[11px] font-heading tracking-wide">{g.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#FFC700]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
