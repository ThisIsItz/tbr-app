import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
const COLLAPSE_DURATION = 220;

export function SwipeToDeleteRow({ onDelete, children }: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor({}, 'danger');
  // Tracks the row's real height so we know where to animate from — kept in
  // sync on every layout pass (cover images resolve async and can change it)
  // right up until the collapse starts, at which point we freeze it.
  const height = useSharedValue(-1);
  const scale = useSharedValue(1);
  const isCollapsing = useSharedValue(false);

  function handleLayout(event: LayoutChangeEvent) {
    if (isCollapsing.value) return;
    height.value = event.nativeEvent.layout.height;
  }

  function handleCollapse() {
    isCollapsing.value = true;
    scale.value = withTiming(0, { duration: COLLAPSE_DURATION });
    height.value = withTiming(0, { duration: COLLAPSE_DURATION }, (finished) => {
      if (finished) runOnJS(onDelete)();
    });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    height: isCollapsing.value && height.value >= 0 ? height.value : undefined,
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View onLayout={handleLayout} style={[styles.wrapper, animatedStyle]}>
      <View style={[styles.background, { backgroundColor: dangerColor }]} pointerEvents="none" />
      <View style={styles.iconArea} pointerEvents="none">
        <Trash2 size={20} color="#fff" strokeWidth={2} />
        <ThemedText style={[Typography.caption, styles.actionText]}>{t('common.remove')}</ThemedText>
      </View>
      <ReanimatedSwipeable
        renderRightActions={() => (
          <Pressable
            onPress={handleCollapse}
            accessibilityRole="button"
            accessibilityLabel={t('common.remove')}
            style={styles.action}
          />
        )}
        overshootRight={false}
        rightThreshold={DELETE_THRESHOLD}
        onSwipeableOpen={handleCollapse}>
        {children}
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
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
