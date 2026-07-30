import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { FilterSheet } from '@/components/filter-sheet';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { normalizeGenres } from '@/lib/genres';
import { type Book } from '@/types/book';

type SortBy = 'title' | 'author';

export default function MyTbrScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  const { data: books, isLoading } = useBooks();

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('title');

  const sortOptions = [
    { value: 'title', label: t('library.sortTitle') },
    { value: 'author', label: t('library.sortAuthor') },
  ];

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
      <SafeAreaView style={[styles.centered, { backgroundColor }]} edges={['top']}>
        <ActivityIndicator color={accentColor} />
      </SafeAreaView>
    );
  }

  const isLibraryEmpty = (books?.length ?? 0) === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={[Typography.screenTitle, { color: textColor }]}>
          {t('library.title')}
        </ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: surfaceMutedColor }]}>
            <IconSymbol name="gearshape.fill" size={20} color={textColor} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-book')}
            hitSlop={8}
            style={[styles.addButton, { backgroundColor: accentColor }]}>
            <IconSymbol name="plus.circle.fill" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: surfaceMutedColor }]}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('library.searchPlaceholder')}
          placeholderTextColor={textMutedColor}
          style={[Typography.body, styles.searchInput, { color: textColor }]}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        <FilterSheet
          label={t('library.genre')}
          selected={genreFilter}
          selectedLabel={genreFilter}
          disabled={allGenres.length === 0}
          onSelect={setGenreFilter}
          options={[
            { value: null, label: t('library.allGenres') },
            ...allGenres.map((g) => ({ value: g, label: g })),
          ]}
        />
        <FilterSheet
          label={t('library.author')}
          selected={authorFilter}
          selectedLabel={authorFilter}
          disabled={allAuthors.length === 0}
          onSelect={setAuthorFilter}
          options={[
            { value: null, label: t('library.allAuthors') },
            ...allAuthors.map((a) => ({ value: a, label: a })),
          ]}
        />
        <FilterSheet
          label={t('library.sort')}
          staticLabel
          selected={sortBy}
          onSelect={(value) => setSortBy((value as SortBy) ?? 'title')}
          options={sortOptions}
        />
      </View>

      {isLibraryEmpty ? (
        <View style={styles.centered}>
          <ThemedText style={[Typography.bookTitle, styles.centeredText, { color: textColor }]}>
            {t('library.emptyTitle')}
          </ThemedText>
          <ThemedText style={[Typography.metadata, styles.centeredText, { color: textMutedColor }]}>
            {t('library.emptyText')}
          </ThemedText>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={[Typography.bookTitle, styles.centeredText, { color: textColor }]}>
            {t('library.noMatchTitle')}
          </ThemedText>
          <ThemedText style={[Typography.metadata, styles.centeredText, { color: textMutedColor }]}>
            {t('library.noMatchText')}
          </ThemedText>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} style={[styles.clearButton, { backgroundColor: accentColor }]}>
              <ThemedText style={[Typography.button, { color: '#fff' }]}>
                {t('library.clearFilters')}
              </ThemedText>
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
              statusLabel={t(`status.${item.status}`)}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => router.push(`/book/${item.id}`)}
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
  centeredText: {
    textAlign: 'center',
  },
  header: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
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
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 14,
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
