import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookHero, CircleButton } from '@/components/BookHero';
import { CoverViewerModal } from '@/components/CoverViewerModal';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { GenreEditor } from '@/components/GenreEditor';
import { Skeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useBook, useDeleteBook, useUpdateBookGenres, useUpdateBookNotes } from '@/hooks/useLibrary';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslatedGenres } from '@/hooks/useTranslatedGenres';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { confirmAsync } from '@/lib/dialog';
import { estimateGenreSkeletonWidth, normalizeGenres } from '@/lib/genres';
import { useUndoContext } from '@/lib/undo/UndoProvider';
import { toHighResUrl } from '@/api/googleBooks';
import { sanitizeDescription } from '@/lib/sanitizeHtml';

const MAX_VISIBLE_GENRES = 3;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const genreSheetAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const dangerColor = useThemeColor({}, 'danger');

  const { data: book, isLoading } = useBook(id);
  const updateGenres = useUpdateBookGenres();
  const updateNotes = useUpdateBookNotes();
  const deleteBook = useDeleteBook();
  const { notifyDeleted } = useUndoContext();
  const [isGenreModalVisible, setGenreModalVisible] = useState(false);
  const [isCoverViewerVisible, setCoverViewerVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const bookRef = useRef(book);
  bookRef.current = book;

  useEffect(() => {
    setNotes(book?.notes ?? '');
  }, [book?.notes]);

  useEffect(() => {
    if (!isGenreModalVisible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setGenreModalVisible(false);
      return true;
    });
    return () => subscription.remove();
  }, [isGenreModalVisible]);

  useEffect(() => {
    return () => {
      const currentBook = bookRef.current;
      if (!currentBook) return;
      const trimmed = notesRef.current.trim() || null;
      if (trimmed === currentBook.notes) return;
      updateNotes.mutate({ id: currentBook.id, notes: trimmed });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genres = normalizeGenres(book?.genres ?? []);
  const manualGenres = book?.manualGenres ?? [];
  const { translations: genreTranslations, isLoading: genresTranslating } = useTranslatedGenres(
    genres,
    manualGenres,
  );

  function handleNotesBlur() {
    if (!book) return;
    const trimmed = notes.trim() || null;
    if (trimmed === book.notes) return;
    updateNotes.mutate({ id: book.id, notes: trimmed });
  }

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
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.deleteButton, { backgroundColor: surfaceMutedColor }]}>
          <ThemedText style={[Typography.button, { color: accentColor }]}>{t('common.back')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  async function handleDelete() {
    const confirmed = await confirmAsync(
      t('bookDetail.removeTitle'),
      t('bookDetail.removeBody', { title: book!.title }),
      t('common.remove'),
      t('common.cancel'),
    );
    if (!confirmed) return;

    deleteBook.mutate(book!.id);
    notifyDeleted(book!);
    router.back();
  }

  const coverUrl = toHighResUrl(book.thumbnailUrl);
  const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
  const extraGenreCount = genres.length - visibleGenres.length;
  const description = book.description ? sanitizeDescription(book.description) : null;

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        style={[styles.scrollView, { backgroundColor }]}
        contentContainerStyle={styles.container}
        bottomOffset={24}>
        <Stack.Screen options={{ headerShown: false }} />
        <BookHero
          title={book.title}
          subtitle={book.subtitle}
          authors={book.authors}
          coverUrl={coverUrl}
          pageCount={book.pageCount}
          language={book.language}
          publishedDate={book.publishedDate}
          onBack={() => router.back()}
          onCoverPress={coverUrl ? () => setCoverViewerVisible(true) : undefined}
          topRight={
            <>
              <CircleButton
                onPress={() => router.push({ pathname: '/add/manually', params: { id: book.id } })}
                accessibilityLabel={t('common.edit')}>
                <Pencil size={18} color="#1A1310" strokeWidth={2} />
              </CircleButton>
              <CircleButton
                onPress={handleDelete}
                accessibilityLabel={t('bookDetail.remove')}
                tint="rgba(255, 227, 227, 0.9)">
                <Trash2 size={18} color={dangerColor} strokeWidth={2} />
              </CircleButton>
            </>
          }
        />
        <View style={styles.content}>
          {description && <ExpandableDescription description={description} />}

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
                <Pencil size={18} color={accentColor} strokeWidth={1.75} />
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
                  {genresTranslating && !genreTranslations[genre] && !manualGenres.includes(genre) ? (
                    <Skeleton
                      width={estimateGenreSkeletonWidth(genre)}
                      height={12}
                      tint={onAccentSoftColor}
                    />
                  ) : (
                    <ThemedText style={[Typography.caption, { color: onAccentSoftColor }]}>
                      {capitalizeFirst(genreTranslations[genre] ?? genre)}
                    </ThemedText>
                  )}
                </View>
              ))}
              {extraGenreCount > 0 && (
                <Pressable
                  onPress={() => setGenreModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('bookDetail.moreGenres', { count: extraGenreCount })}
                  style={[styles.genreChip, { backgroundColor: surfaceMutedColor }]}>
                  <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                    {t('bookDetail.moreGenres', { count: extraGenreCount })}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
              {t('bookDetail.notes')}
            </ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={handleNotesBlur}
              placeholder={t('bookDetail.notesPlaceholder')}
              placeholderTextColor={textMutedColor}
              style={[
                Typography.body,
                styles.notesInput,
                { color: textColor, backgroundColor: surfaceColor },
              ]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <CoverViewerModal
          visible={isCoverViewerVisible}
          coverUrl={coverUrl}
          onClose={() => setCoverViewerVisible(false)}
        />
      </KeyboardAwareScrollView>

      {isGenreModalVisible && (
        <Pressable
          style={[styles.backdrop, StyleSheet.absoluteFill]}
          onPress={() => setGenreModalVisible(false)}
          accessibilityLabel={t('common.done')}>
          <Animated.View style={genreSheetAnimatedStyle}>
            <Pressable
              style={[styles.sheet, { backgroundColor: surfaceColor, paddingBottom: 32 + insets.bottom }]}
              onPress={(e) => e.stopPropagation()}>
              <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                {t('bookDetail.genres')}
              </ThemedText>
              <GenreEditor
                genres={genres}
                manualGenres={manualGenres}
                onChange={(updatedGenres, updatedManualGenres) =>
                  updateGenres.mutate({ id: book.id, genres: updatedGenres, manualGenres: updatedManualGenres })
                }
              />
              <Pressable
                onPress={() => setGenreModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.done')}
                style={[styles.doneButton, { backgroundColor: accentColor }]}>
                <ThemedText style={[Typography.button, { color: onAccentColor }]}>
                  {t('common.done')}
                </ThemedText>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
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
  notesInput: {
    borderRadius: 10,
    minHeight: 80,
    paddingVertical: 10,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
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
