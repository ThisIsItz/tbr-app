import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  children: ReactNode;
}

const ACTION_WIDTH = 140;
// Duration scales with the row's real height so a tall card collapses at
// roughly the same visual speed as a short list row instead of feeling rushed.
const MIN_COLLAPSE_DURATION = 220;
const MAX_COLLAPSE_DURATION = 300;
const REFERENCE_HEIGHT = 80;

function RightActionIcon({
  showRightProgress,
  rowWidth,
  label,
}: {
  showRightProgress: SharedValue<number>;
  rowWidth: SharedValue<number>;
  label: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          showRightProgress.value,
          [0, 1],
          [0, rowWidth.value > 0 ? -(rowWidth.value - ACTION_WIDTH) / 2 : 0],
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.iconArea, animatedStyle]} pointerEvents="none">
      <Trash2 size={20} color="#fff" strokeWidth={2} />
      <ThemedText style={[Typography.caption, styles.actionText]}>{label}</ThemedText>
    </Animated.View>
  );
}

export function SwipeToDeleteRow({ onDelete, children }: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor({}, 'danger');
  // Tracks the row's real size so we know where to animate from — kept in
  // sync on every layout pass (cover images resolve async and can change
  // height) right up until the collapse starts, at which point we freeze it.
  const height = useSharedValue(-1);
  const width = useSharedValue(-1);
  const scale = useSharedValue(1);
  const isCollapsing = useSharedValue(false);

  function handleLayout(event: LayoutChangeEvent) {
    if (isCollapsing.value) return;
    height.value = event.nativeEvent.layout.height;
    width.value = event.nativeEvent.layout.width;
  }

  function handleCollapse() {
    isCollapsing.value = true;
    const duration = Math.min(
      MAX_COLLAPSE_DURATION,
      Math.max(MIN_COLLAPSE_DURATION, (height.value / REFERENCE_HEIGHT) * MIN_COLLAPSE_DURATION),
    );
    scale.value = withTiming(0, { duration });
    height.value = withTiming(0, { duration }, (finished) => {
      if (finished) runOnJS(onDelete)();
    });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    height: isCollapsing.value && height.value >= 0 ? height.value : undefined,
    overflow: isCollapsing.value ? 'hidden' : 'visible',
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View onLayout={handleLayout} style={[styles.wrapper, animatedStyle]}>
      <View style={[styles.background, { backgroundColor: dangerColor }]} pointerEvents="none" />
      <ReanimatedSwipeable
        renderRightActions={(showRightProgress) => (
          <>
            <Pressable
              onPress={handleCollapse}
              accessibilityRole="button"
              accessibilityLabel={t('common.remove')}
              style={styles.action}
            />
            <RightActionIcon showRightProgress={showRightProgress} rowWidth={width} label={t('common.remove')} />
          </>
        )}
        overshootRight={false}
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
    width: '100%',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
});
