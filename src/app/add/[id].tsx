import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BookDetailsSection } from '@/components/BookDetailsSection';
import { BookHeader } from '@/components/BookHeader';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { GenreEditor } from '@/components/GenreEditor';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
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
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          style={[styles.retryButton, { backgroundColor: accentColor }]}>
          <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.retry')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { title, subtitle, authors, description, publishedDate, pageCount, publisher, language, imageLinks } =
    volume.volumeInfo;
  const coverUrl = toHttpsUrl(imageLinks?.thumbnail);
  const sanitizedDescription = description ? sanitizeDescription(description) : null;

  async function handleSave() {
    try {
      await addBook.mutateAsync({
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
      <BookHeader title={title} subtitle={subtitle} authors={authors ?? []} coverUrl={coverUrl} />

      {sanitizedDescription && <ExpandableDescription description={sanitizedDescription} />}

      <BookDetailsSection
        pageCount={pageCount ?? null}
        language={language ?? null}
        publisher={publisher ?? null}
        publishedDate={publishedDate ?? null}
      />

      <View style={styles.section}>
        <ThemedText style={[Typography.sectionTitle, { color: textColor }]}>
          {t('addConfirm.genres')}
        </ThemedText>
        <GenreEditor genres={genres} onChange={setGenres} />
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: accentColor }]}
        onPress={handleSave}
        disabled={addBook.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('addConfirm.save')}>
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
