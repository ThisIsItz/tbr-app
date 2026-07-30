import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/palette';
import { useBook, useDeleteBook, useUpdateBookGenres } from '@/features/library/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHttpsUrl } from '@/lib/google-books';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];

  const { data: book, isLoading } = useBook(id);
  const updateGenres = useUpdateBookGenres();
  const deleteBook = useDeleteBook();

  if (isLoading || !book) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]} />;
  }

  function handleDelete() {
    Alert.alert('Remove book?', `"${book!.title}" will be removed from your TBR.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBook.mutateAsync(book!.id);
          router.back();
        },
      },
    ]);
  }

  const coverUrl = toHttpsUrl(book.thumbnailUrl);

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
              console.warn('[BookDetail] cover failed to load:', coverUrl, e.nativeEvent.error)
            }
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <ThemedText style={{ color: colors.textMuted, fontSize: 11 }}>No cover</ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText style={[styles.bookTitle, { color: colors.textPrimary }]}>{book.title}</ThemedText>
          {book.authors.length > 0 && (
            <ThemedText style={{ color: colors.textMuted }}>{book.authors.join(', ')}</ThemedText>
          )}
          {(book.publishedDate || book.pageCount != null) && (
            <ThemedText style={{ color: colors.textMuted, fontSize: 13 }}>
              {[book.publishedDate, book.pageCount != null ? `${book.pageCount} pages` : null]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          )}
        </View>
      </View>

      {book.description && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>Description</ThemedText>
          <ThemedText style={{ color: colors.textMuted, lineHeight: 20 }}>{book.description}</ThemedText>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>Genres</ThemedText>
        <GenreEditor
          genres={book.genres}
          onChange={(genres) => updateGenres.mutate({ id: book.id, genres })}
          colors={colors}
        />
      </View>

      <Pressable
        style={[styles.deleteButton, { backgroundColor: colors.surfaceMuted }]}
        onPress={handleDelete}>
        <ThemedText style={{ color: '#C1442C', fontWeight: '600' }}>Remove from My TBR</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  centered: {
    flex: 1,
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
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
