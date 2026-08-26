import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/BookCard';
import { SearchInput } from '@/components/SearchInput';
import { ThemedText } from '@/components/ThemedText';
import { Typography } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useQuickAddBook, useSearchBooks } from '@/features/search/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeGenres } from '@/lib/genres';
import { getErrorTranslationKey } from '@/api/google-books';
import type { GoogleBooksVolume } from '@/types/google-books';

export default function AddBookScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data: results, isLoading, isError, error, refetch } = useSearchBooks(debouncedQuery);
  const { data: libraryBooks } = useBooks();
  const { quickAdd, isAdding } = useQuickAddBook();

  const savedGoogleIds = useMemo(
    () => new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean)),
    [libraryBooks],
  );

  const hasSearched = debouncedQuery.trim().length > 0;

  async function handleQuickAdd(item: GoogleBooksVolume) {
    try {
      await quickAdd(item);
    } catch {
      Alert.alert(t('common.genericError'));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('search.placeholder')}
        returnKeyType="search"
        autoFocus
        style={styles.searchBox}
      />

      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.quickActionsRow}>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push('/scan-isbn')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.scanIsbn')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push({ pathname: '/recognize-cover', params: { pickSource: 'camera' } })}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.scanCover')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push({ pathname: '/recognize-cover', params: { pickSource: 'gallery' } })}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.uploadPhoto')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: surfaceMutedColor }]}
                onPress={() => router.push('/add-manually')}>
                <ThemedText style={[Typography.button, { color: textColor }]}>
                  {t('search.addManually')}
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

            {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={accentColor} />}

            {isError && (
              <View style={styles.centered}>
                <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
                  {t(getErrorTranslationKey(error))}
                </ThemedText>
                <Pressable
                  onPress={() => refetch()}
                  style={[styles.retryButton, { backgroundColor: accentColor }]}>
                  <ThemedText style={[Typography.button, { color: '#fff' }]}>{t('common.retry')}</ThemedText>
                </Pressable>
              </View>
            )}

            {hasSearched && !isLoading && !isError && (results?.length ?? 0) === 0 && (
              <View style={styles.centered}>
                <ThemedText style={[Typography.body, styles.centeredText, { color: textColor }]}>
                  {t('search.noResultsFor', { query: debouncedQuery })}
                </ThemedText>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const alreadySaved = savedGoogleIds.has(item.id);
          const adding = isAdding(item.id);
          const { title, authors, categories, imageLinks } = item.volumeInfo;
          return (
            <BookCard
              variant="result"
              title={title}
              author={authors?.join(', ') ?? null}
              genres={normalizeGenres(categories ?? [])}
              thumbnailUrl={imageLinks?.thumbnail ?? null}
              onPress={() => router.push(`/add/${item.id}`)}
              action={{
                label: alreadySaved ? t('search.added') : adding ? t('search.adding') : t('search.add'),
                disabled: alreadySaved || adding,
                onPress: () => handleQuickAdd(item),
              }}
            />
          );
        }}
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
});
