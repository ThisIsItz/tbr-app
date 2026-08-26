import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useExportBackup, useImportBackup } from '@/features/library/hooks';
import { useAppColorScheme } from '@/hooks/use-app-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { BackupFileError } from '@/lib/backup';
import type { Locale } from '@/lib/i18n/translations';
import type { ThemePreference } from '@/lib/theme/theme-provider';

const LANGUAGE_OPTIONS: { value: Locale; labelKey: 'settings.english' | 'settings.spanish' }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'es', labelKey: 'settings.spanish' },
];

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  labelKey: 'settings.appearanceSystem' | 'settings.appearanceLight' | 'settings.appearanceDark';
  icon: IconSymbolName;
}[] = [
  { value: 'system', labelKey: 'settings.appearanceSystem', icon: 'circle.lefthalf.filled' },
  { value: 'light', labelKey: 'settings.appearanceLight', icon: 'sun.max.fill' },
  { value: 'dark', labelKey: 'settings.appearanceDark', icon: 'moon.fill' },
];

interface OptionsCardProps<T extends string> {
  options: { value: T; labelKey: string }[];
  selected: T;
  onSelect: (value: T) => void;
  t: (key: string) => string;
}

function OptionsCard<T extends string>({ options, selected, onSelect, t }: OptionsCardProps<T>) {
  const surfaceColor = useThemeColor({}, 'surface');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  return (
    <View style={[styles.optionsCard, { shadowColor }]}>
      <View style={[styles.optionsCardInner, { backgroundColor: surfaceColor }]}>
        {options.map((option, index) => {
          const isActive = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[
                styles.optionRow,
                isActive && { backgroundColor: accentSoftColor },
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
              ]}>
              <ThemedText
                style={[
                  Typography.body,
                  { color: isActive ? accentColor : textColor, fontWeight: isActive ? '700' : '400' },
                ]}>
                {t(option.labelKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AppearanceCards({
  selected,
  onSelect,
  t,
}: {
  selected: ThemePreference;
  onSelect: (value: ThemePreference) => void;
  t: (key: string) => string;
}) {
  const surfaceColor = useThemeColor({}, 'surface');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');

  return (
    <View style={styles.appearanceRow}>
      {APPEARANCE_OPTIONS.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: isActive ? accentSoftColor : surfaceColor,
                borderColor: isActive ? accentColor : 'transparent',
                shadowColor,
              },
            ]}>
            <IconSymbol name={option.icon} size={22} color={isActive ? accentColor : textMutedColor} />
            <ThemedText
              style={[
                Typography.metadata,
                { color: isActive ? accentColor : textColor, fontWeight: isActive ? '700' : '500' },
              ]}>
              {t(option.labelKey)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { themePreference, setThemePreference } = useAppColorScheme();
  const { t, locale, setLocale } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');
  const accentColor = useThemeColor({}, 'accent');

  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  async function handleExport() {
    try {
      await exportBackup.mutateAsync();
    } catch {
      Alert.alert(t('settings.exportError'));
    }
  }

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync();
    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    try {
      const { imported, skipped } = await importBackup.mutateAsync(uri);
      Alert.alert(
        t('settings.importSuccessTitle'),
        t('settings.importSuccessBody', { imported, skipped }),
      );
    } catch (error) {
      Alert.alert(
        t('settings.importErrorTitle'),
        error instanceof BackupFileError ? t('settings.importInvalidFile') : t('common.genericError'),
      );
    }
  }

  const isBusy = exportBackup.isPending || importBackup.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[Typography.sectionTitle, styles.sectionLabel, { color: textColor }]}>
          {t('settings.language')}
        </ThemedText>
        <OptionsCard options={LANGUAGE_OPTIONS} selected={locale} onSelect={setLocale} t={t} />

        <ThemedText style={[Typography.sectionTitle, styles.sectionLabel, { color: textColor }]}>
          {t('settings.appearance')}
        </ThemedText>
        <AppearanceCards selected={themePreference} onSelect={setThemePreference} t={t} />

        <ThemedText style={[Typography.sectionTitle, styles.sectionLabel, { color: textColor }]}>
          {t('settings.data')}
        </ThemedText>
        <View style={[styles.optionsCard, { shadowColor }]}>
          <View style={[styles.optionsCardInner, { backgroundColor: surfaceColor }]}>
            <Pressable onPress={handleExport} disabled={isBusy} style={styles.dataRow}>
              <IconSymbol name="square.and.arrow.up" size={20} color={textColor} />
              <View style={styles.dataRowText}>
                <ThemedText style={[Typography.body, { color: textColor }]}>
                  {t('settings.exportBackup')}
                </ThemedText>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {t('settings.exportBackupDescription')}
                </ThemedText>
              </View>
              {exportBackup.isPending && <ActivityIndicator size="small" color={accentColor} />}
            </Pressable>
            <Pressable
              onPress={handleImport}
              disabled={isBusy}
              style={[styles.dataRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }]}>
              <IconSymbol name="tray.and.arrow.down" size={20} color={textColor} />
              <View style={styles.dataRowText}>
                <ThemedText style={[Typography.body, { color: textColor }]}>
                  {t('settings.importBackup')}
                </ThemedText>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {t('settings.importBackupDescription')}
                </ThemedText>
              </View>
              {importBackup.isPending && <ActivityIndicator size="small" color={accentColor} />}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  sectionLabel: {
    marginTop: 8,
  },
  optionsCard: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  optionsCardInner: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dataRowText: {
    flex: 1,
    gap: 2,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appearanceCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
});
