import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { capitalizeFirst } from '@/lib/capitalize';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslatedGenres } from '@/hooks/useTranslatedGenres';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeGenres } from '@/lib/genres';

interface GenreEditorProps {
  genres: string[];
  manualGenres: string[];
  onChange: (genres: string[], manualGenres: string[]) => void;
}

export function GenreEditor({ genres, manualGenres, onChange }: GenreEditorProps) {
  const { t } = useTranslation();
  const { translations: genreTranslations, isLoading: genresTranslating } = useTranslatedGenres(
    genres,
    manualGenres,
  );
  const [draft, setDraft] = useState('');

  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  function handleAdd() {
    if (!draft.trim()) return;
    const updatedGenres = normalizeGenres([...genres, draft]);
    const added = updatedGenres.filter((genre) => !genres.includes(genre));
    onChange(updatedGenres, [...manualGenres, ...added]);
    setDraft('');
  }

  function handleRemove(genre: string) {
    onChange(
      genres.filter((g) => g !== genre),
      manualGenres.filter((g) => g !== genre),
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {genres.length === 0 && (
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {t('genreEditor.empty')}
          </ThemedText>
        )}
        {genres.map((genre) => (
          <View key={genre} style={[styles.chip, { backgroundColor: accentSoftColor }]}>
            {genresTranslating && !genreTranslations[genre] && !manualGenres.includes(genre) ? (
              <View
                style={[
                  styles.chipSkeleton,
                  { backgroundColor: onAccentSoftColor, width: Math.min(genre.length * 6, 90) },
                ]}
              />
            ) : (
              <ThemedText style={[Typography.caption, { color: onAccentSoftColor }]}>
                {capitalizeFirst(genreTranslations[genre] ?? genre)}
              </ThemedText>
            )}
            <Pressable
              onPress={() => handleRemove(genre)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${t('common.remove')} ${genre}`}>
              <ThemedText style={[Typography.button, styles.chipRemove, { color: onAccentSoftColor }]}>
                ×
              </ThemedText>
            </Pressable>
          </View>
        ))}
      </View>
      <ThemedText style={[Typography.metadata, styles.hint, { color: textColor }]}>
        {t('genreEditor.hint')}
      </ThemedText>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          style={[
            Typography.body,
            styles.input,
            { color: textColor, backgroundColor: surfaceMutedColor },
          ]}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel={t('genreEditor.add')}
          style={[styles.addButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, { color: onAccentColor }]}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hint: {
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipRemove: {
    lineHeight: 18,
  },
  chipSkeleton: {
    height: 12,
    borderRadius: 6,
    opacity: 0.35,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButton: {
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
