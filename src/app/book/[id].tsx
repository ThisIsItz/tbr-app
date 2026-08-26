import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BookDetailsSection } from '@/components/BookDetailsSection';
import { BookHeader } from '@/components/BookHeader';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { GenreEditor } from '@/components/GenreEditor';
import { HeaderTextAction } from '@/components/HeaderTextAction';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/lib/theme/theme';
import { useBook, useDeleteBook, useUpdateBookGenres } from '@/hooks/useLibrary';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeGenres } from '@/lib/genres';
import { toHttpsUrl } from '@/api/googleBooks';
import { sanitizeDescription } from '@/lib/sanitizeHtml';

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

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.centered, styles.notFoundContainer, { backgroundColor }]}>
        <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
          {t('bookDetail.notFound')}
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.deleteButton, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText style={[Typography.button, { color: accentColor }]}>{t('common.back')}</ThemedText>
        </Pressable>
      </View>
    );
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
  const description = book.description ? sanitizeDescription(book.description) : null;

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor }]} contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderTextAction
              label={t('common.edit')}
              onPress={() => router.push({ pathname: '/add/manually', params: { id: book.id } })}
            />
          ),
        }}
      />
      <View style={styles.content}>
      <BookHeader title={book.title} authors={book.authors} coverUrl={coverUrl} />

      {description && <ExpandableDescription description={description} />}

      <BookDetailsSection
        pageCount={book.pageCount}
        language={book.language}
        publisher={book.publisher}
        publishedDate={book.publishedDate}
      />

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('bookDetail.genres')}
          </ThemedText>
          <Pressable
            onPress={() => setGenreModalVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('bookDetail.editGenres')}>
            <IconSymbol name="pencil" size={18} color={accentColor} />
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
      </View>

      <Pressable
        style={[
          styles.deleteButton,
          { backgroundColor: surfaceMutedColor, borderWidth: 1.5, borderColor: dangerColor },
        ]}
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
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'space-between',
    gap: 24,
  },
  content: {
    gap: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundContainer: {
    gap: 16,
    paddingHorizontal: 24,
  },
  centeredText: {
    textAlign: 'center',
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
