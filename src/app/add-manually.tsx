import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useAddBook, useBook, useUpdateBookDetails } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { deleteLocalImage, persistLocalImage } from '@/lib/local-image';

const NARROW_SCREEN_WIDTH = 360;

export default function AddManuallyScreen() {
  const { id, prefillTitle, prefillAuthor, prefillCoverUri } = useLocalSearchParams<{
    id?: string;
    prefillTitle?: string;
    prefillAuthor?: string;
    prefillCoverUri?: string;
  }>();
  const isEditing = !!id;
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isNarrowScreen = width < NARROW_SCREEN_WIDTH;

  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const accentSoftColor = useThemeColor({}, 'accentSoft');
  const shadowColor = useThemeColor({}, 'shadow');

  const { data: existingBook, isLoading: isLoadingBook } = useBook(id);
  const addBook = useAddBook();
  const updateBookDetails = useUpdateBookDetails();
  const isSaving = addBook.isPending || updateBookDetails.isPending;

  const [isPrefilled, setIsPrefilled] = useState(false);
  const [initialCoverUri, setInitialCoverUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(prefillCoverUri ?? null);
  const [title, setTitle] = useState(prefillTitle ?? '');
  const [authorsText, setAuthorsText] = useState(prefillAuthor ?? '');
  const [genres, setGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [pageCountText, setPageCountText] = useState('');
  const [isGenreModalVisible, setGenreModalVisible] = useState(false);

  useEffect(() => {
    if (!isEditing || !existingBook || isPrefilled) return;
    setCoverUri(existingBook.thumbnailUrl);
    setInitialCoverUri(existingBook.thumbnailUrl);
    setTitle(existingBook.title);
    setAuthorsText(existingBook.authors.join(', '));
    setGenres(existingBook.genres);
    setDescription(existingBook.description ?? '');
    setPublishedDate(existingBook.publishedDate ?? '');
    setPageCountText(existingBook.pageCount != null ? String(existingBook.pageCount) : '');
    setIsPrefilled(true);
  }, [isEditing, existingBook, isPrefilled]);

  async function handlePickCover() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.7,
      });
      if (result.canceled) return;

      const uri = result.assets[0]?.uri;
      if (uri) setCoverUri(uri);
    } catch (error) {
      console.warn('[AddManually] cover pick failed:', error);
      Alert.alert(t('common.genericError'));
    }
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert(t('addManually.titleRequiredError'));
      return;
    }

    const authors = authorsText
      .split(',')
      .map((author) => author.trim())
      .filter(Boolean);

    const parsedPageCount = Number.parseInt(pageCountText.trim(), 10);
    const pageCount = Number.isFinite(parsedPageCount) ? parsedPageCount : null;

    try {
      const coverChanged = coverUri !== initialCoverUri;
      const thumbnailUrl = coverChanged && coverUri ? persistLocalImage(coverUri) : coverUri;

      if (isEditing && id) {
        await updateBookDetails.mutateAsync({
          id,
          updates: {
            title: trimmedTitle,
            authors,
            description: description.trim() || null,
            thumbnailUrl,
            publishedDate: publishedDate.trim() || null,
            pageCount,
            publisher: existingBook?.publisher ?? null,
            language: existingBook?.language ?? null,
          },
        });
        if (coverChanged && initialCoverUri) {
          deleteLocalImage(initialCoverUri);
        }
        router.back();
      } else {
        await addBook.mutateAsync({
          googleBooksId: null,
          title: trimmedTitle,
          authors,
          genres,
          thumbnailUrl,
          description: description.trim() || null,
          publishedDate: publishedDate.trim() || null,
          pageCount,
          publisher: null,
          language: null,
        });
        router.dismissTo('/');
      }
    } catch {
      Alert.alert(t('common.genericError'));
    }
  }

  if (isEditing && (isLoadingBook || !isPrefilled)) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={['bottom']}>
        <ScrollView
          style={{ backgroundColor }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <Stack.Screen
            options={{ title: isEditing ? t('screenTitles.editBook') : t('screenTitles.addManually') }}
          />

          <View style={styles.headerRow}>
            <View style={styles.coverColumn}>
              <Pressable onPress={handlePickCover}>
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
                ) : (
                  <View
                    style={[styles.cover, styles.coverPlaceholder, { backgroundColor: surfaceMutedColor }]}>
                    <ThemedText
                      style={[Typography.caption, styles.centeredText, { color: textMutedColor }]}>
                      {t('addManually.addCoverHint')}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
              {coverUri && (
                <Pressable onPress={() => setCoverUri(null)} hitSlop={8}>
                  <ThemedText style={[Typography.caption, styles.centeredText, { color: accentColor }]}>
                    {t('addManually.removeCover')}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <View style={styles.headerFields}>
              <View style={styles.field}>
                <ThemedText style={[Typography.metadata, styles.labelPrimary, { color: textColor }]}>
                  {t('addManually.titleLabel')}
                </ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('addManually.titlePlaceholder')}
                  placeholderTextColor={textMutedColor}
                  style={[
                    Typography.body,
                    styles.input,
                    { color: textColor, backgroundColor: surfaceMutedColor },
                  ]}
                  autoFocus={!isEditing}
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={[Typography.metadata, styles.labelPrimary, { color: textColor }]}>
                  {t('addManually.authorLabel')}
                </ThemedText>
                <TextInput
                  value={authorsText}
                  onChangeText={setAuthorsText}
                  placeholder={t('addManually.authorPlaceholder')}
                  placeholderTextColor={textMutedColor}
                  style={[
                    Typography.body,
                    styles.input,
                    { color: textColor, backgroundColor: surfaceMutedColor },
                  ]}
                />
              </View>
            </View>
          </View>

          {!isEditing && (
            <View style={styles.field}>
              <ThemedText style={[Typography.metadata, styles.labelSecondary, { color: textMutedColor }]}>
                {t('addManually.genres')}
              </ThemedText>
              <Pressable style={styles.genresRow} onPress={() => setGenreModalVisible(true)}>
                {genres.map((genre) => (
                  <View key={genre} style={[styles.genreChip, { backgroundColor: accentSoftColor }]}>
                    <ThemedText style={[Typography.caption, { color: accentColor }]}>{genre}</ThemedText>
                  </View>
                ))}
                <View style={[styles.genreChip, styles.addGenreChip, { borderColor: textMutedColor }]}>
                  <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                    {genres.length > 0 ? t('bookDetail.editGenres') : t('addManually.addGenres')}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          )}

          <View style={styles.field}>
            <ThemedText style={[Typography.metadata, styles.labelSecondary, { color: textMutedColor }]}>
              {t('addManually.descriptionLabel')}
            </ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('addManually.descriptionPlaceholder')}
              placeholderTextColor={textMutedColor}
              style={[
                Typography.body,
                styles.input,
                styles.multilineInput,
                { color: textColor, backgroundColor: surfaceMutedColor },
              ]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.row, isNarrowScreen && styles.rowStacked]}>
            <View style={[styles.field, styles.flexField]}>
              <ThemedText style={[Typography.metadata, styles.labelSecondary, { color: textMutedColor }]}>
                {t('addManually.publishedDateLabel')}
              </ThemedText>
              <TextInput
                value={publishedDate}
                onChangeText={setPublishedDate}
                placeholder={t('addManually.publishedDatePlaceholder')}
                placeholderTextColor={textMutedColor}
                style={[
                  Typography.body,
                  styles.input,
                  { color: textColor, backgroundColor: surfaceMutedColor },
                ]}
              />
            </View>
            <View style={[styles.field, styles.flexField]}>
              <ThemedText style={[Typography.metadata, styles.labelSecondary, { color: textMutedColor }]}>
                {t('addManually.pageCountLabel')}
              </ThemedText>
              <TextInput
                value={pageCountText}
                onChangeText={setPageCountText}
                placeholder={t('addManually.pageCountPlaceholder')}
                placeholderTextColor={textMutedColor}
                keyboardType="number-pad"
                style={[
                  Typography.body,
                  styles.input,
                  { color: textColor, backgroundColor: surfaceMutedColor },
                ]}
              />
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={handleSave}
            disabled={isSaving}>
            <ThemedText style={[Typography.button, styles.saveButtonText]}>
              {isSaving
                ? t(isEditing ? 'addManually.savingChanges' : 'addManually.saving')
                : t(isEditing ? 'addManually.saveChanges' : 'addManually.save')}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isGenreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setGenreModalVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: surfaceColor, shadowColor }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
              {t('addManually.genres')}
            </ThemedText>
            <GenreEditor genres={genres} onChange={setGenres} />
            <Pressable
              onPress={() => setGenreModalVisible(false)}
              style={[styles.doneButton, { backgroundColor: accentColor }]}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.done')}</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coverColumn: {
    gap: 4,
    width: 130,
  },
  headerFields: {
    flex: 1,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  field: {
    gap: 4,
  },
  flexField: {
    flex: 1,
  },
  labelPrimary: {
    fontWeight: '700',
  },
  labelSecondary: {
    fontWeight: '500',
  },
  centeredText: {
    textAlign: 'center',
  },
  cover: {
    width: 130,
    height: 195,
    borderRadius: 14,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  input: {
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  multilineInput: {
    minHeight: 60,
    paddingTop: 10,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  addGenreChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
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
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  doneButton: {
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
