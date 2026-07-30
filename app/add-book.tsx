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

function showComingSoon(feature: string) {
  Alert.alert('Coming soon', `${feature} isn't available yet.`);
}

export default function AddBookScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data: results, isLoading, isError, error } = useSearchBooks(debouncedQuery);
  const { data: libraryBooks } = useBooks();

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
          placeholder="Search by title, author, or ISBN"
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
          onPress={() => showComingSoon('Scan ISBN')}>
          <ThemedText style={{ color: colors.textPrimary, fontWeight: '600' }}>Scan ISBN</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.quickAction, { backgroundColor: colors.surfaceMuted }]}
          onPress={() => showComingSoon('Adding manually')}>
          <ThemedText style={{ color: colors.textPrimary, fontWeight: '600' }}>Add Manually</ThemedText>
        </Pressable>
      </View>

      {!hasSearched && (
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>Find a book</ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
            Search by title, author, or ISBN to add it to your TBR.
          </ThemedText>
        </View>
      )}

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />}

      {isError && (
        <View style={styles.centered}>
          <ThemedText style={{ color: colors.textPrimary, textAlign: 'center' }}>
            {error instanceof Error ? error.message : 'Something went wrong. Try again.'}
          </ThemedText>
        </View>
      )}

      {hasSearched && !isLoading && !isError && (results?.length ?? 0) === 0 && (
        <View style={styles.centered}>
          <ThemedText style={{ color: colors.textPrimary, textAlign: 'center' }}>
            No results for &quot;{debouncedQuery}&quot;.
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
          return (
            <BookCard
              title={title}
              author={authors?.join(', ') ?? null}
              genre={categories?.[0] ?? null}
              thumbnailUrl={imageLinks?.thumbnail ?? null}
              colors={colors}
              action={{
                label: alreadySaved ? 'Added' : 'Add to TBR',
                disabled: alreadySaved,
                onPress: () => router.push(`/add/${item.id}`),
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
