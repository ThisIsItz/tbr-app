import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useAddBook } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { persistLocalImage } from '@/lib/local-image';

export default function AddManuallyScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const addBook = useAddBook();

  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [authorsText, setAuthorsText] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [pageCountText, setPageCountText] = useState('');

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
    const thumbnailUrl = coverUri ? persistLocalImage(coverUri) : null;

    await addBook.mutateAsync({
      googleBooksId: null,
      title: trimmedTitle,
      authors,
      genres,
      thumbnailUrl,
      description: description.trim() || null,
      publishedDate: publishedDate.trim() || null,
      pageCount: Number.isFinite(parsedPageCount) ? parsedPageCount : null,
    });

    router.back();
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
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
          autoFocus
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

      <View style={styles.field}>
        <ThemedText style={[Typography.caption, styles.label, { color: textColor }]}>
          {t('addManually.genres')}
        </ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} />
      </View>

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
        disabled={addBook.isPending}>
        <ThemedText style={[Typography.button, styles.saveButtonText]}>
          {addBook.isPending ? t('addManually.saving') : t('addManually.save')}
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
