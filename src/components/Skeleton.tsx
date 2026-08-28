import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/useThemeColor';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  tint?: string;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, borderRadius = 6, tint, style }: SkeletonProps) {
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: tint ?? surfaceMutedColor }, animatedStyle, style]}
    />
  );
}
