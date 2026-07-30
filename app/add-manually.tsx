import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useAddBook, useBook, useUpdateBookDetails } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { deleteLocalImage, persistLocalImage } from '@/lib/local-image';

export default function AddManuallyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  const { data: existingBook, isLoading: isLoadingBook } = useBook(id);
  const addBook = useAddBook();
  const updateBookDetails = useUpdateBookDetails();
  const isSaving = addBook.isPending || updateBookDetails.isPending;

  const [isPrefilled, setIsPrefilled] = useState(false);
  const [initialCoverUri, setInitialCoverUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [authorsText, setAuthorsText] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [pageCountText, setPageCountText] = useState('');

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.7,
    });
    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (uri) setCoverUri(uri);
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

    // Only persist a new file if the cover actually changed — re-persisting
    // an already-local, unchanged URI would just copy it again pointlessly.
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
        },
      });
      if (coverChanged && initialCoverUri) {
        deleteLocalImage(initialCoverUri);
      }
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
      });
    }

    router.back();
  }

  if (isEditing && (isLoadingBook || !isPrefilled)) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{ title: isEditing ? t('screenTitles.editBook') : t('screenTitles.addManually') }}
      />

      <View style={styles.field}>
        <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
          {t('addManually.coverLabel')}
        </ThemedText>
        <Pressable onPress={handlePickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: surfaceMutedColor }]}>
              <ThemedText
                style={[Typography.caption, styles.centeredText, { color: textMutedColor }]}>
                {t('addManually.addCoverHint')}
              </ThemedText>
            </View>
          )}
        </Pressable>
        {coverUri && (
          <Pressable onPress={() => setCoverUri(null)} hitSlop={8}>
            <ThemedText style={[Typography.caption, { color: accentColor }]}>
              {t('addManually.removeCover')}
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
          {t('addManually.titleLabel')}
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('addManually.titlePlaceholder')}
          placeholderTextColor={textMutedColor}
          style={[Typography.body, styles.input, { color: textColor, backgroundColor: surfaceMutedColor }]}
          autoFocus={!isEditing}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
          {t('addManually.authorLabel')}
        </ThemedText>
        <TextInput
          value={authorsText}
          onChangeText={setAuthorsText}
          placeholder={t('addManually.authorPlaceholder')}
          placeholderTextColor={textMutedColor}
          style={[Typography.body, styles.input, { color: textColor, backgroundColor: surfaceMutedColor }]}
        />
      </View>

      {!isEditing && (
        <View style={styles.field}>
          <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
            {t('addManually.genres')}
          </ThemedText>
          <GenreEditor genres={genres} onChange={setGenres} />
        </View>
      )}

      <View style={styles.field}>
        <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
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

      <View style={styles.row}>
        <View style={[styles.field, styles.flexField]}>
          <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
            {t('addManually.publishedDateLabel')}
          </ThemedText>
          <TextInput
            value={publishedDate}
            onChangeText={setPublishedDate}
            placeholder={t('addManually.publishedDatePlaceholder')}
            placeholderTextColor={textMutedColor}
            style={[Typography.body, styles.input, { color: textColor, backgroundColor: surfaceMutedColor }]}
          />
        </View>
        <View style={[styles.field, styles.flexField]}>
          <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
            {t('addManually.pageCountLabel')}
          </ThemedText>
          <TextInput
            value={pageCountText}
            onChangeText={setPageCountText}
            placeholder={t('addManually.pageCountPlaceholder')}
            placeholderTextColor={textMutedColor}
            keyboardType="number-pad"
            style={[Typography.body, styles.input, { color: textColor, backgroundColor: surfaceMutedColor }]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    gap: 6,
  },
  flexField: {
    flex: 1,
  },
  label: {
    fontWeight: '700',
  },
  centeredText: {
    textAlign: 'center',
  },
  cover: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  input: {
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: 10,
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
});
