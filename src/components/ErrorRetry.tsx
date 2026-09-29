import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { Typography } from '@/lib/theme/theme';

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  const { t } = useTranslation();
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');

  return (
    <>
      <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>{message}</ThemedText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('common.retry')}
        style={[styles.retryButton, { backgroundColor: accentColor }]}>
        <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('common.retry')}</ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  centeredText: {
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
});
