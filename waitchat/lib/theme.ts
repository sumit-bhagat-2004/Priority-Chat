// lib/theme.ts

export type Theme = 'light' | 'dark';

/**
 * Returns theme based on current hour:
 * 06:00–18:00 → light, 18:00–06:00 → dark
 */
export function getTimeBasedTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

/**
 * Apply theme to the HTML element
 */
export function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
