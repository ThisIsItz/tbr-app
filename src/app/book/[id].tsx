import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BookDetailsSection } from '@/components/BookDetailsSection';
import { BookHeader } from '@/components/BookHeader';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { GenreEditor } from '@/components/GenreEditor';
import { HeaderIconAction } from '@/components/HeaderIconAction';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useBook, useDeleteBook, useUpdateBookGenres, useUpdateBookNotes } from '@/hooks/useLibrary';
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
  const onAccentSoftColor = useThemeColor({}, 'onAccentSoft');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const dangerColor = useThemeColor({}, 'danger');

  const { data: book, isLoading } = useBook(id);
  const updateGenres = useUpdateBookGenres();
  const updateNotes = useUpdateBookNotes();
  const deleteBook = useDeleteBook();
  const [isGenreModalVisible, setGenreModalVisible] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(book?.notes ?? '');
  }, [book?.notes]);

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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.scrollView, { backgroundColor }]} contentContainerStyle={styles.container}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <View style={styles.headerActions}>
                <HeaderIconAction
                  icon={Pencil}
                  color={accentColor}
                  label={t('common.edit')}
                  onPress={() => router.push({ pathname: '/add/manually', params: { id: book.id } })}
                />
                <HeaderIconAction
                  icon={Trash2}
                  color={dangerColor}
                  label={t('bookDetail.remove')}
                  onPress={handleDelete}
                />
              </View>
            ),
          }}
        />
        <View style={styles.content}>
        <BookHeader title={book.title} subtitle={book.subtitle} authors={book.authors} coverUrl={coverUrl} />

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
                <ThemedText style={[Typography.caption, { color: onAccentSoftColor }]}>{genre}</ThemedText>
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

        <Modal
          visible={isGenreModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGenreModalVisible(false)}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setGenreModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.done')}>
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
                accessibilityRole="button"
                accessibilityLabel={t('common.done')}
                style={[styles.doneButton, { backgroundColor: accentColor }]}>
                <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('common.done')}</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
