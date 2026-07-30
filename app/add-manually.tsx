import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/palette';
import { useAddBook } from '@/features/library/hooks';
import { useAppColorScheme } from '@/hooks/use-app-color-scheme';
import { useTranslation } from '@/hooks/use-translation';

export default function AddManuallyScreen() {
  const { colorScheme } = useAppColorScheme();
  const colors = Palette[colorScheme];
  const { t } = useTranslation();
  const addBook = useAddBook();

  const [title, setTitle] = useState('');
  const [authorsText, setAuthorsText] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [pageCountText, setPageCountText] = useState('');

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

    await addBook.mutateAsync({
      googleBooksId: null,
      title: trimmedTitle,
      authors,
      genres,
      thumbnailUrl: null,
      description: description.trim() || null,
      publishedDate: publishedDate.trim() || null,
      pageCount: Number.isFinite(parsedPageCount) ? parsedPageCount : null,
    });

    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
          {t('addManually.titleLabel')}
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('addManually.titlePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
          {t('addManually.authorLabel')}
        </ThemedText>
        <TextInput
          value={authorsText}
          onChangeText={setAuthorsText}
          placeholder={t('addManually.authorPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
          {t('addManually.genres')}
        </ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} colors={colors} />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
          {t('addManually.descriptionLabel')}
        </ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('addManually.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.multilineInput,
            { color: colors.textPrimary, backgroundColor: colors.surfaceMuted },
          ]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flexField]}>
          <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
            {t('addManually.publishedDateLabel')}
          </ThemedText>
          <TextInput
            value={publishedDate}
            onChangeText={setPublishedDate}
            placeholder={t('addManually.publishedDatePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          />
        </View>
        <View style={[styles.field, styles.flexField]}>
          <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
            {t('addManually.pageCountLabel')}
          </ThemedText>
          <TextInput
            value={pageCountText}
            onChangeText={setPageCountText}
            placeholder={t('addManually.pageCountPlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          />
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.accent }]}
        onPress={handleSave}
        disabled={addBook.isPending}>
        <ThemedText style={styles.saveButtonText}>
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
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
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
    fontWeight: '600',
    fontSize: 16,
  },
});
