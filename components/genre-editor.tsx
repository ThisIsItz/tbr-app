import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { normalizeGenres } from '@/lib/genres';

interface GenreEditorProps {
  genres: string[];
  onChange: (genres: string[]) => void;
}

export function GenreEditor({ genres, onChange }: GenreEditorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
          <ThemedText style={{ opacity: 0.6 }}>No genres yet — add one below.</ThemedText>
        )}
        {genres.map((genre) => (
          <View key={genre} style={[styles.chip, { borderColor: colors.icon }]}>
            <ThemedText style={styles.chipText}>{genre}</ThemedText>
            <Pressable onPress={() => handleRemove(genre)} hitSlop={8}>
              <ThemedText style={[styles.chipRemove, { color: colors.tint }]}>×</ThemedText>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a genre"
          placeholderTextColor={colors.icon}
          style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable onPress={handleAdd} style={[styles.addButton, { backgroundColor: colors.tint }]}>
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
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 14,
  },
  chipRemove: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
