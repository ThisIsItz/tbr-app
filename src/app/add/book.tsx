import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/BookCard';
import { SearchInput } from '@/components/SearchInput';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/lib/theme/theme';
import { useBooks } from '@/hooks/useLibrary';
import { useQuickAddBook, useSearchBooks } from '@/hooks/useSearch';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { showAlert } from '@/lib/dialog';
import { getErrorTranslationKey } from '@/api/googleBooks';
import type { GoogleBooksVolume } from '@/types/google-books';

const INITIAL_RESULTS_LIMIT = 8;

export default function AddBookScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULTS_LIMIT);

  const { data: results, isLoading, isError, error, refetch } = useSearchBooks(submittedQuery);
  const { data: libraryBooks } = useBooks();
  const { quickAdd, isAdding } = useQuickAddBook();

  const savedGoogleIds = useMemo(
    () => new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean)),
    [libraryBooks],
  );

  const hasSearched = submittedQuery.trim().length > 0;
  const visibleResults = results?.slice(0, visibleCount);
  const hiddenResultsCount = (results?.length ?? 0) - (visibleResults?.length ?? 0);
  const nextBatchSize = Math.min(INITIAL_RESULTS_LIMIT, hiddenResultsCount);

  function handleSubmitSearch() {
    setSubmittedQuery(query);
    setVisibleCount(INITIAL_RESULTS_LIMIT);
  }

  async function handleQuickAdd(item: GoogleBooksVolume) {
    try {
      await quickAdd(item);
    } catch {
      showAlert(t('common.genericError'), undefined, t('common.ok'));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSubmitSearch}
        placeholder={t('search.placeholder')}
        returnKeyType="search"
        autoFocus
        style={styles.searchBox}
      />

      <FlatList
        data={visibleResults ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.quickActionsRow}>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push('/add/scan-isbn')}
                accessibilityRole="button"
                accessibilityLabel={t('search.scanIsbn')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.scanIsbn')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push('/add/manually')}
                accessibilityRole="button"
                accessibilityLabel={t('search.addManually')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.addManually')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push({ pathname: '/add/recognize-cover', params: { pickSource: 'gallery' } })}
                accessibilityRole="button"
                accessibilityLabel={t('search.uploadPhoto')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.uploadPhoto')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push({ pathname: '/add/recognize-cover', params: { pickSource: 'camera' } })}
                accessibilityRole="button"
                accessibilityLabel={t('search.scanCover')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.scanCover')}
                </ThemedText>
              </Pressable>
            </View>

            {!hasSearched && (
              <View style={styles.centered}>
                <ThemedText style={[Typography.bookTitle, { color: textColor }]}>
                  {t('search.emptyTitle')}
                </ThemedText>
                <ThemedText style={[Typography.metadata, styles.centeredText, { color: textMutedColor }]}>
                  {t('search.emptyText')}
                </ThemedText>
              </View>
            )}

            {isLoading && (
              <View style={styles.centered}>
                <ActivityIndicator color={accentColor} />
                <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
                  {t('search.searching')}
                </ThemedText>
              </View>
            )}

            {isError && (
              <View style={styles.centered}>
                <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
                  {t(getErrorTranslationKey(error))}
                </ThemedText>
                <Pressable
                  onPress={() => refetch()}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.retry')}
                  style={[styles.retryButton, { backgroundColor: accentColor }]}>
                  <ThemedText style={[Typography.button, { color: onAccentColor }]}>{t('common.retry')}</ThemedText>
                </Pressable>
              </View>
            )}

            {hasSearched && !isLoading && !isError && (results?.length ?? 0) === 0 && (
              <View style={styles.centered}>
                <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
                  {t('search.noResultsFor', { query: submittedQuery })}
                </ThemedText>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const alreadySaved = savedGoogleIds.has(item.id);
          const adding = isAdding(item.id);
          const { title, authors, imageLinks } = item.volumeInfo;
          return (
            <BookCard
              variant="result"
              title={title}
              author={authors?.join(', ') ?? null}
              thumbnailUrl={imageLinks?.thumbnail ?? null}
              onPress={() =>
                router.push({
                  pathname: '/add/[id]',
                  params: { id: item.id, volume: JSON.stringify(item) },
                })
              }
              action={{
                label: alreadySaved ? t('search.added') : t('search.add'),
                disabled: alreadySaved || adding,
                onPress: () => handleQuickAdd(item),
              }}
            />
          );
        }}
        ListFooterComponent={
          hiddenResultsCount > 0 ? (
            <Pressable
              style={[styles.showMoreButton, { backgroundColor: surfaceMutedColor }]}
              onPress={() => setVisibleCount((count) => count + INITIAL_RESULTS_LIMIT)}
              accessibilityRole="button"
              accessibilityLabel={t('search.showMore')}>
              <ThemedText style={[Typography.button, { color: textColor }]}>
                {t('search.showMore')} ({nextBatchSize})
              </ThemedText>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBox: {
    marginTop: 12,
  },
  listHeader: {
    gap: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  centeredText: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  listContent: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 24,
  },
  showMoreButton: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
