import { AccentColors, Colors } from '@/lib/theme/theme'
import { useAppColorScheme } from '@/hooks/useAppColorScheme'

type BaseColorName = keyof typeof Colors.light & keyof typeof Colors.dark
type AccentPaletteName = 'icon' | 'tabIconDefault'
type AccentAliasName = 'accent' | 'tint' | 'tabIconSelected'
export type ThemeColorName = BaseColorName | AccentPaletteName | AccentAliasName | 'accentSoft' | 'onAccentSoft'

const ACCENT_ALIAS_KEYS = new Set<ThemeColorName>(['accent', 'tint', 'tabIconSelected'])
const ACCENT_PALETTE_KEYS = new Set<ThemeColorName>(['icon', 'tabIconDefault'])

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const { colorScheme: theme, accentPreference } = useAppColorScheme()
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  }

  const palette = AccentColors[accentPreference][theme]

  if (ACCENT_ALIAS_KEYS.has(colorName)) {
    return palette.accent
  }
  if (colorName === 'accentSoft') {
    return palette.accentSoft
  }
  if (colorName === 'onAccentSoft') {
    return palette.onAccentSoft
  }
  if (ACCENT_PALETTE_KEYS.has(colorName)) {
    return palette[colorName as AccentPaletteName]
  }
  return Colors[theme][colorName as BaseColorName]
}
