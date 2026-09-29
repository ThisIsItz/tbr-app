import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  children: ReactNode;
}

export function SwipeToDeleteRow({ onDelete, children }: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor({}, 'danger');

  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={t('common.remove')}
          style={[styles.action, { backgroundColor: dangerColor }]}>
          <Trash2 size={20} color="#fff" strokeWidth={2} />
          <ThemedText style={[Typography.caption, styles.actionText]}>{t('common.remove')}</ThemedText>
        </Pressable>
      )}
      overshootRight={false}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
});
