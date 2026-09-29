import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  children: ReactNode;
}

const ACTION_WIDTH = 96;

export function SwipeToDeleteRow({ onDelete, children }: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor({}, 'danger');

  return (
    <View style={styles.wrapper}>
      <View style={[styles.iconArea, { backgroundColor: dangerColor }]} pointerEvents="none">
        <Trash2 size={20} color="#fff" strokeWidth={2} />
        <ThemedText style={[Typography.caption, styles.actionText]}>{t('common.remove')}</ThemedText>
      </View>
      <ReanimatedSwipeable
        renderRightActions={() => (
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t('common.remove')}
            style={styles.action}
          />
        )}
        overshootRight={false}
        onSwipeableOpen={onDelete}>
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  iconArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  action: {
    width: ACTION_WIDTH,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
});
