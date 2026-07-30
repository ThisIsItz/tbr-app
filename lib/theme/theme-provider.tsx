import { createContext, useMemo, useState, type ReactNode } from 'react';

import { useColorScheme as useSystemColorScheme } from '@/hooks/use-color-scheme';
import { setSetting } from '@/lib/repository/settings-repository';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  colorScheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_SETTING_KEY = 'themePreference';

interface AppThemeProviderProps {
  initialPreference: ThemePreference;
  children: ReactNode;
}

export function AppThemeProvider({ initialPreference, children }: AppThemeProviderProps) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [themePreference, setPreferenceState] = useState<ThemePreference>(initialPreference);

  const colorScheme = themePreference === 'system' ? systemScheme : themePreference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      setThemePreference: (preference: ThemePreference) => {
        setPreferenceState(preference);
        void setSetting(THEME_SETTING_KEY, preference);
      },
      colorScheme,
    }),
    [themePreference, colorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
