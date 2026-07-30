import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';

interface GenreEditorProps {
  genres: string[];
  onChange: (genres: string[]) => void;
}

export function GenreEditor({ genres, onChange }: GenreEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  function handleAdd() {
    if (!draft.trim()) return;
    onChange(normalizeGenres([...genres, draft]));
    setDraft('');
  }

  function handleRemove(genre: string) {
    onChange(genres.filter((g) => g !== genre));
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
            <ThemedText style={[Typography.caption, { color: accentColor }]}>{genre}</ThemedText>
            <Pressable onPress={() => handleRemove(genre)} hitSlop={8}>
              <ThemedText style={[Typography.button, styles.chipRemove, { color: accentColor }]}>
                ×
              </ThemedText>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('genreEditor.placeholder')}
          placeholderTextColor={textMutedColor}
          style={[
            Typography.body,
            styles.input,
            { color: textColor, backgroundColor: surfaceMutedColor },
          ]}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable onPress={handleAdd} style={[styles.addButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, styles.addButtonText]}>
            {t('genreEditor.add')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
  addButtonText: {
    color: '#fff',
  },
});
