import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, type PaletteColors } from '@/constants/palette';
import { useAppColorScheme } from '@/hooks/use-app-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import type { Locale } from '@/lib/i18n/translations';
import type { ThemePreference } from '@/lib/theme/theme-provider';

const LANGUAGE_OPTIONS: { value: Locale; labelKey: 'settings.english' | 'settings.spanish' }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'es', labelKey: 'settings.spanish' },
];

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  labelKey: 'settings.appearanceSystem' | 'settings.appearanceLight' | 'settings.appearanceDark';
}[] = [
  { value: 'system', labelKey: 'settings.appearanceSystem' },
  { value: 'light', labelKey: 'settings.appearanceLight' },
  { value: 'dark', labelKey: 'settings.appearanceDark' },
];

interface OptionsCardProps<T extends string> {
  options: { value: T; labelKey: string }[];
  selected: T;
  onSelect: (value: T) => void;
  colors: PaletteColors;
  t: (key: string) => string;
}

function OptionsCard<T extends string>({ options, selected, onSelect, colors, t }: OptionsCardProps<T>) {
  return (
    <View style={[styles.optionsCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      {options.map((option, index) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.optionRow,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
            ]}>
            <ThemedText style={{ color: colors.textPrimary, fontWeight: isActive ? '700' : '400' }}>
              {t(option.labelKey)}
            </ThemedText>
            {isActive && <IconSymbol name="checkmark" size={18} color={colors.accent} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { colorScheme, themePreference, setThemePreference } = useAppColorScheme();
  const colors = Palette[colorScheme];
  const { t, locale, setLocale } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>
        {t('settings.language')}
      </ThemedText>
      <OptionsCard options={LANGUAGE_OPTIONS} selected={locale} onSelect={setLocale} colors={colors} t={t} />

      <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>
        {t('settings.appearance')}
      </ThemedText>
      <OptionsCard
        options={APPEARANCE_OPTIONS}
        selected={themePreference}
        onSelect={setThemePreference}
        colors={colors}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  optionsCard: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
  },
});
