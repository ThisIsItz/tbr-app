import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useBook, useDeleteBook, useUpdateBookGenres } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';
import { toHttpsUrl } from '@/lib/google-books';
import { sanitizeDescription } from '@/lib/sanitize-html';

const MAX_VISIBLE_GENRES = 3;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const dangerColor = useThemeColor({}, 'danger');

  const { data: book, isLoading } = useBook(id);
  const updateGenres = useUpdateBookGenres();
  const deleteBook = useDeleteBook();
  const [isGenreModalVisible, setGenreModalVisible] = useState(false);

  if (isLoading || !book) {
    return <View style={[styles.centered, { backgroundColor }]} />;
  }

  function handleDelete() {
    Alert.alert(
      t('bookDetail.removeTitle'),
      t('bookDetail.removeBody', { title: book!.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            await deleteBook.mutateAsync(book!.id);
            router.back();
          },
        },
      ],
    );
  }

  const coverUrl = toHttpsUrl(book.thumbnailUrl);
  const genres = normalizeGenres(book.genres);
  const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
  const extraGenreCount = genres.length - visibleGenres.length;

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
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
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surfaceMutedColor }]}>
            <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
              {t('bookCard.noCover')}
            </ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText style={[Typography.bookTitle, { color: textColor }]}>{book.title}</ThemedText>
          {book.authors.length > 0 && (
            <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
              {book.authors.join(', ')}
            </ThemedText>
          )}
          {(book.publishedDate || book.pageCount != null) && (
            <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
              {[
                book.publishedDate,
                book.pageCount != null
                  ? t(book.pageCount === 1 ? 'bookDetail.onePage' : 'bookDetail.pagesCount', {
                      count: book.pageCount,
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          )}
        </View>
      </View>

      {book.description && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('bookDetail.description')}
          </ThemedText>
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {sanitizeDescription(book.description)}
          </ThemedText>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('bookDetail.genres')}
          </ThemedText>
          <Pressable onPress={() => setGenreModalVisible(true)} hitSlop={8}>
            <ThemedText style={[Typography.button, { color: accentColor }]}>
              {t('bookDetail.editGenres')}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.genreChipRow}>
          {genres.length === 0 && (
            <ThemedText style={[Typography.body, { color: textMutedColor }]}>
              {t('bookDetail.noGenres')}
            </ThemedText>
          )}
          {visibleGenres.map((genre) => (
            <View key={genre} style={[styles.genreChip, { backgroundColor: accentSoftColor }]}>
              <ThemedText style={[Typography.caption, { color: accentColor }]}>{genre}</ThemedText>
            </View>
          ))}
          {extraGenreCount > 0 && (
            <Pressable
              onPress={() => setGenreModalVisible(true)}
              style={[styles.genreChip, { backgroundColor: surfaceMutedColor }]}>
              <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                {t('bookDetail.moreGenres', { count: extraGenreCount })}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.deleteButton, { backgroundColor: surfaceMutedColor }]}
        onPress={handleDelete}>
        <ThemedText style={[Typography.button, { color: dangerColor }]}>
          {t('bookDetail.remove')}
        </ThemedText>
      </Pressable>

      <Modal
        visible={isGenreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setGenreModalVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: surfaceColor }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
              {t('bookDetail.genres')}
            </ThemedText>
            <GenreEditor
              genres={genres}
              onChange={(updated) => updateGenres.mutate({ id: book.id, genres: updated })}
            />
            <Pressable
              onPress={() => setGenreModalVisible(false)}
              style={[styles.doneButton, { backgroundColor: accentColor }]}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.done')}</ThemedText>
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
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  doneButton: {
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
