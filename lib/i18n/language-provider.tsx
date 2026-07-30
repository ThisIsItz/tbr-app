import { createContext, useMemo, useState, type ReactNode } from 'react';

import { setSetting } from '@/lib/repository/settings-repository';

import { translate, type Locale } from './translations';

export interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

const LOCALE_SETTING_KEY = 'locale';

interface LanguageProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function LanguageProvider({ initialLocale, children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        setLocaleState(next);
        void setSetting(LOCALE_SETTING_KEY, next);
      },
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
