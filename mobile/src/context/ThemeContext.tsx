import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storageGetItem, storageSetItem } from '../api/storage';
import {
  ACCENT,
  COLOR_SCHEME_STORAGE_KEY,
  isColorScheme,
  type ColorScheme,
} from '../theme/colors';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  /** Brand accent hex for interactive chrome */
  accent: string;
  /** Alias of `accent` */
  themeColor: string;
  isBlue: boolean;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('black');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await storageGetItem(COLOR_SCHEME_STORAGE_KEY);
        if (!cancelled && isColorScheme(stored)) {
          setColorSchemeState(stored);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await storageSetItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  }, []);

  const accent = ACCENT[colorScheme] ?? ACCENT.black;

  const value = useMemo(
    (): ThemeContextValue => ({
      colorScheme,
      accent,
      themeColor: accent,
      isBlue: colorScheme === 'blue',
      setColorScheme,
      ready,
    }),
    [accent, colorScheme, ready, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
