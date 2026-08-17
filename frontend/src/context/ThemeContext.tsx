import React, { createContext, useContext, useEffect, useState } from "react"

export type GoaGradient = "palm-sunset" | "ocean-breeze" | "tropical-vibes" | "goa-night"
export type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  activeGradient: GoaGradient
  lightGradient: GoaGradient
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setActiveGradient: (gradient: GoaGradient) => void
  setLightGradient: (gradient: GoaGradient) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY = "hhgoa_theme"
const GRADIENT_KEY = "hhgoa_active_gradient"

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return (saved === "light" || saved === "dark") ? saved : "dark"
  })

  const [activeGradient, setActiveGradientState] = useState<GoaGradient>(() => {
    const saved = localStorage.getItem(GRADIENT_KEY)
    if (saved === "palm-sunset" || saved === "ocean-breeze" || saved === "tropical-vibes" || saved === "goa-night") {
      return saved
    }
    return "goa-night"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light-theme")
      root.classList.remove("dark")
      root.setAttribute("data-theme", "light")
    } else {
      root.classList.remove("light-theme")
      root.classList.add("dark")
      root.setAttribute("data-theme", "dark")
    }
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-gradient", activeGradient)
    localStorage.setItem(GRADIENT_KEY, activeGradient)
  }, [activeGradient])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const setActiveGradient = (gradient: GoaGradient) => {
    setActiveGradientState(gradient)
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        activeGradient, 
        lightGradient: activeGradient, 
        toggleTheme, 
        setTheme, 
        setActiveGradient, 
        setLightGradient: setActiveGradient 
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
