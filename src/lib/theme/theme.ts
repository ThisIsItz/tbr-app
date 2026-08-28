import { Platform } from 'react-native'

// Tokens that don't carry any hue bias and stay the same across every accent.
export const Colors = {
  light: {
    text: '#241C17',
    textMuted: '#74685E',
    shadow: 'rgba(36, 28, 23, 0.10)',
    danger: '#B83A32',
    // Text/icon color for anything drawn on top of an accent-colored surface (buttons).
    onAccent: '#FFFFFF'
  },

  dark: {
    text: '#F5EFE8',
    textMuted: '#AAA096',
    shadow: 'rgba(0, 0, 0, 0.45)',
    danger: '#E26458',
    // Dark accents are bright, so white text on them fails contrast — use dark ink instead.
    onAccent: '#1A1310'
  }
} as const

// Accent hues sampled from the app icon's three book spines. Each accent also carries
// its own tinted neutrals (background/surface/surfaceMuted/border/icon) so the warm or
// cool undertone of the accent runs through the whole screen, cards included, not just
// the buttons.
export type AccentName = 'orange' | 'teal' | 'pink' | 'green' | 'red'

interface AccentPalette {
  accent: string
  accentSoft: string
  // Text/icon color for content drawn on top of accentSoft (chips, selected cards).
  // Kept separate from `accent` because accentSoft needs to stay visibly tinted —
  // making accentSoft pale enough for `accent` text to pass AA on it made it blend
  // into white, so the on-soft text goes darker/richer instead.
  onAccentSoft: string
  background: string
  surface: string
  surfaceMuted: string
  border: string
  icon: string
  tabIconDefault: string
}

export const AccentColors: Record<AccentName, { light: AccentPalette; dark: AccentPalette }> = {
  orange: {
    light: {
      accent: '#AB551C',
      accentSoft: '#EACCB8',
      onAccentSoft: '#8A400F',
      background: '#F8F2ED',
      surface: '#FFFFFF',
      surfaceMuted: '#EEE6DD',
      border: '#E4D9CE',
      icon: '#73695E',
      tabIconDefault: '#8C8278'
    },
    dark: {
      accent: '#EA762A',
      accentSoft: '#3B281C',
      onAccentSoft: '#EA762A',
      background: '#15120F',
      surface: '#211C18',
      surfaceMuted: '#2C2621',
      border: '#413830',
      icon: '#ABA196',
      tabIconDefault: '#847A71'
    }
  },
  teal: {
    light: {
      accent: '#17798C',
      accentSoft: '#B8E2EA',
      onAccentSoft: '#0D6677',
      background: '#EDF6F8',
      surface: '#FFFFFF',
      surfaceMuted: '#DDEBEE',
      border: '#CEE0E4',
      icon: '#5E7073',
      tabIconDefault: '#78898C'
    },
    dark: {
      accent: '#19C4E6',
      accentSoft: '#1C353B',
      onAccentSoft: '#19C4E6',
      background: '#0F1415',
      surface: '#181F21',
      surfaceMuted: '#212A2C',
      border: '#303E41',
      icon: '#96A8AB',
      tabIconDefault: '#718184'
    }
  },
  pink: {
    light: {
      accent: '#C5204C',
      accentSoft: '#EAB8C5',
      onAccentSoft: '#9A1337',
      background: '#F8EDEF',
      surface: '#FFFFFF',
      surfaceMuted: '#EEDDE0',
      border: '#E4CED1',
      icon: '#735E62',
      tabIconDefault: '#8C787B'
    },
    dark: {
      accent: '#EB5C82',
      accentSoft: '#3B1C24',
      onAccentSoft: '#EB5C82',
      background: '#150F10',
      surface: '#211819',
      surfaceMuted: '#2C2122',
      border: '#413032',
      icon: '#AB969A',
      tabIconDefault: '#847174'
    }
  },
  green: {
    light: {
      accent: '#2E5E3F',
      accentSoft: '#C6DFCA',
      onAccentSoft: '#1F4A2C',
      background: '#EFF5EF',
      surface: '#FFFFFF',
      surfaceMuted: '#E3EDE4',
      border: '#D5E4D6',
      icon: '#63756A',
      tabIconDefault: '#7F9184'
    },
    dark: {
      accent: '#4CBB6C',
      accentSoft: '#1E3A28',
      onAccentSoft: '#4CBB6C',
      background: '#0F1512',
      surface: '#1A211D',
      surfaceMuted: '#242E27',
      border: '#37423A',
      icon: '#9AAB9E',
      tabIconDefault: '#7C8C80'
    }
  },
  red: {
    light: {
      accent: '#7A2A34',
      accentSoft: '#E6C3C7',
      onAccentSoft: '#5C1F27',
      background: '#F9F0F0',
      surface: '#FFFFFF',
      surfaceMuted: '#EFDEDF',
      border: '#E5D0D1',
      icon: '#7A6264',
      tabIconDefault: '#8F797B'
    },
    dark: {
      accent: '#EE5A64',
      accentSoft: '#3B1E20',
      onAccentSoft: '#EE5A64',
      background: '#160F0F',
      surface: '#221819',
      surfaceMuted: '#2D2122',
      border: '#423031',
      icon: '#AC9698',
      tabIconDefault: '#857274'
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
