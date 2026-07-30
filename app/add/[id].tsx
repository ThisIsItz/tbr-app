import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAddBook } from '@/features/library/hooks';
import { useGoogleBookDetails } from '@/features/search/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { normalizeGenres } from '@/lib/genres';

export default function AddBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: volume, isLoading, isError, error } = useGoogleBookDetails(id);
  const addBook = useAddBook();
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    if (volume) {
      setGenres(normalizeGenres(volume.volumeInfo.categories ?? []));
    }
  }, [volume]);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError || !volume) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>
          {error instanceof Error ? error.message : "Couldn't load this book. Try again."}
        </ThemedText>
      </ThemedView>
    );
  }

  const { title, authors, description, publishedDate, pageCount, imageLinks } = volume.volumeInfo;

  async function handleSave() {
    await addBook.mutateAsync({
      googleBooksId: volume!.id,
      title,
      authors: authors ?? [],
      genres,
      thumbnailUrl: imageLinks?.thumbnail ?? null,
      description: description ?? null,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
    });
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {imageLinks?.thumbnail ? (
          <Image source={{ uri: imageLinks.thumbnail }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, { borderColor: colors.icon, borderWidth: 1 }]} />
        )}
        <View style={styles.headerText}>
          <ThemedText type="subtitle">{title}</ThemedText>
          {authors && authors.length > 0 && (
            <ThemedText style={{ opacity: 0.7 }}>{authors.join(', ')}</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Genres</ThemedText>
        <ThemedText style={{ opacity: 0.6, marginBottom: 8 }}>
          Suggested from Google Books — edit as you like.
        </ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} />
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.tint }]}
        onPress={handleSave}
        disabled={addBook.isPending}>
        <ThemedText style={styles.saveButtonText}>
          {addBook.isPending ? 'Saving…' : 'Save to My TBR'}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  section: {
    gap: 4,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
