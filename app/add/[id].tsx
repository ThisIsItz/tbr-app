import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/palette';
import { useAddBook } from '@/features/library/hooks';
import { useGoogleBookDetails } from '@/features/search/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { normalizeGenres } from '@/lib/genres';
import { toHttpsUrl } from '@/lib/google-books';
import { sanitizeDescription } from '@/lib/sanitize-html';

export default function AddBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];

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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !volume) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText style={{ color: colors.textPrimary }}>
          {error instanceof Error ? error.message : "Couldn't load this book. Try again."}
        </ThemedText>
      </View>
    );
  }

  const { title, authors, description, publishedDate, pageCount, imageLinks } = volume.volumeInfo;
  const coverUrl = toHttpsUrl(imageLinks?.thumbnail);

  async function handleSave() {
    await addBook.mutateAsync({
      googleBooksId: volume!.id,
      title,
      authors: authors ?? [],
      genres,
      thumbnailUrl: coverUrl,
      description: description ? sanitizeDescription(description) : null,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
    });
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={(e) =>
              console.warn('[AddBook] cover failed to load:', coverUrl, e.nativeEvent.error)
            }
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <ThemedText style={{ color: colors.textMuted, fontSize: 11 }}>No cover</ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText style={[styles.bookTitle, { color: colors.textPrimary }]}>{title}</ThemedText>
          {authors && authors.length > 0 && (
            <ThemedText style={{ color: colors.textMuted }}>{authors.join(', ')}</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>Genres</ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} colors={colors} />
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.accent }]}
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
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  bookTitle: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
