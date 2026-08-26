import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useAddBook } from '@/features/library/hooks';
import { useGoogleBookDetails } from '@/features/search/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';
import { GoogleBooksApiError, toHttpsUrl } from '@/lib/google-books';
import { sanitizeDescription } from '@/lib/sanitize-html';

export default function AddBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');

  const { data: volume, isLoading, isError, error, refetch } = useGoogleBookDetails(id);
  const addBook = useAddBook();
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    if (volume) {
      setGenres(normalizeGenres(volume.volumeInfo.categories ?? []));
    }
  }, [volume]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  if (isError || !volume) {
    const message =
      error instanceof GoogleBooksApiError && error.status === 429
        ? t('errors.rateLimit')
        : t('addConfirm.loadError');
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
          {message}
        </ThemedText>
        <Pressable onPress={() => refetch()} style={[styles.retryButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.retry')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { title, authors, description, publishedDate, pageCount, publisher, language, imageLinks } =
    volume.volumeInfo;
  const coverUrl = toHttpsUrl(imageLinks?.thumbnail);

  async function handleSave() {
    try {
      await addBook.mutateAsync({
        googleBooksId: volume!.id,
        title,
        authors: authors ?? [],
        genres,
        thumbnailUrl: coverUrl,
        description: description ? sanitizeDescription(description) : null,
        publishedDate: publishedDate ?? null,
        pageCount: pageCount ?? null,
        publisher: publisher ?? null,
        language: language ?? null,
      });
      // Collapse back to the main TBR screen regardless of how deep this
      // screen was reached (search, scan, or cover recognition), rather than
      // just popping one step back into an intermediate modal.
      router.dismissTo('/');
    } catch {
      Alert.alert(t('common.genericError'));
    }
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={(e) =>
              console.warn('[AddBook] cover failed to load:', coverUrl, e.nativeEvent.error)
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
          <ThemedText style={[Typography.bookTitle, { color: textColor }]}>{title}</ThemedText>
          {authors && authors.length > 0 && (
            <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
              {authors.join(', ')}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
          {t('addConfirm.genres')}
        </ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} />
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: accentColor }]}
        onPress={handleSave}
        disabled={addBook.isPending}>
        <ThemedText style={[Typography.button, styles.saveButtonText]}>
          {addBook.isPending ? t('addConfirm.saving') : t('addConfirm.save')}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  centeredText: {
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  section: {
    gap: 4,
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
  },
});
