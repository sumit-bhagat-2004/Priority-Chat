'use client';
// hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';
import { getTimeBasedTheme, applyTheme, type Theme } from '@/lib/theme';

const THEME_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    const initial = getTimeBasedTheme();
    setThemeState(initial);
    applyTheme(initial);

    const interval = setInterval(() => {
      if (!manualOverride) {
        const newTheme = getTimeBasedTheme();
        setThemeState(prev => {
          if (prev !== newTheme) applyTheme(newTheme);
          return newTheme;
        });
      }
    }, THEME_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [manualOverride]);

  const toggleTheme = useCallback(() => {
    setManualOverride(true);
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const resetToAuto = useCallback(() => {
    setManualOverride(false);
    const auto = getTimeBasedTheme();
    setThemeState(auto);
    applyTheme(auto);
  }, []);

  return { theme, toggleTheme, manualOverride, resetToAuto };
}
