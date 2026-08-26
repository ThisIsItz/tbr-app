import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { HeaderTextAction } from '@/components/header-text-action';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useBook, useDeleteBook, useUpdateBookGenres } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';
import { toHttpsUrl } from '@/lib/google-books';
import { getLanguageName } from '@/lib/language-names';
import { sanitizeDescription } from '@/lib/sanitize-html';

const MAX_VISIBLE_GENRES = 3;
const DESCRIPTION_COLLAPSED_LINES = 6;
const FADE_BARS = 6;

function formatPublishedDate(raw: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return raw;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function DetailRow({ label, value, isFirst }: { label: string; value: string; isFirst: boolean }) {
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.detailRow,
        !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
      ]}>
      <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>{label}</ThemedText>
      <ThemedText style={[Typography.body, { color: textColor }]}>{value}</ThemedText>
    </View>
  );
}

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
  const [isDescriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hasMoreDescription, setHasMoreDescription] = useState(false);

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

  const detailRows = [
    book.pageCount != null && {
      label: t('bookDetail.pages'),
      value: t(book.pageCount === 1 ? 'bookDetail.onePage' : 'bookDetail.pagesCount', {
        count: book.pageCount,
      }),
    },
    book.language && { label: t('bookDetail.language'), value: getLanguageName(book.language) },
    book.publisher && { label: t('bookDetail.publisher'), value: book.publisher },
    book.publishedDate && {
      label: t('bookDetail.published'),
      value: formatPublishedDate(book.publishedDate),
    },
  ].filter((row): row is { label: string; value: string } => !!row);

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor }]} contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderTextAction
              label={t('common.edit')}
              onPress={() => router.push({ pathname: '/add-manually', params: { id: book.id } })}
            />
          ),
        }}
      />
      <View style={styles.content}>
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
          <ThemedText style={[Typography.screenTitle, { color: textColor }]}>{book.title}</ThemedText>
          {book.authors.length > 0 && (
            <ThemedText style={[styles.author, { color: textMutedColor }]}>
              {book.authors.join(', ')}
            </ThemedText>
          )}
        </View>
      </View>

      {description && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('bookDetail.description')}
          </ThemedText>
          <View>
            <ThemedText
              style={[Typography.body, { color: textMutedColor }]}
              numberOfLines={isDescriptionExpanded ? undefined : DESCRIPTION_COLLAPSED_LINES}
              onTextLayout={(e) => {
                if (!isDescriptionExpanded) {
                  setHasMoreDescription(e.nativeEvent.lines.length >= DESCRIPTION_COLLAPSED_LINES);
                }
              }}>
              {description}
            </ThemedText>
            {!isDescriptionExpanded && hasMoreDescription && (
              <View style={styles.descriptionFade} pointerEvents="none">
                {Array.from({ length: FADE_BARS }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.descriptionFadeBar,
                      { backgroundColor, opacity: (i + 1) / FADE_BARS },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
          {hasMoreDescription && (
            <Pressable
              onPress={() => setDescriptionExpanded((v) => !v)}
              hitSlop={8}
              style={styles.expandButton}>
              <ThemedText style={[Typography.button, { color: accentColor }]}>
                {isDescriptionExpanded ? t('bookDetail.showLess') : t('bookDetail.showMore')}
              </ThemedText>
              <IconSymbol
                name={isDescriptionExpanded ? 'chevron.up' : 'chevron.down'}
                size={16}
                color={accentColor}
              />
            </Pressable>
          )}
        </View>
      )}

      {detailRows.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('bookDetail.details')}
          </ThemedText>
          <View style={[styles.detailsCard, { backgroundColor: surfaceColor }]}>
            {detailRows.map((row, index) => (
              <DetailRow key={row.label} label={row.label} value={row.value} isFirst={index === 0} />
            ))}
          </View>
        </View>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  thumbnail: {
    width: 130,
    height: 195,
    borderRadius: 14,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  author: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  descriptionFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    flexDirection: 'column',
  },
  descriptionFadeBar: {
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  detailsCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
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
