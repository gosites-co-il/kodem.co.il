'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { THEME_STORAGE_KEY } from './theme-script';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme?: ThemeSetting;
  resolvedTheme?: ResolvedTheme;
  setTheme: (theme: ThemeSetting) => void;
  themes: ThemeSetting[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  return setting === 'system' ? getSystemTheme() : setting;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function readStoredTheme(): ThemeSetting {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef<ThemeSetting>('system');

  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = resolveTheme(stored);
    themeRef.current = stored;
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemChange() {
      if (themeRef.current !== 'system') return;
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyTheme(next);
    }

    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const setTheme = useCallback((next: ThemeSetting) => {
    themeRef.current = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const resolved = resolveTheme(next);
    setThemeState(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const value = useMemo(
    () => ({
      theme: mounted ? theme : undefined,
      resolvedTheme: mounted ? resolvedTheme : undefined,
      setTheme,
      themes: ['light', 'dark', 'system'] as ThemeSetting[],
    }),
    [mounted, theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
