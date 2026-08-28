import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Download, Library, Lock, Moon, Sun, Upload } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { AccentColors, Typography, type AccentName } from '@/lib/theme/theme';
import { useExportBackup, useImportBackup } from '@/hooks/useLibrary';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { usePurchases } from '@/hooks/usePurchases';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { BackupFileError } from '@/lib/backup';
import type { Locale } from '@/i18n/translations';
import type { ThemePreference } from '@/lib/theme/AppThemeProvider';

const ACCENT_OPTIONS: {
  value: AccentName;
  labelKey:
    | 'settings.accentOrange'
    | 'settings.accentTeal'
    | 'settings.accentPink'
    | 'settings.accentGreen'
    | 'settings.accentRed';
}[] = [
  { value: 'orange', labelKey: 'settings.accentOrange' },
  { value: 'teal', labelKey: 'settings.accentTeal' },
  { value: 'pink', labelKey: 'settings.accentPink' },
  { value: 'green', labelKey: 'settings.accentGreen' },
  { value: 'red', labelKey: 'settings.accentRed' },
];

const LANGUAGE_OPTIONS: { value: Locale; labelKey: 'settings.english' | 'settings.spanish' }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'es', labelKey: 'settings.spanish' },
];

function SystemAppearanceIcon({ size, color }: { size?: number; color?: string }) {
  return <IconSymbol name="circle.lefthalf.filled" size={size} color={color ?? '#000'} />;
}

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  labelKey: 'settings.appearanceSystem' | 'settings.appearanceLight' | 'settings.appearanceDark';
  icon: (props: { size?: number; color?: string; fill?: string; strokeWidth?: number }) => ReactNode;
}[] = [
  { value: 'system', labelKey: 'settings.appearanceSystem', icon: SystemAppearanceIcon },
  { value: 'light', labelKey: 'settings.appearanceLight', icon: Sun },
  { value: 'dark', labelKey: 'settings.appearanceDark', icon: Moon },
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
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');

  return (
    <View style={[styles.optionsCard, { shadowColor }]}>
      <View style={[styles.optionsCardInner, { backgroundColor: surfaceColor }]}>
        {options.map((option, index) => {
          const isActive = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={t(option.labelKey)}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.optionRow,
                isActive && { backgroundColor: accentSoftColor },
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
              ]}>
              <ThemedText
                style={[
                  Typography.body,
                  { color: isActive ? onAccentSoftColor : textColor, fontWeight: isActive ? '700' : '400' },
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
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');

  return (
    <View style={styles.appearanceRow}>
      {APPEARANCE_OPTIONS.map((option) => {
        const isActive = option.value === selected;
        const Icon = option.icon;
        const iconColor = isActive ? onAccentSoftColor : textMutedColor;
        const isFilled = option.value === 'light' || option.value === 'dark';
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={t(option.labelKey)}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: isActive ? accentSoftColor : surfaceColor,
                borderColor: isActive ? accentColor : 'transparent',
                shadowColor,
              },
            ]}>
            <Icon
              size={22}
              color={iconColor}
              fill={isFilled ? iconColor : 'none'}
              strokeWidth={1.75}
            />
            <ThemedText
              style={[
                Typography.metadata,
                { color: isActive ? onAccentSoftColor : textColor, fontWeight: isActive ? '700' : '500' },
              ]}>
              {t(option.labelKey)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function AccentCards({
  selected,
  onSelect,
  t,
}: {
  selected: AccentName;
  onSelect: (value: AccentName) => void;
  t: (key: string) => string;
}) {
  const { colorScheme } = useAppColorScheme();
  const surfaceColor = useThemeColor({}, 'surface');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.accentGrid}>
      {ACCENT_OPTIONS.map((option) => {
        const isActive = option.value === selected;
        const palette = AccentColors[option.value][colorScheme];
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={t(option.labelKey)}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.accentCard,
              {
                backgroundColor: isActive ? palette.accentSoft : surfaceColor,
                borderColor: isActive ? palette.accent : 'transparent',
                shadowColor,
              },
            ]}>
            <View style={[styles.accentSwatch, { backgroundColor: palette.accent }]} />
            <ThemedText
              style={[
                Typography.metadata,
                { color: isActive ? palette.onAccentSoft : textColor, fontWeight: isActive ? '700' : '500' },
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
  const { themePreference, setThemePreference, accentPreference, setAccentPreference } = useAppColorScheme();
  const { isPro } = usePurchases();
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
          {t('settings.accentColor')}
        </ThemedText>
        {isPro ? (
          <AccentCards selected={accentPreference} onSelect={setAccentPreference} t={t} />
        ) : (
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            accessibilityLabel={t('paywall.unlockButton')}
            style={styles.lockedSection}>
            <View pointerEvents="none" style={styles.lockedPreview}>
              <AccentCards selected={accentPreference} onSelect={() => {}} t={t} />
            </View>
            <View style={styles.lockBadge} pointerEvents="none">
              <View style={[styles.lockPill, { backgroundColor: surfaceColor, shadowColor }]}>
                <Lock size={16} color={textColor} strokeWidth={1.75} />
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('paywall.unlockButton')}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        )}

        <ThemedText style={[Typography.sectionTitle, styles.sectionLabel, { color: textColor }]}>
          {t('settings.data')}
        </ThemedText>
        <View style={[styles.optionsCard, { shadowColor }]}>
          <View style={[styles.optionsCardInner, { backgroundColor: surfaceColor }]}>
            <Pressable
              onPress={handleExport}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={t('settings.exportBackup')}
              accessibilityHint={t('settings.exportBackupDescription')}
              style={styles.dataRow}>
              <Upload size={20} color={textColor} strokeWidth={1.75} />
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
              accessibilityRole="button"
              accessibilityLabel={t('settings.importBackup')}
              accessibilityHint={t('settings.importBackupDescription')}
              style={[styles.dataRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }]}>
              <Download size={20} color={textColor} strokeWidth={1.75} />
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

        <ThemedText style={[Typography.sectionTitle, styles.sectionLabel, { color: textColor }]}>
          {t('settings.about')}
        </ThemedText>
        <View style={[styles.optionsCard, { shadowColor }]}>
          <View style={[styles.optionsCardInner, { backgroundColor: surfaceColor }]}>
            <Pressable
              onPress={() => Linking.openURL('https://www.flaticon.com/free-icons/library')}
              accessibilityRole="link"
              accessibilityLabel={t('settings.appIcon')}
              accessibilityHint={t('settings.iconAttribution')}
              style={styles.dataRow}>
              <Library size={20} color={textColor} strokeWidth={1.75} />
              <View style={styles.dataRowText}>
                <ThemedText style={[Typography.body, { color: textColor }]}>
                  {t('settings.appIcon')}
                </ThemedText>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {t('settings.iconAttribution')}
                </ThemedText>
              </View>
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
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accentCard: {
    width: '31%',
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
  accentSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  lockedSection: {
    position: 'relative',
  },
  lockedPreview: {
    opacity: 0.35,
  },
  lockBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
});
