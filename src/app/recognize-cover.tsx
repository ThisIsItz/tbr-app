import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { useScreenHeaderOptions } from '@/components/navigation/use-screen-header-options';
import { Typography } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useQuickAddBook } from '@/features/search/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { scoreVolume } from '@/api/book-relevance';
import { searchGoogleBooks } from '@/api/google-books';
import { bookCoverRecognitionService, type RecognitionConfidence } from '@/api/recognition';
import type { GoogleBooksVolume } from '@/types/google-books';

type Stage = 'idle' | 'unsupported' | 'recognizing' | 'reviewing' | 'noText';
type SearchStatus = 'idle' | 'loading' | 'done';

// Minimum relevance score for a Google Books result to count as a match.
const MIN_RELIABLE_SCORE = 30;

export default function RecognizeCoverScreen() {
  const { pickSource } = useLocalSearchParams<{ pickSource?: 'camera' | 'gallery' }>();
  const { t } = useTranslation();
  const screenHeaderOptions = useScreenHeaderOptions();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  const [stage, setStage] = useState<Stage>(
    bookCoverRecognitionService.isSupported ? 'idle' : 'unsupported',
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<RecognitionConfidence>('low');
  const [source, setSource] = useState<'vision' | 'ocr'>('ocr');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [matches, setMatches] = useState<GoogleBooksVolume[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');

  const { data: libraryBooks } = useBooks();
  const savedGoogleIds = new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean));
  const { quickAdd, isAdding } = useQuickAddBook();

  async function handleQuickAdd(item: GoogleBooksVolume) {
    try {
      await quickAdd(item);
    } catch {
      Alert.alert(t('common.genericError'));
    }
  }

  async function handlePick(source: 'camera' | 'gallery') {
    try {
      if (source === 'camera' && !(await ensureCameraPermission())) {
        if (pickSource) router.back();
        return;
      }

      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) {
        if (pickSource) router.back();
        return;
      }

      const uri = result.assets[0]?.uri;
      if (!uri) return;

      setImageUri(uri);
      await recognizeCover(uri);
    } catch (error) {
      console.warn('[RecognizeCover] image pick failed:', error);
      Alert.alert(t('common.genericError'));
    }
  }

  const hasAutoTriggered = useRef(false);
  useEffect(() => {
    if (hasAutoTriggered.current || !pickSource) return;
    hasAutoTriggered.current = true;
    handlePick(pickSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickSource]);

  async function ensureCameraPermission(): Promise<boolean> {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) return true;

    const requested = current.canAskAgain ? await ImagePicker.requestCameraPermissionsAsync() : current;
    if (requested.granted) return true;

    Alert.alert(
      t('recognizeCover.cameraPermissionTitle'),
      t('recognizeCover.cameraPermissionBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('scanIsbn.openSettings'), onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  async function recognizeCover(uri: string) {
    setStage('recognizing');
    setMatches([]);
    setSearchStatus('idle');

    try {
      const result = await bookCoverRecognitionService.recognizeCover(uri);
      const guess = result.books[0];
      setTitle(guess?.title ?? '');
      setAuthor(guess?.author ?? '');
      setConfidence(guess?.confidence ?? 'low');
      setSource(result.source);

      if (result.books.length === 0) {
        setStage('noText');
        return;
      }
      setStage('reviewing');
      if (guess?.title) {
        void searchByTitle(guess.title);
      }
    } catch {
      setStage('noText');
    }
  }

  // Search/score by title only — mixing in the author breaks matching.
  async function searchByTitle(rawTitle: string) {
    const trimmedTitle = rawTitle.trim();
    if (!trimmedTitle) return;

    setSearchStatus('loading');
    try {
      const found = await searchGoogleBooks(trimmedTitle);
      const reliable = found.filter((volume) => scoreVolume(volume, trimmedTitle) >= MIN_RELIABLE_SCORE);
      setMatches(reliable);
    } catch {
      setMatches([]);
    } finally {
      setSearchStatus('done');
    }
  }

  async function handleSearch() {
    await searchByTitle(title);
  }

  function handleReset() {
    setStage(bookCoverRecognitionService.isSupported ? 'idle' : 'unsupported');
    setImageUri(null);
    setConfidence('low');
    setSource('ocr');
    setTitle('');
    setAuthor('');
    setMatches([]);
    setSearchStatus('idle');
  }

  function goToAddManually() {
    router.push({
      pathname: '/add-manually',
      params: {
        prefillTitle: title || undefined,
        prefillAuthor: author || undefined,
        prefillCoverUri: imageUri || undefined,
      },
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
      <Stack.Screen
        options={{
          title: pickSource === 'gallery' ? t('search.uploadPhoto') : t('screenTitles.recognizeCover'),
          ...screenHeaderOptions,
        }}
      />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={[styles.preview, { backgroundColor: surfaceMutedColor }]}
          resizeMode="contain"
        />
      )}

      {stage === 'unsupported' && !pickSource && (
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
                {t('recognizeCover.tryAnotherPhoto')}
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
            {source === 'ocr' && (
              <View style={[styles.noticeBox, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {t('recognizeCover.onDeviceFallbackNotice')}
                </ThemedText>
              </View>
            )}
            {confidence === 'low' && (
              <View style={[styles.noticeBox, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                  {t('recognizeCover.lowConfidenceNotice')}
                </ThemedText>
              </View>
            )}

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
              style={[
                styles.primaryButton,
                { backgroundColor: !title.trim() ? surfaceMutedColor : accentColor },
              ]}
              onPress={handleSearch}
              disabled={searchStatus === 'loading' || !title.trim()}>
              <ThemedText
                style={[Typography.button, { color: !title.trim() ? textMutedColor : '#fff' }]}>
                {t('recognizeCover.searchAgain')}
              </ThemedText>
            </Pressable>
          </View>

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
                  const adding = isAdding(item.id);
                  const { title: matchTitle, authors, categories, imageLinks } = item.volumeInfo;
                  return (
                    <BookCard
                      key={item.id}
                      variant="result"
                      title={matchTitle}
                      author={authors?.join(', ') ?? null}
                      genres={categories ?? []}
                      thumbnailUrl={imageLinks?.thumbnail ?? null}
                      onPress={() => router.push(`/add/${item.id}`)}
                      action={{
                        label: alreadySaved ? t('search.added') : adding ? t('search.adding') : t('search.add'),
                        disabled: alreadySaved || adding,
                        onPress: () => handleQuickAdd(item),
                      }}
                    />
                  );
                })}
              </View>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: surfaceMutedColor }]}
                onPress={goToAddManually}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('recognizeCover.noneOfThese')}
                </ThemedText>
              </Pressable>
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
              <Pressable
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={goToAddManually}>
                <ThemedText style={[Typography.button, { color: '#fff' }]}>
                  {t('search.addManually')}
                </ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: surfaceMutedColor }]}
              onPress={handleReset}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('recognizeCover.tryAnotherPhoto')}
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
    height: 320,
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
  noticeBox: {
    borderRadius: 10,
    padding: 12,
  },
  resultsList: {
    gap: 10,
  },
});
