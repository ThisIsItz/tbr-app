import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BookHero } from '@/components/BookHero';
import { BookHeroSkeleton } from '@/components/BookHeroSkeleton';
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
import { GoogleBooksApiError, toHttpsUrl } from '@/api/googleBooks';
import { sanitizeDescription } from '@/lib/sanitizeHtml';

export default function AddBookScreen() {
  const { id, fallbackGenres } = useLocalSearchParams<{ id: string; fallbackGenres?: string }>();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');

  const { data: volume, isLoading, isError, error, refetch } = useGoogleBookDetails(id);
  const addBook = useAddBook();
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    if (!volume) return;
    if (volume.volumeInfo.categories?.length) {
      setGenres(normalizeGenres(volume.volumeInfo.categories));
      return;
    }
    // The detail-by-id endpoint sometimes omits categories that the search
    // results did include; fall back to what the search list already had.
    try {
      const parsed = fallbackGenres ? JSON.parse(fallbackGenres) : [];
      setGenres(normalizeGenres(Array.isArray(parsed) ? parsed : []));
    } catch {
      setGenres([]);
    }
  }, [volume, fallbackGenres]);

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
        <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
          {message}
        </ThemedText>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          style={[styles.retryButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('common.retry')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { title, subtitle, authors, description, publishedDate, pageCount, publisher, language, imageLinks } =
    volume.volumeInfo;
  const coverUrl = toHttpsUrl(imageLinks?.thumbnail);
  const sanitizedDescription = description ? sanitizeDescription(description) : null;

  function handleSave() {
    addBook.mutate({
      googleBooksId: volume!.id,
      title,
      subtitle: subtitle ?? null,
      authors: authors ?? [],
      genres,
      thumbnailUrl: coverUrl,
      description: sanitizedDescription,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
      publisher: publisher ?? null,
      language: language ?? null,
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
        coverUrl={coverUrl}
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
          <GenreEditor genres={genres} onChange={setGenres} />
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
