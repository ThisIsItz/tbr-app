import { Platform } from 'react-native'

// Tokens that don't carry any hue bias and stay the same across every accent —
// backgrounds, cards, and inputs read as neutral gray so they don't compete
// with whichever accent is active; only buttons/icons/badges carry the hue.
export const Colors = {
  light: {
    text: '#241C17',
    textMuted: '#6E6259',
    shadow: 'rgba(36, 28, 23, 0.10)',
    danger: '#B83A32',
    onAccent: '#FFFFFF',
    background: '#F8F8F8',
    surface: '#FFFFFF',
    surfaceMuted: '#E7E7E7',
    border: '#DADADA'
  },

  dark: {
    text: '#F5EFE8',
    textMuted: '#AAA096',
    shadow: 'rgba(0, 0, 0, 0.45)',
    danger: '#E26458',
    onAccent: '#1A1310',
    background: '#141414',
    surface: '#1F1F1F',
    surfaceMuted: '#292929',
    border: '#3D3D3D'
  }
} as const

export type AccentName = 'orange' | 'teal' | 'green' | 'red'

interface AccentPalette {
  accent: string
  accentSoft: string
  // Text/icon color for content drawn on top of accentSoft (chips, selected cards).
  // Kept separate from `accent` because accentSoft needs to stay visibly tinted —
  // making accentSoft pale enough for `accent` text to pass AA on it made it blend
  // into white, so the on-soft text goes darker/richer instead.
  onAccentSoft: string
  icon: string
  tabIconDefault: string
}

export const AccentColors: Record<AccentName, { light: AccentPalette; dark: AccentPalette }> = {
  orange: {
    light: {
      accent: '#AB551C',
      accentSoft: '#EACCB8',
      onAccentSoft: '#8A400F',
      icon: '#73695E',
      tabIconDefault: '#8C8278'
    },
    dark: {
      accent: '#EA762A',
      accentSoft: '#3B281C',
      onAccentSoft: '#EA762A',
      icon: '#ABA196',
      tabIconDefault: '#847A71'
    }
  },
  teal: {
    light: {
      accent: '#1F3A5F',
      accentSoft: '#C2D3E3',
      onAccentSoft: '#16283F',
      icon: '#5C697A',
      tabIconDefault: '#77869A'
    },
    dark: {
      accent: '#4A8FE0',
      accentSoft: '#162331',
      onAccentSoft: '#4A8FE0',
      icon: '#98A8BC',
      tabIconDefault: '#71829A'
    }
  },
  green: {
    light: {
      accent: '#2E5E3F',
      accentSoft: '#C6DFCA',
      onAccentSoft: '#1F4A2C',
      icon: '#63756A',
      tabIconDefault: '#7F9184'
    },
    dark: {
      accent: '#4CBB6C',
      accentSoft: '#1E3A28',
      onAccentSoft: '#4CBB6C',
      icon: '#9AAB9E',
      tabIconDefault: '#7C8C80'
    }
  },
  red: {
    light: {
      accent: '#8B1E1E',
      accentSoft: '#E8C7C7',
      onAccentSoft: '#5C1414',
      icon: '#7D6362',
      tabIconDefault: '#927A79'
    },
    dark: {
      accent: '#EF5257',
      accentSoft: '#2E1717',
      onAccentSoft: '#EF5257',
      icon: '#AF9998',
      tabIconDefault: '#897372'
    }
  }
}

export const DEFAULT_ACCENT: AccentName = 'orange'

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
    fontSize: 19,
    lineHeight: 24,
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
