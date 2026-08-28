import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import * as Localization from 'expo-localization';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useScreenHeaderOptions } from '@/hooks/useScreenHeaderOptions';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useTranslation } from '@/hooks/useTranslation';
import { getDb } from '@/api/db/client';
import { GoogleBooksApiError } from '@/api/googleBooks';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { DEFAULT_LOCALE, detectLocaleFromLanguageCode, type Locale } from '@/i18n/translations';
import { getSetting } from '@/api/repository/settingsRepository';
import { AppThemeProvider, type AccentPreference, type ThemePreference } from '@/lib/theme/AppThemeProvider';
import { DEFAULT_ACCENT } from '@/lib/theme/theme';
import { PurchasesProvider } from '@/lib/purchases/PurchasesProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.2,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof GoogleBooksApiError && error.status === 429) return false;
        return failureCount < 2;
      },
    },
  },
});

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'es';
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isAccentPreference(value: string | null): value is AccentPreference {
  return value === 'orange' || value === 'teal' || value === 'pink';
}

function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialLocale, setInitialLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [initialThemePreference, setInitialThemePreference] = useState<ThemePreference>('system');
  const [initialAccentPreference, setInitialAccentPreference] = useState<AccentPreference>(DEFAULT_ACCENT);

  useEffect(() => {
    (async () => {
      await getDb();
      const [savedLocale, savedTheme, savedAccent] = await Promise.all([
        getSetting('locale'),
        getSetting('themePreference'),
        getSetting('accentPreference'),
      ]);
      const locale = isLocale(savedLocale)
        ? savedLocale
        : detectLocaleFromLanguageCode(Localization.getLocales()[0]?.languageCode);
      setInitialLocale(locale);
      setInitialThemePreference(isThemePreference(savedTheme) ? savedTheme : 'system');
      setInitialAccentPreference(isAccentPreference(savedAccent) ? savedAccent : DEFAULT_ACCENT);
      setIsReady(true);
    })().finally(() => SplashScreen.hideAsync());
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <AppThemeProvider
        initialPreference={initialThemePreference}
        initialAccentPreference={initialAccentPreference}>
        <PurchasesProvider>
          <RootLayoutNav />
        </PurchasesProvider>
      </AppThemeProvider>
    </LanguageProvider>
  );
}

export default Sentry.wrap(RootLayout);

function RootLayoutNav() {
  const { colorScheme } = useAppColorScheme();
  const { t } = useTranslation();
  const screenHeaderOptions = useScreenHeaderOptions();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="book/[id]"
            options={{ title: t('screenTitles.bookDetails'), ...screenHeaderOptions }}
          />
          <Stack.Screen
            name="add/book"
            options={{ title: t('screenTitles.addBook'), ...screenHeaderOptions }}
          />
          <Stack.Screen
            name="add/[id]"
            options={{ title: t('screenTitles.addToTbr'), ...screenHeaderOptions }}
          />
          <Stack.Screen
            name="add/manually"
            options={{ title: t('screenTitles.addManually'), ...screenHeaderOptions }}
          />
          <Stack.Screen
            name="add/scan-isbn"
            options={{ title: t('screenTitles.scanIsbn'), ...screenHeaderOptions }}
          />
          <Stack.Screen
            name="settings/index"
            options={{ title: t('screenTitles.settings'), ...screenHeaderOptions }}
          />
          <Stack.Screen name="spin" options={{ title: t('screenTitles.spin'), ...screenHeaderOptions }} />
          <Stack.Screen
            name="paywall"
            options={{ title: t('screenTitles.paywall'), ...screenHeaderOptions }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
