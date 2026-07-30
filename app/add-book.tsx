import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/palette';
import { useBooks } from '@/features/library/hooks';
import { useSearchBooks } from '@/features/search/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';
import { getErrorTranslationKey } from '@/lib/google-books';

export default function AddBookScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data: results, isLoading, isError, error } = useSearchBooks(debouncedQuery);
  const { data: libraryBooks } = useBooks();

  function showComingSoon(feature: string) {
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonBody', { feature }));
  }

  const savedGoogleIds = useMemo(
    () => new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean)),
    [libraryBooks],
  );

  const hasSearched = debouncedQuery.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceMuted }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCorrect={false}
          returnKeyType="search"
          autoFocus
        />
      </View>

      <View style={styles.quickActionsRow}>
        <Pressable
          style={[styles.quickAction, { backgroundColor: colors.surfaceMuted }]}
          onPress={() => showComingSoon(t('search.scanIsbn'))}>
          <ThemedText style={{ color: colors.textPrimary, fontWeight: '600' }}>
            {t('search.scanIsbn')}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.quickAction, { backgroundColor: colors.surfaceMuted }]}
          onPress={() => showComingSoon(t('search.addManually'))}>
          <ThemedText style={{ color: colors.textPrimary, fontWeight: '600' }}>
            {t('search.addManually')}
          </ThemedText>
        </Pressable>
      </View>

      {!hasSearched && (
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('search.emptyTitle')}
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
            {t('search.emptyText')}
          </ThemedText>
        </View>
      )}

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />}

      {isError && (
        <View style={styles.centered}>
          <ThemedText style={{ color: colors.textPrimary, textAlign: 'center' }}>
            {t(getErrorTranslationKey(error))}
          </ThemedText>
        </View>
      )}

      {hasSearched && !isLoading && !isError && (results?.length ?? 0) === 0 && (
        <View style={styles.centered}>
          <ThemedText style={{ color: colors.textPrimary, textAlign: 'center' }}>
            {t('search.noResultsFor', { query: debouncedQuery })}
          </ThemedText>
        </View>
      )}

      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const alreadySaved = savedGoogleIds.has(item.id);
          const { title, authors, categories, imageLinks } = item.volumeInfo;
          const goToDetails = () => router.push(`/add/${item.id}`);
          return (
            <BookCard
              variant="result"
              title={title}
              author={authors?.join(', ') ?? null}
              genre={normalizeGenres(categories ?? [])[0] ?? null}
              thumbnailUrl={imageLinks?.thumbnail ?? null}
              colors={colors}
              onPress={goToDetails}
              action={{
                label: alreadySaved ? t('search.added') : t('search.add'),
                disabled: alreadySaved,
                onPress: goToDetails,
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
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickAction: {
    flex: 1,
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
