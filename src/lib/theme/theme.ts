/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native'

const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'

export const Colors = {
  light: {
    background: '#F8F4EE',
    surface: '#FFFFFF',
    surfaceMuted: '#EEE7DE',

    text: '#241C17',
    textMuted: '#74685E',

    accent: '#B85635',
    accentSoft: '#F4DED2',
    tint: '#B85635',

    border: '#E3D8CC',
    icon: '#74685E',

    tabIconDefault: '#8B8178',
    tabIconSelected: '#B85635',

    shadow: 'rgba(36, 28, 23, 0.10)',
    danger: '#B83A32'
  },

  dark: {
    background: '#15120F',
    surface: '#211C18',
    surfaceMuted: '#2B2520',

    text: '#F5EFE8',
    textMuted: '#AAA096',

    accent: '#E98A5B',
    accentSoft: '#44291D',
    tint: '#E98A5B',

    border: '#40372F',
    icon: '#AAA096',

    tabIconDefault: '#857B72',
    tabIconSelected: '#E98A5B',

    shadow: 'rgba(0, 0, 0, 0.45)',
    danger: '#E26458'
  }
} as const

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace'
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace'
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace'
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  }
})

export const Typography = {
  screenTitle: {
    fontFamily: Fonts.sans,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const
  },
  bookTitle: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as const
  },
  metadata: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400' as const
  },
  button: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const
  }
}
