import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/palette';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import type { Locale } from '@/lib/i18n/translations';

const LANGUAGE_OPTIONS: { value: Locale; labelKey: 'settings.english' | 'settings.spanish' }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'es', labelKey: 'settings.spanish' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];
  const { t, locale, setLocale } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>
        {t('settings.language')}
      </ThemedText>

      <View style={[styles.optionsCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        {LANGUAGE_OPTIONS.map((option, index) => {
          const isActive = option.value === locale;
          return (
            <Pressable
              key={option.value}
              onPress={() => setLocale(option.value)}
              style={[
                styles.optionRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}>
              <ThemedText
                style={{
                  color: colors.textPrimary,
                  fontWeight: isActive ? '700' : '400',
                }}>
                {t(option.labelKey)}
              </ThemedText>
              {isActive && <IconSymbol name="checkmark" size={18} color={colors.accent} />}
            </Pressable>
          );
        })}
      </View>
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
