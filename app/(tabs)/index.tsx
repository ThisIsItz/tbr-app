import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { FilterSheet } from '@/components/filter-sheet';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/palette';
import { useBooks } from '@/features/library/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { normalizeGenres } from '@/lib/genres';
import { READING_STATUS_LABELS, type Book } from '@/types/book';

type SortBy = 'title' | 'author';

const SORT_OPTIONS = [
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'author', label: 'Author (A–Z)' },
];

export default function MyTbrScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Palette[colorScheme];

  const { data: books, isLoading } = useBooks();

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('title');

  const genresByBookId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const book of books ?? []) {
      map.set(book.id, normalizeGenres(book.genres));
    }
    return map;
  }, [books]);

  const allGenres = useMemo(
    () =>
      Array.from(new Set([...genresByBookId.values()].flat())).sort((a, b) => a.localeCompare(b)),
    [genresByBookId],
  );
  const allAuthors = useMemo(
    () =>
      Array.from(new Set(books?.flatMap((book) => book.authors) ?? [])).sort((a, b) => a.localeCompare(b)),
    [books],
  );

  const hasActiveFilters = !!genreFilter || !!authorFilter || searchQuery.trim().length > 0;

  const filteredBooks = useMemo(() => {
    let list = books ?? [];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.authors.some((author) => author.toLowerCase().includes(query)),
      );
    }
    if (genreFilter) {
      list = list.filter((book) => genresByBookId.get(book.id)?.includes(genreFilter));
    }
    if (authorFilter) list = list.filter((book) => book.authors.includes(authorFilter));

    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return (a.authors[0] ?? '').localeCompare(b.authors[0] ?? '');
    });
  }, [books, searchQuery, genreFilter, authorFilter, sortBy, genresByBookId]);

  function clearFilters() {
    setSearchQuery('');
    setGenreFilter(null);
    setAuthorFilter(null);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const isLibraryEmpty = (books?.length ?? 0) === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.textPrimary }]}>My TBR</ThemedText>
        <Pressable
          onPress={() => router.push('/add-book')}
          hitSlop={8}
          style={[styles.addButton, { backgroundColor: colors.accent }]}>
          <IconSymbol name="plus.circle.fill" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceMuted }]}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your TBR"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        <FilterSheet
          label="Genre"
          colors={colors}
          selected={genreFilter}
          selectedLabel={genreFilter}
          disabled={allGenres.length === 0}
          onSelect={setGenreFilter}
          options={[{ value: null, label: 'All genres' }, ...allGenres.map((g) => ({ value: g, label: g }))]}
        />
        <FilterSheet
          label="Author"
          colors={colors}
          selected={authorFilter}
          selectedLabel={authorFilter}
          disabled={allAuthors.length === 0}
          onSelect={setAuthorFilter}
          options={[{ value: null, label: 'All authors' }, ...allAuthors.map((a) => ({ value: a, label: a }))]}
        />
        <FilterSheet
          label="Sort"
          colors={colors}
          staticLabel
          selected={sortBy}
          onSelect={(value) => setSortBy((value as SortBy) ?? 'title')}
          options={SORT_OPTIONS}
        />
      </View>

      {isLibraryEmpty ? (
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Nothing saved yet
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
            Tap + to add a book you want to read.
          </ThemedText>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>No books match</ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
            Try adjusting your search or filters.
          </ThemedText>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} style={[styles.clearButton, { backgroundColor: colors.accent }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Clear filters</ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item: Book) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BookCard
              title={item.title}
              author={item.authors.join(', ') || null}
              genre={genresByBookId.get(item.id)?.[0] ?? null}
              statusLabel={READING_STATUS_LABELS[item.status]}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => router.push(`/book/${item.id}`)}
              colors={colors}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    marginTop: 14,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
});
