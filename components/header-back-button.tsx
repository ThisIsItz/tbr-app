import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';

export function HeaderBackButton() {
  const accentColor = useThemeColor({}, 'accent');
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}>
      <IconSymbol name="chevron.left" size={24} color={accentColor} />
    </Pressable>
  );
}
