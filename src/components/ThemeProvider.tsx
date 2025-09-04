import { createContext, useContext, useEffect, useState } from "react"
import { useAuthSafe } from "@/contexts/AuthContext"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { user, updateUserPreferences } = useAuthSafe()
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // Load theme from user preferences or localStorage
  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme)
    } else {
      const storedTheme = localStorage.getItem(storageKey) as Theme
      if (storedTheme && ["dark", "light", "system"].includes(storedTheme)) {
        setTheme(storedTheme)
      }
    }
  }, [user?.preferences?.theme, storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: async (newTheme: Theme) => {
      setTheme(newTheme)
      
      // Save to user preferences if user is logged in and updateUserPreferences is available
      if (user && updateUserPreferences) {
        try {
          await updateUserPreferences({ theme: newTheme })
        } catch (error) {
          console.warn('Failed to save theme to user preferences:', error)
          // Fallback to localStorage
          localStorage.setItem(storageKey, newTheme)
        }
      } else {
        // Fallback to localStorage for non-authenticated users or when auth context isn't available
        localStorage.setItem(storageKey, newTheme)
      }
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

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}