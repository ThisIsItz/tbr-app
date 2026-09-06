import type { AnimatedKeyboardOptions } from 'react-native-reanimated';

// The app renders edge-to-edge (app.json: edgeToEdgeEnabled), so both system bars are
// translucent. Without telling reanimated that, useAnimatedKeyboard() miscalculates the
// keyboard height on Android and silently reports 0, breaking every screen that relies on it.
export const ANIMATED_KEYBOARD_OPTIONS: AnimatedKeyboardOptions = {
  isStatusBarTranslucentAndroid: true,
  isNavigationBarTranslucentAndroid: true,
};
