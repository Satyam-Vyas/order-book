export type Theme = "dark" | "light" | "system"

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

