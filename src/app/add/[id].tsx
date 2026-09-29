import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BookHero } from '@/components/BookHero';
import { BookHeroSkeleton } from '@/components/BookHeroSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { GenreEditor } from '@/components/GenreEditor';
import { Skeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useAddBook } from '@/hooks/useLibrary';
import { useGoogleBookDetails } from '@/hooks/useSearch';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeGenres } from '@/lib/genres';
import { extractIsbnsFromVolume, normalizeIsbn13 } from '@/lib/isbn';
import { GoogleBooksApiError, toHighResUrl, toHttpsUrl } from '@/api/googleBooks';
import { sanitizeDescription } from '@/lib/sanitizeHtml';
import type { GoogleBooksVolume } from '@/types/google-books';

export default function AddBookScreen() {
  const { id, volume: volumeParam, scannedIsbn13 } = useLocalSearchParams<{
    id: string;
    volume?: string;
    scannedIsbn13?: string;
  }>();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');

  const initialVolume = useMemo<GoogleBooksVolume | undefined>(() => {
    if (!volumeParam) return undefined;
    try {
      return JSON.parse(volumeParam) as GoogleBooksVolume;
    } catch {
      return undefined;
    }
  }, [volumeParam]);

  const { data: volume, isLoading, isError, error, refetch } = useGoogleBookDetails(id, initialVolume);
  const addBook = useAddBook();
  const [genres, setGenres] = useState<string[]>(() => normalizeGenres(initialVolume?.volumeInfo.categories ?? []));
  const [manualGenres, setManualGenres] = useState<string[]>([]);

  useEffect(() => {
    if (initialVolume || !volume?.volumeInfo.categories?.length) return;
    setGenres(normalizeGenres(volume.volumeInfo.categories));
  }, [volume, initialVolume]);

  if (isLoading) {
    return (
      <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <BookHeroSkeleton onBack={() => router.back()} />
        <View style={styles.content}>
          <View style={styles.section}>
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} style={styles.gapTop} />
            <Skeleton width="70%" height={14} style={styles.gapTop} />
          </View>
          <View style={styles.section}>
            <Skeleton width={80} height={18} />
            <View style={styles.skeletonChipRow}>
              <Skeleton width={70} height={28} borderRadius={14} />
              <Skeleton width={100} height={28} borderRadius={14} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (isError || !volume) {
    const message =
      error instanceof GoogleBooksApiError && error.status === 429
        ? t('errors.rateLimit')
        : t('addConfirm.loadError');
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ErrorRetry message={message} onRetry={() => refetch()} />
      </View>
    );
  }

  const { title, subtitle, authors, description, publishedDate, pageCount, publisher, language, imageLinks } =
    volume.volumeInfo;
  const coverUrl = toHttpsUrl(imageLinks?.thumbnail);
  const previewCoverUrl = toHighResUrl(imageLinks?.thumbnail);
  const sanitizedDescription = description ? sanitizeDescription(description) : null;

  function handleSave() {
    const extracted = extractIsbnsFromVolume(volume!);
    // The scanned barcode outranks Google's isbn13 — it can be a different edition.
    const scannedIsbn = scannedIsbn13 ? normalizeIsbn13(scannedIsbn13) : null;

    addBook.mutate({
      googleBooksId: volume!.id,
      title,
      subtitle: subtitle ?? null,
      authors: authors ?? [],
      genres,
      manualGenres,
      thumbnailUrl: coverUrl,
      description: sanitizedDescription,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
      publisher: publisher ?? null,
      language: language ?? null,
      isbn13: scannedIsbn ?? extracted.isbn13,
      isbn10: extracted.isbn10,
      notes: null,
    });
    router.dismissTo('/');
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <BookHero
        title={title}
        subtitle={subtitle}
        authors={authors ?? []}
        coverUrl={previewCoverUrl}
        pageCount={pageCount}
        language={language}
        publishedDate={publishedDate}
        onBack={() => router.back()}
        bottomRight={
          <Pressable
            style={styles.addPill}
            onPress={handleSave}
            disabled={addBook.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('addConfirm.save')}>
            <ThemedText style={[Typography.button, { color: accentColor }]}>{t('search.add')}</ThemedText>
          </Pressable>
        }
      />

      <View style={styles.content}>
        {sanitizedDescription && <ExpandableDescription description={sanitizedDescription} />}

        <View style={styles.section}>
          <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
            {t('addConfirm.genres')}
          </ThemedText>
          <GenreEditor
            genres={genres}
            manualGenres={manualGenres}
            onChange={(updatedGenres, updatedManualGenres) => {
              setGenres(updatedGenres);
              setManualGenres(updatedManualGenres);
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  content: {
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
  section: {
    gap: 4,
  },
  gapTop: {
    marginTop: 6,
  },
  skeletonChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
