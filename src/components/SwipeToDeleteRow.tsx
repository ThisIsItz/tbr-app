import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { StretchOutY } from 'react-native-reanimated';
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
const DELETE_THRESHOLD = 70;

export function SwipeToDeleteRow({ onDelete, children }: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor({}, 'danger');

  return (
    <Animated.View exiting={StretchOutY.duration(220)} style={styles.wrapper}>
      <View style={[styles.background, { backgroundColor: dangerColor }]} pointerEvents="none" />
      <View style={styles.iconArea} pointerEvents="none">
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
        rightThreshold={DELETE_THRESHOLD}
        onSwipeableOpen={onDelete}>
        {children}
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  background: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    left: 1,
    right: 1,
    borderRadius: 13,
  },
  iconArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
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
