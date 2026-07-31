import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { searchGoogleBooks } from '@/lib/google-books';
import { bookCoverRecognitionService } from '@/lib/recognition';
import type { GoogleBooksVolume } from '@/types/google-books';

// Stages of the flow. "reviewing" covers both the matches-found and
// no-matches-found cases — the editable fields and detected text stay on
// screen either way so the user is never left at a dead end.
type Stage = 'idle' | 'unsupported' | 'recognizing' | 'reviewing' | 'noText';
type SearchStatus = 'idle' | 'loading' | 'done';

async function searchMultiple(queries: string[]): Promise<GoogleBooksVolume[]> {
  const resultsPerQuery = await Promise.all(queries.map((q) => searchGoogleBooks(q).catch(() => [])));
  const merged: GoogleBooksVolume[] = [];
  const seen = new Set<string>();
  for (const results of resultsPerQuery) {
    for (const volume of results) {
      if (!seen.has(volume.id)) {
        seen.add(volume.id);
        merged.push(volume);
      }
    }
  }
  return merged;
}

export default function RecognizeCoverScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const shadowColor = useThemeColor({}, 'shadow');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  const [stage, setStage] = useState<Stage>(
    bookCoverRecognitionService.isSupported ? 'idle' : 'unsupported',
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [matches, setMatches] = useState<GoogleBooksVolume[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');

  const { data: libraryBooks } = useBooks();
  const savedGoogleIds = new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean));

  async function handlePick(source: 'camera' | 'gallery') {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setImageUri(uri);
    setMatches([]);
    setSearchStatus('idle');
    await recognizeAndSearch(uri);
  }

  async function recognizeAndSearch(uri: string) {
    setStage('recognizing');
    try {
      const result = await bookCoverRecognitionService.recognizeCover(uri);
      setRawText(result.rawText);
      const initialTitle = result.candidateTitles[0] ?? '';
      const initialAuthor = result.candidateAuthors[0] ?? '';
      setTitle(initialTitle);
      setAuthor(initialAuthor);

      if (result.rawText.length === 0) {
        setStage('noText');
        return;
      }

      setStage('reviewing');
      if (result.searchQueries.length > 0) {
        setSearchStatus('loading');
        const found = await searchMultiple(result.searchQueries);
        setMatches(found);
        setSearchStatus('done');
      }
    } catch {
      setStage('noText');
    }
  }

  async function handleSearchAgain() {
    const query = [title, author].filter((v) => v.trim()).join(' ').trim();
    if (!query) return;

    setSearchStatus('loading');
    try {
      const found = await searchGoogleBooks(query);
      setMatches(found);
    } catch {
      setMatches([]);
    } finally {
      setSearchStatus('done');
    }
  }

  function handleReset() {
    setStage(bookCoverRecognitionService.isSupported ? 'idle' : 'unsupported');
    setImageUri(null);
    setRawText([]);
    setTitle('');
    setAuthor('');
    setMatches([]);
    setSearchStatus('idle');
  }

  function goToAddManually() {
    router.push({
      pathname: '/add-manually',
      params: { prefillTitle: title || undefined, prefillAuthor: author || undefined },
    });
  }

  function goToSearchManually() {
    router.push('/add-book');
  }

  return (
    <ScrollView
      style={{ backgroundColor }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('screenTitles.recognizeCover') }} />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />}

      {stage === 'idle' && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('recognizeCover.explainerTitle')}
          </ThemedText>
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {t('recognizeCover.explainerBody')}
          </ThemedText>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={() => handlePick('camera')}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>
                {t('recognizeCover.takePhoto')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: surfaceMutedColor }]}
              onPress={() => handlePick('gallery')}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('recognizeCover.chooseFromGallery')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {stage === 'unsupported' && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('recognizeCover.unsupportedTitle')}
          </ThemedText>
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {t('recognizeCover.unsupportedBody')}
          </ThemedText>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: surfaceMutedColor }]}
              onPress={goToSearchManually}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('recognizeCover.searchManually')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={goToAddManually}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>
                {t('search.addManually')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {stage === 'recognizing' && (
        <View style={styles.centered}>
          <ActivityIndicator color={accentColor} />
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {t('recognizeCover.extracting')}
          </ThemedText>
        </View>
      )}

      {stage === 'noText' && (
        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('recognizeCover.noTextTitle')}
          </ThemedText>
          <ThemedText style={[Typography.body, { color: textMutedColor }]}>
            {t('recognizeCover.noTextBody')}
          </ThemedText>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: surfaceMutedColor }]}
              onPress={handleReset}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('recognizeCover.retakePhoto')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: surfaceMutedColor }]}
              onPress={goToSearchManually}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('recognizeCover.searchManually')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={goToAddManually}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>
                {t('search.addManually')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {stage === 'reviewing' && (
        <>
          <View style={styles.section}>
            <View style={styles.field}>
              <ThemedText style={[Typography.metadata, { color: textColor }]}>
                {t('recognizeCover.titleLabel')}
              </ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t('recognizeCover.titlePlaceholder')}
                placeholderTextColor={textMutedColor}
                style={[
                  Typography.body,
                  styles.input,
                  { color: textColor, backgroundColor: surfaceMutedColor },
                ]}
              />
            </View>
            <View style={styles.field}>
              <ThemedText style={[Typography.metadata, { color: textColor }]}>
                {t('recognizeCover.authorLabel')}
              </ThemedText>
              <TextInput
                value={author}
                onChangeText={setAuthor}
                placeholder={t('recognizeCover.authorPlaceholder')}
                placeholderTextColor={textMutedColor}
                style={[
                  Typography.body,
                  styles.input,
                  { color: textColor, backgroundColor: surfaceMutedColor },
                ]}
              />
            </View>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={handleSearchAgain}
              disabled={searchStatus === 'loading'}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>
                {t('recognizeCover.searchAgain')}
              </ThemedText>
            </Pressable>
          </View>

          {rawText.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
                {t('recognizeCover.detectedTextLabel')}
              </ThemedText>
              <View style={[styles.detectedTextBox, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {rawText.join('  ·  ')}
                </ThemedText>
              </View>
            </View>
          )}

          {searchStatus === 'loading' && (
            <View style={styles.centered}>
              <ActivityIndicator color={accentColor} />
              <ThemedText style={[Typography.body, { color: textMutedColor }]}>
                {t('recognizeCover.searching')}
              </ThemedText>
            </View>
          )}

          {searchStatus === 'done' && matches.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
                {t('recognizeCover.matchesLabel')}
              </ThemedText>
              <View style={styles.resultsList}>
                {matches.map((item) => {
                  const alreadySaved = savedGoogleIds.has(item.id);
                  const { title: matchTitle, authors, categories, imageLinks } = item.volumeInfo;
                  const goToDetails = () => router.push(`/add/${item.id}`);
                  return (
                    <BookCard
                      key={item.id}
                      variant="result"
                      title={matchTitle}
                      author={authors?.join(', ') ?? null}
                      genre={categories?.[0] ?? null}
                      thumbnailUrl={imageLinks?.thumbnail ?? null}
                      onPress={goToDetails}
                      action={{
                        label: alreadySaved ? t('search.added') : t('search.add'),
                        disabled: alreadySaved,
                        onPress: goToDetails,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {searchStatus === 'done' && matches.length === 0 && (
            <View style={styles.section}>
              <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
                {t('recognizeCover.noMatchesTitle')}
              </ThemedText>
              <ThemedText style={[Typography.body, { color: textMutedColor }]}>
                {t('recognizeCover.noMatchesBody')}
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: surfaceMutedColor }]}
                onPress={handleReset}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('recognizeCover.retakePhoto')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: surfaceMutedColor }]}
                onPress={() => handlePick('gallery')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('recognizeCover.choosePhoto')}
                </ThemedText>
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: surfaceColor, shadowColor }]}
              onPress={goToAddManually}>
              <ThemedText style={[Typography.button, { color: accentColor }]}>
                {t('search.addManually')}
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  section: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  detectedTextBox: {
    borderRadius: 10,
    padding: 12,
  },
  resultsList: {
    gap: 10,
  },
});
