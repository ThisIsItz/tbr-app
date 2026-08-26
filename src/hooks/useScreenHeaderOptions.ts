import { useThemeColor } from '@/hooks/useThemeColor';

// Shared native-stack header look (used by every pushed screen, e.g. Settings and Book Details).
export function useScreenHeaderOptions() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');

  return {
    headerStyle: { backgroundColor },
    headerTintColor: accentColor,
    headerTitleStyle: { color: textColor },
    headerShadowVisible: false,
  };
}
