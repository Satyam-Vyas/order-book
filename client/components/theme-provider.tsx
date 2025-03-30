"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { Theme, ThemeProviderProps, ThemeProviderState } from "@/types/themeTypes"

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}
const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or default
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    } else if (enableSystem) {
      setTheme("system")
    }
    setMounted(true)
  }, [enableSystem, storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove previous theme attributes
    root.removeAttribute(attribute)

    // Handle system theme preference
    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
      return
    }

    root.classList.remove("light", "dark")
    root.classList.add(theme)

    if (disableTransitionOnChange) {
      document.documentElement.classList.add("[&_*]:!transition-none")
      window.setTimeout(() => {
        document.documentElement.classList.remove("[&_*]:!transition-none")
      }, 0)
    }
  }, [theme, mounted, attribute, enableSystem, disableTransitionOnChange])

  if (!mounted) {
    return <>{children}</>
  }

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}

