import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Localization from 'expo-localization';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { Palette } from '@/constants/palette';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { getDb } from '@/lib/db/client';
import { GoogleBooksApiError } from '@/lib/google-books';
import { LanguageProvider } from '@/lib/i18n/language-provider';
import { DEFAULT_LOCALE, detectLocaleFromLanguageCode, type Locale } from '@/lib/i18n/translations';
import { getSetting } from '@/lib/repository/settings-repository';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

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

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialLocale, setInitialLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    (async () => {
      await getDb();
      const saved = await getSetting('locale');
      const locale = isLocale(saved)
        ? saved
        : detectLocaleFromLanguageCode(Localization.getLocales()[0]?.languageCode);
      setInitialLocale(locale);
      setIsReady(true);
    })().finally(() => SplashScreen.hideAsync());
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <RootLayoutNav />
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const colors = Palette[colorScheme ?? 'light'];
  const warmHeaderOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.accent,
    headerTitleStyle: { color: colors.textPrimary },
    headerShadowVisible: false,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="book/[id]"
            options={{ title: t('screenTitles.bookDetails'), ...warmHeaderOptions }}
          />
          <Stack.Screen
            name="add-book"
            options={{ title: t('screenTitles.addBook'), presentation: 'modal', ...warmHeaderOptions }}
          />
          <Stack.Screen
            name="add/[id]"
            options={{ title: t('screenTitles.addToTbr'), presentation: 'modal', ...warmHeaderOptions }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: t('screenTitles.settings'), ...warmHeaderOptions }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
