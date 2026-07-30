import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { READING_STATUS_LABELS, READING_STATUSES, type Book, type ReadingStatus } from '@/types/book';

type StatusFilter = ReadingStatus | 'all';
type SortBy = 'title' | 'author';

export default function MyTbrScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: books, isLoading } = useBooks();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('title');

  const allGenres = useMemo(
    () => Array.from(new Set(books?.flatMap((book) => book.genres) ?? [])).sort((a, b) => a.localeCompare(b)),
    [books],
  );
  const allAuthors = useMemo(
    () => Array.from(new Set(books?.flatMap((book) => book.authors) ?? [])).sort((a, b) => a.localeCompare(b)),
    [books],
  );

  const filteredBooks = useMemo(() => {
    let list = books ?? [];
    if (statusFilter !== 'all') list = list.filter((book) => book.status === statusFilter);
    if (genreFilter) list = list.filter((book) => book.genres.includes(genreFilter));
    if (authorFilter) list = list.filter((book) => book.authors.includes(authorFilter));

    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return (a.authors[0] ?? '').localeCompare(b.authors[0] ?? '');
    });
  }, [books, statusFilter, genreFilter, authorFilter, sortBy]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const isLibraryEmpty = (books?.length ?? 0) === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.filters}>
        <ChipRow
          options={[{ value: 'all', label: 'All' }, ...READING_STATUSES.map((status) => ({
            value: status,
            label: READING_STATUS_LABELS[status],
          }))]}
          selected={statusFilter}
          onSelect={(value) => setStatusFilter(value as StatusFilter)}
          colors={colors}
        />

        {allGenres.length > 0 && (
          <ChipRow
            options={[{ value: null, label: 'All genres' }, ...allGenres.map((g) => ({ value: g, label: g }))]}
            selected={genreFilter}
            onSelect={(value) => setGenreFilter(value as string | null)}
            colors={colors}
          />
        )}

        {allAuthors.length > 0 && (
          <ChipRow
            options={[{ value: null, label: 'All authors' }, ...allAuthors.map((a) => ({ value: a, label: a }))]}
            selected={authorFilter}
            onSelect={(value) => setAuthorFilter(value as string | null)}
            colors={colors}
          />
        )}

        <View style={styles.sortRow}>
          <ThemedText style={{ opacity: 0.7 }}>Sort by:</ThemedText>
          <Pressable onPress={() => setSortBy('title')}>
            <ThemedText style={sortBy === 'title' ? { color: colors.tint, fontWeight: '600' } : undefined}>
              Title
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setSortBy('author')}>
            <ThemedText style={sortBy === 'author' ? { color: colors.tint, fontWeight: '600' } : undefined}>
              Author
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {isLibraryEmpty ? (
        <View style={styles.centered}>
          <ThemedText style={{ textAlign: 'center' }}>
            Your TBR is empty.{'\n'}Search for books to add them.
          </ThemedText>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText>No books match these filters.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <BookRow book={item} colors={colors} />}
        />
      )}
    </SafeAreaView>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
  colors,
}: {
  options: { value: string | null; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.label}
            onPress={() => onSelect(option.value)}
            style={[
              styles.chip,
              { borderColor: colors.icon },
              isActive && { backgroundColor: colors.tint, borderColor: colors.tint },
            ]}>
            <ThemedText style={isActive ? styles.chipTextActive : undefined}>{option.label}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function BookRow({ book, colors }: { book: Book; colors: (typeof Colors)['light'] }) {
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/book/${book.id}`)}>
      {book.thumbnailUrl ? (
        <Image source={{ uri: book.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
      ) : (
        <View style={[styles.thumbnail, { borderColor: colors.icon, borderWidth: 1 }]} />
      )}
      <View style={styles.rowText}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {book.title}
        </ThemedText>
        {book.authors.length > 0 && (
          <ThemedText numberOfLines={1} style={{ opacity: 0.7 }}>
            {book.authors.join(', ')}
          </ThemedText>
        )}
        <ThemedText style={[styles.statusBadge, { color: colors.tint }]}>
          {READING_STATUS_LABELS[book.status]}
        </ThemedText>
      </View>
    </Pressable>
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
  },
  filters: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingTop: 4,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 72,
    borderRadius: 4,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
