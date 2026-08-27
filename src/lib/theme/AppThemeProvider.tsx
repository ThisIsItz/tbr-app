import { createContext, useMemo, useState, type ReactNode } from 'react';

import { useColorScheme as useSystemColorScheme } from '@/hooks/useColorScheme';
import { setSetting } from '@/api/repository/settingsRepository';
import { DEFAULT_ACCENT, type AccentName } from '@/lib/theme/theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type AccentPreference = AccentName;

export interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  colorScheme: 'light' | 'dark';
  accentPreference: AccentPreference;
  setAccentPreference: (preference: AccentPreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_SETTING_KEY = 'themePreference';
const ACCENT_SETTING_KEY = 'accentPreference';

interface AppThemeProviderProps {
  initialPreference: ThemePreference;
  initialAccentPreference?: AccentPreference;
  children: ReactNode;
}

export function AppThemeProvider({
  initialPreference,
  initialAccentPreference = DEFAULT_ACCENT,
  children,
}: AppThemeProviderProps) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [themePreference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [accentPreference, setAccentPreferenceState] = useState<AccentPreference>(initialAccentPreference);

  const colorScheme = themePreference === 'system' ? systemScheme : themePreference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      setThemePreference: (preference: ThemePreference) => {
        setPreferenceState(preference);
        void setSetting(THEME_SETTING_KEY, preference);
      },
      colorScheme,
      accentPreference,
      setAccentPreference: (preference: AccentPreference) => {
        setAccentPreferenceState(preference);
        void setSetting(ACCENT_SETTING_KEY, preference);
      },
    }),
    [themePreference, colorScheme, accentPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
