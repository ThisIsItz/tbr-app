import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/BookCard';
import { FilterSheet } from '@/components/FilterSheet';
import { MultiFilterSheet } from '@/components/MultiFilterSheet';
import { SearchInput } from '@/components/SearchInput';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/IconSymbol';
import { Typography } from '@/lib/theme/theme';
import { useBooks } from '@/hooks/useLibrary';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeGenres } from '@/lib/genres';
import { type Book } from '@/types/book';

type SortBy = 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc' | 'recent';

export default function MyTbrScreen() {
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');
  const accentColor = useThemeColor({}, 'accent');
  const onAccentColor = useThemeColor({}, 'onAccent');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  const insets = useSafeAreaInsets();
  const { data: books, isLoading } = useBooks();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('title-asc');

  const sortOptions = [
    { value: 'recent', label: t('library.sortRecent') },
    { value: 'title-asc', label: t('library.sortTitleAsc') },
    { value: 'title-desc', label: t('library.sortTitleDesc') },
    { value: 'author-asc', label: t('library.sortAuthorAsc') },
    { value: 'author-desc', label: t('library.sortAuthorDesc') },
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

  const hasActiveFilters = genreFilters.length > 0 || !!authorFilter || debouncedSearchQuery.trim().length > 0;
  const totalBookCount = books?.length ?? 0;

  const filteredBooks = useMemo(() => {
    let list = books ?? [];

    const query = debouncedSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.authors.some((author) => author.toLowerCase().includes(query)) ||
          genresByBookId.get(book.id)?.some((genre) => genre.toLowerCase().includes(query)),
      );
    }
    if (genreFilters.length > 0) {
      // A book matches if it has any of the selected genres.
      list = list.filter((book) => genresByBookId.get(book.id)?.some((g) => genreFilters.includes(g)));
    }
    if (authorFilter) list = list.filter((book) => book.authors.includes(authorFilter));

    if (sortBy === 'recent') {
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const [field, direction] = sortBy.split('-') as ['title' | 'author', 'asc' | 'desc'];
    const sorted = [...list].sort((a, b) => {
      const aValue = field === 'title' ? a.title : (a.authors[0] ?? '');
      const bValue = field === 'title' ? b.title : (b.authors[0] ?? '');
      return aValue.localeCompare(bValue);
    });
    return direction === 'desc' ? sorted.reverse() : sorted;
  }, [books, debouncedSearchQuery, genreFilters, authorFilter, sortBy, genresByBookId]);

  const activeFilterLabels = [
    ...genreFilters,
    ...(authorFilter ? [authorFilter] : []),
    ...(debouncedSearchQuery.trim() ? [`"${debouncedSearchQuery.trim()}"`] : []),
  ];

  const bookCountLabel = hasActiveFilters
    ? t(totalBookCount === 1 ? 'library.bookCountFilteredOne' : 'library.bookCountFilteredOther', {
        count: filteredBooks.length,
        total: totalBookCount,
      })
    : t(totalBookCount === 1 ? 'library.bookCountOne' : 'library.bookCountOther', {
        count: totalBookCount,
      });

  function clearFilters() {
    setSearchQuery('');
    setGenreFilters([]);
    setAuthorFilter(null);
  }

  // Reset filters once the library is empty, so they don't hide new books.
  const isLibraryEmpty = (books?.length ?? 0) === 0;
  useEffect(() => {
    if (!isLibraryEmpty) return;
    setSearchQuery('');
    setGenreFilters([]);
    setAuthorFilter(null);
    setSortBy('title-asc');
  }, [isLibraryEmpty]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor }]} edges={['top']}>
        <ActivityIndicator color={accentColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <ThemedText style={[Typography.screenTitle, { color: textColor }]}>
            {t('library.title')}
          </ThemedText>
          {!isLibraryEmpty && (
            <ThemedText style={[Typography.metadata, { color: textMutedColor }]}>
              {bookCountLabel}
            </ThemedText>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            style={[styles.iconButton, { backgroundColor: surfaceMutedColor }]}>
            <Settings size={20} color={textColor} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      {!isLibraryEmpty && (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('library.searchPlaceholder')}
            style={styles.searchBox}
          />

          <View style={styles.filterRow}>
            <MultiFilterSheet
              label={t('library.genre')}
              selected={genreFilters}
              disabled={allGenres.length === 0}
              onChange={setGenreFilters}
              options={allGenres}
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
              onSelect={(value) => setSortBy((value as SortBy) ?? 'title-asc')}
              options={sortOptions}
            />
          </View>

          {hasActiveFilters && (
            <View style={[styles.activeFiltersRow, { backgroundColor: surfaceMutedColor }]}>
              <ThemedText
                numberOfLines={1}
                style={[Typography.caption, styles.activeFiltersText, { color: textMutedColor }]}>
                {t('library.filteringBy', { filters: activeFilterLabels.join(', ') })}
              </ThemedText>
              <Pressable
                onPress={clearFilters}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('library.clearFilters')}>
                <IconSymbol name="xmark.circle.fill" size={18} color={textMutedColor} />
              </Pressable>
            </View>
          )}
        </>
      )}

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
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel={t('library.clearFilters')}
              style={[styles.clearButton, { backgroundColor: surfaceMutedColor }]}>
              <ThemedText style={[Typography.button, { color: accentColor }]}>
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
              genres={genresByBookId.get(item.id) ?? []}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => router.push(`/book/${item.id}`)}
            />
          )}
        />
      )}

      <View style={[styles.floatingAddWrapper, { bottom: insets.bottom + 28 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/add/book')}
          accessibilityRole="button"
          accessibilityLabel={t('library.addBook')}
          style={[styles.floatingAddButton, { backgroundColor: accentColor, shadowColor: textColor }]}>
          <IconSymbol name="plus.circle.fill" size={28} color={onAccentColor} />
          <ThemedText style={[Typography.button, styles.floatingAddButtonText, { color: onAccentColor }]}>
            {t('library.addBook')}
          </ThemedText>
        </Pressable>
      </View>
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
  titleColumn: {
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeFiltersText: {
    flexShrink: 1,
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
    paddingBottom: 88,
  },
  floatingAddWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 28,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingAddButtonText: {
    fontSize: 18,
    lineHeight: 24,
  },
});
