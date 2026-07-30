import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PaletteColors } from '@/constants/palette';
import { normalizeGenres } from '@/lib/genres';

interface GenreEditorProps {
  genres: string[];
  onChange: (genres: string[]) => void;
  colors: PaletteColors;
}

export function GenreEditor({ genres, onChange, colors }: GenreEditorProps) {
  const [draft, setDraft] = useState('');

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
          <ThemedText style={{ color: colors.textMuted }}>No genres yet — add one below.</ThemedText>
        )}
        {genres.map((genre) => (
          <View key={genre} style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
            <ThemedText style={[styles.chipText, { color: colors.accent }]}>{genre}</ThemedText>
            <Pressable onPress={() => handleRemove(genre)} hitSlop={8}>
              <ThemedText style={[styles.chipRemove, { color: colors.accent }]}>×</ThemedText>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a genre"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable onPress={handleAdd} style={[styles.addButton, { backgroundColor: colors.accent }]}>
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
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
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipRemove: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 16,
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
    fontWeight: '600',
  },
});
