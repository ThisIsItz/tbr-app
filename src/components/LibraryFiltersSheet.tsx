import { SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { getLanguageName } from '@/lib/languageNames';
import { Typography } from '@/lib/theme/theme';
import { capitalizeFirst } from '@/lib/capitalize';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';

interface LibraryFiltersSheetProps {
  genreOptions: string[];
  genreLabels?: Record<string, string>;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  authorOptions: string[];
  selectedAuthor: string | null;
  onAuthorChange: (author: string | null) => void;
  languageOptions: string[];
  selectedLanguage: string | null;
  onLanguageChange: (language: string | null) => void;
  disabled?: boolean;
}

export function LibraryFiltersSheet({
  genreOptions,
  genreLabels,
  selectedGenres,
  onGenresChange,
  authorOptions,
  selectedAuthor,
  onAuthorChange,
  languageOptions,
  selectedLanguage,
  onLanguageChange,
  disabled,
}: LibraryFiltersSheetProps) {
  const { t, locale } = useTranslation();
  const [visible, setVisible] = useState(false);

  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const dangerColor = useThemeColor({}, 'danger');

  const activeCount = selectedGenres.length + (selectedAuthor ? 1 : 0) + (selectedLanguage ? 1 : 0);
  const isActive = activeCount > 0;

  function toggleGenre(genre: string) {
    onGenresChange(
      selectedGenres.includes(genre) ? selectedGenres.filter((g) => g !== genre) : [...selectedGenres, genre],
    );
  }

  function clearAll() {
    onGenresChange([]);
    onAuthorChange(null);
    onLanguageChange(null);
  }

  function renderRow({
    key,
    label,
    isSelected,
    checkbox,
    onPress,
  }: {
    key: string;
    label: string;
    isSelected: boolean;
    checkbox?: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        key={key}
        onPress={onPress}
        accessibilityRole={checkbox ? 'checkbox' : 'radio'}
        accessibilityLabel={label}
        accessibilityState={checkbox ? { checked: isSelected } : { selected: isSelected }}
        style={styles.optionRow}>
        <ThemedText
          style={[
            Typography.body,
            { color: isSelected ? accentColor : textColor, fontWeight: isSelected ? '700' : '400' },
          ]}>
          {label}
        </ThemedText>
        {checkbox ? (
          <IconSymbol
            name={isSelected ? 'checkmark.circle.fill' : 'circle'}
            size={20}
            color={isSelected ? accentColor : textMutedColor}
          />
        ) : (
          isSelected && <IconSymbol name="checkmark" size={18} color={accentColor} />
        )}
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={isActive ? `${t('library.filters')} (${activeCount})` : t('library.filters')}
        style={[
          styles.trigger,
          { backgroundColor: isActive ? accentSoftColor : surfaceMutedColor, opacity: disabled ? 0.5 : 1 },
        ]}>
        <SlidersHorizontal size={16} color={isActive ? onAccentSoftColor : textColor} strokeWidth={2} />
        <ThemedText style={[Typography.button, { color: isActive ? onAccentSoftColor : textColor }]}>
          {t('library.filters')}
        </ThemedText>
        {isActive && (
          <View style={[styles.badge, { backgroundColor: dangerColor }]}>
            <ThemedText style={[Typography.caption, styles.badgeText]}>{activeCount}</ThemedText>
          </View>
        )}
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setVisible(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.done')}>
          <Pressable
            style={[styles.sheet, { backgroundColor: surfaceColor }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                {t('library.filters')}
              </ThemedText>
              {isActive && (
                <Pressable onPress={clearAll} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.clear')}>
                  <ThemedText style={[Typography.button, { color: accentColor }]}>{t('common.clear')}</ThemedText>
                </Pressable>
              )}
            </View>

            <ScrollView style={styles.scroll}>
              <View style={styles.section}>
                <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                  {t('library.genre')}
                </ThemedText>
                {genreOptions.length === 0 ? (
                  <ThemedText style={[Typography.body, { color: textMutedColor }]}>—</ThemedText>
                ) : (
                  <View>
                    {genreOptions.map((genre) =>
                      renderRow({
                        key: genre,
                        label: capitalizeFirst(genreLabels?.[genre] ?? genre),
                        isSelected: selectedGenres.includes(genre),
                        checkbox: true,
                        onPress: () => toggleGenre(genre),
                      }),
                    )}
                  </View>
                )}
              </View>

              <View style={[styles.section, styles.sectionDivider, { borderTopColor: borderColor }]}>
                <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                  {t('library.author')}
                </ThemedText>
                <View>
                  {renderRow({
                    key: '__all_authors',
                    label: t('library.allAuthors'),
                    isSelected: !selectedAuthor,
                    onPress: () => onAuthorChange(null),
                  })}
                  {authorOptions.map((author) =>
                    renderRow({
                      key: author,
                      label: author,
                      isSelected: author === selectedAuthor,
                      onPress: () => onAuthorChange(author),
                    }),
                  )}
                </View>
              </View>

              <View style={[styles.section, styles.sectionDivider, { borderTopColor: borderColor }]}>
                <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                  {t('library.language')}
                </ThemedText>
                <View>
                  {renderRow({
                    key: '__all_languages',
                    label: t('library.allLanguages'),
                    isSelected: !selectedLanguage,
                    onPress: () => onLanguageChange(null),
                  })}
                  {languageOptions.map((language) =>
                    renderRow({
                      key: language,
                      label: getLanguageName(language, locale),
                      isSelected: language === selectedLanguage,
                      onPress: () => onLanguageChange(language),
                    }),
                  )}
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.done')}
              style={[styles.doneButton, { backgroundColor: accentColor }]}>
              <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('common.done')}</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scroll: {
    flexGrow: 0,
  },
  section: {
    gap: 4,
  },
  sectionDivider: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
  doneButton: {
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
