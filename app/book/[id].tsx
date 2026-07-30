import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/palette';
import { useBook, useDeleteBook, useUpdateBookGenres } from '@/features/library/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { normalizeGenres } from '@/lib/genres';
import { toHttpsUrl } from '@/lib/google-books';
import { sanitizeDescription } from '@/lib/sanitize-html';

const MAX_VISIBLE_GENRES = 3;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];

  const { data: book, isLoading } = useBook(id);
  const updateGenres = useUpdateBookGenres();
  const deleteBook = useDeleteBook();
  const [isGenreModalVisible, setGenreModalVisible] = useState(false);

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
  const genres = normalizeGenres(book.genres);
  const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
  const extraGenreCount = genres.length - visibleGenres.length;

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
          <ThemedText style={{ color: colors.textMuted, lineHeight: 20 }}>
            {sanitizeDescription(book.description)}
          </ThemedText>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textPrimary }]}>Genres</ThemedText>
          <Pressable onPress={() => setGenreModalVisible(true)} hitSlop={8}>
            <ThemedText style={{ color: colors.accent, fontWeight: '600' }}>Edit genres</ThemedText>
          </Pressable>
        </View>

        <View style={styles.genreChipRow}>
          {genres.length === 0 && (
            <ThemedText style={{ color: colors.textMuted }}>No genres yet.</ThemedText>
          )}
          {visibleGenres.map((genre) => (
            <View key={genre} style={[styles.genreChip, { backgroundColor: colors.accentSoft }]}>
              <ThemedText style={[styles.genreChipText, { color: colors.accent }]}>{genre}</ThemedText>
            </View>
          ))}
          {extraGenreCount > 0 && (
            <Pressable
              onPress={() => setGenreModalVisible(true)}
              style={[styles.genreChip, { backgroundColor: colors.surfaceMuted }]}>
              <ThemedText style={[styles.genreChipText, { color: colors.textMuted }]}>
                +{extraGenreCount} more
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.deleteButton, { backgroundColor: colors.surfaceMuted }]}
        onPress={handleDelete}>
        <ThemedText style={{ color: '#C1442C', fontWeight: '600' }}>Remove from My TBR</ThemedText>
      </Pressable>

      <Modal
        visible={isGenreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setGenreModalVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[styles.sheetTitle, { color: colors.textPrimary }]}>Genres</ThemedText>
            <GenreEditor
              genres={genres}
              onChange={(updated) => updateGenres.mutate({ id: book.id, genres: updated })}
              colors={colors}
            />
            <Pressable
              onPress={() => setGenreModalVisible(false)}
              style={[styles.doneButton, { backgroundColor: colors.accent }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Done</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  genreChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    gap: 16,
    maxHeight: '80%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
