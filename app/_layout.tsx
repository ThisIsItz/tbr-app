import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { Palette } from '@/constants/palette';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDb } from '@/lib/db/client';
import { GoogleBooksApiError } from '@/lib/google-books';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    getDb()
      .then(() => setIsDbReady(true))
      .finally(() => SplashScreen.hideAsync());
  }, []);

  if (!isDbReady) {
    return null;
  }

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
            options={{ title: 'Book Details', ...warmHeaderOptions }}
          />
          <Stack.Screen
            name="add-book"
            options={{ title: 'Add a Book', presentation: 'modal', ...warmHeaderOptions }}
          />
          <Stack.Screen
            name="add/[id]"
            options={{ title: 'Add to My TBR', presentation: 'modal', ...warmHeaderOptions }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
