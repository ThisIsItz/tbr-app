import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Localization from 'expo-localization';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppColorScheme } from '@/hooks/use-app-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { getDb } from '@/lib/db/client';
import { GoogleBooksApiError } from '@/lib/google-books';
import { LanguageProvider } from '@/lib/i18n/language-provider';
import { DEFAULT_LOCALE, detectLocaleFromLanguageCode, type Locale } from '@/lib/i18n/translations';
import { getSetting } from '@/lib/repository/settings-repository';
import { AppThemeProvider, type ThemePreference } from '@/lib/theme/theme-provider';

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

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialLocale, setInitialLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [initialThemePreference, setInitialThemePreference] = useState<ThemePreference>('system');

  useEffect(() => {
    (async () => {
      await getDb();
      const [savedLocale, savedTheme] = await Promise.all([
        getSetting('locale'),
        getSetting('themePreference'),
      ]);
      const locale = isLocale(savedLocale)
        ? savedLocale
        : detectLocaleFromLanguageCode(Localization.getLocales()[0]?.languageCode);
      setInitialLocale(locale);
      setInitialThemePreference(isThemePreference(savedTheme) ? savedTheme : 'system');
      setIsReady(true);
    })().finally(() => SplashScreen.hideAsync());
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <AppThemeProvider initialPreference={initialThemePreference}>
        <RootLayoutNav />
      </AppThemeProvider>
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useAppColorScheme();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const warmHeaderOptions = {
    headerStyle: { backgroundColor },
    headerTintColor: accentColor,
    headerTitleStyle: { color: textColor },
    headerShadowVisible: false,
  };
  const modalHeaderOptions = {
    ...warmHeaderOptions,
    presentation: 'modal' as const,
    headerLeft: () => (
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}>
        <IconSymbol name="xmark" size={22} color={accentColor} />
      </Pressable>
    ),
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
            options={{ title: t('screenTitles.addBook'), ...modalHeaderOptions }}
          />
          <Stack.Screen
            name="add/[id]"
            options={{ title: t('screenTitles.addToTbr'), ...modalHeaderOptions }}
          />
          <Stack.Screen
            name="add-manually"
            options={{ title: t('screenTitles.addManually'), ...modalHeaderOptions }}
          />
          <Stack.Screen
            name="scan-isbn"
            options={{ title: t('screenTitles.scanIsbn'), ...modalHeaderOptions }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: t('screenTitles.settings'), ...warmHeaderOptions }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
