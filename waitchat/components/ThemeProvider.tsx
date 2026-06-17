'use client';
// components/ThemeProvider.tsx
import { createContext, useContext, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  manualOverride: boolean;
  resetToAuto: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  manualOverride: false,
  resetToAuto: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeData = useTheme();

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
