import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { scoreVolume } from '@/lib/book-relevance';
import { searchGoogleBooks } from '@/lib/google-books';
import { bookCoverRecognitionService, type RecognitionConfidence } from '@/lib/recognition';
import type { GoogleBooksVolume } from '@/types/google-books';

// Stages of the flow. "reviewing" covers both the matches-found and
// no-matches-found cases — the editable fields and detected text stay on
// screen either way so the user is never left at a dead end.
type Stage = 'idle' | 'unsupported' | 'recognizing' | 'reviewing' | 'noText';
type SearchStatus = 'idle' | 'loading' | 'done';

// A recognized title/author is only ever a suggestion (see
// lib/recognition) — before showing a Google Books result as a plausible
// match, its relevance score against the searched text must clear this bar
// (the score for merely containing the query's words in title order).
// Anything below this is discarded rather than shown as a "match."
const MIN_RELIABLE_SCORE = 30;

export default function RecognizeCoverScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  const [stage, setStage] = useState<Stage>(
    bookCoverRecognitionService.isSupported ? 'idle' : 'unsupported',
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string[]>([]);
  const [isRawTextExpanded, setRawTextExpanded] = useState(false);
  const [confidence, setConfidence] = useState<RecognitionConfidence>('low');
  const [source, setSource] = useState<'vision' | 'ocr'>('ocr');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [matches, setMatches] = useState<GoogleBooksVolume[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');

  const { data: libraryBooks } = useBooks();
  const savedGoogleIds = new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean));

  async function handlePick(source: 'camera' | 'gallery') {
    try {
      if (source === 'camera' && !(await ensureCameraPermission())) {
        return;
      }

      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;

      const uri = result.assets[0]?.uri;
      if (!uri) return;

      setImageUri(uri);
      await recognizeCover(uri);
    } catch (error) {
      // Covers permission rejections and any other native picker failure —
      // without this, an unhandled rejection here crashes the whole screen.
      console.warn('[RecognizeCover] image pick failed:', error);
      Alert.alert(t('common.genericError'));
    }
  }

  // Checks (and if needed, requests) camera permission up front so a denial
  // shows a friendly prompt instead of letting launchCameraAsync reject.
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

  // OCR only produces a *suggestion* — this never searches on its own. The
  // user always reviews (and can edit) the guessed title/author, then
  // explicitly triggers the search themselves via handleSearch.
  async function recognizeCover(uri: string) {
    setStage('recognizing');
    setRawText([]);
    setRawTextExpanded(false);
    setMatches([]);
    setSearchStatus('idle');

    try {
      const result = await bookCoverRecognitionService.recognizeCover(uri);
      const guess = result.books[0];
      setRawText(result.rawText ?? []);
      setTitle(guess?.title ?? '');
      setAuthor(guess?.author ?? '');
      setConfidence(guess?.confidence ?? 'low');
      setSource(result.source);

      if (result.books.length === 0) {
        setStage('noText');
        return;
      }
      setStage('reviewing');
    } catch {
      setStage('noText');
    }
  }

  async function handleSearch() {
    const query = [title, author]
      .map((v) => v.trim())
      .filter(Boolean)
      .join(' ');
    if (!query) return;

    setSearchStatus('loading');
    try {
      const found = await searchGoogleBooks(query);
      // Validate against Google Books rather than trusting the guess: only
      // results that actually resemble the searched title/author are shown.
      const reliable = found.filter((volume) => scoreVolume(volume, query) >= MIN_RELIABLE_SCORE);
      setMatches(reliable);
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
    setRawTextExpanded(false);
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

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={[styles.preview, { backgroundColor: surfaceMutedColor }]}
          resizeMode="contain"
        />
      )}

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
                {t('recognizeCover.searchWithDetails')}
              </ThemedText>
            </Pressable>
          </View>

          {rawText.length > 0 && (
            <View style={styles.section}>
              <Pressable
                style={styles.detectedTextToggle}
                onPress={() => setRawTextExpanded((expanded) => !expanded)}>
                <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
                  {t('recognizeCover.detectedTextLabel')}
                </ThemedText>
                <IconSymbol
                  name={isRawTextExpanded ? 'chevron.down' : 'chevron.right'}
                  size={16}
                  color={textMutedColor}
                />
              </Pressable>
              {isRawTextExpanded && (
                <View style={[styles.detectedTextBox, { backgroundColor: surfaceMutedColor }]}>
                  <ThemedText style={[Typography.caption, { color: textMutedColor }]}>
                    {rawText.join('  ·  ')}
                  </ThemedText>
                </View>
              )}
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
  detectedTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectedTextBox: {
    borderRadius: 10,
    padding: 12,
  },
  resultsList: {
    gap: 10,
  },
});
