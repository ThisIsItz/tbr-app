import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useBooks } from '@/features/library/hooks';
import { useSearchBooks } from '@/features/search/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { GoogleBooksVolume } from '@/types/google-books';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data: results, isLoading, isError, error } = useSearchBooks(debouncedQuery);
  const { data: libraryBooks } = useBooks();

  const savedGoogleIds = useMemo(
    () => new Set(libraryBooks?.map((book) => book.googleBooksId).filter(Boolean)),
    [libraryBooks],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by title, author, or keyword"
        placeholderTextColor={colors.icon}
        style={[styles.searchInput, { color: colors.text, borderColor: colors.icon }]}
        autoCorrect={false}
        returnKeyType="search"
      />

      {isLoading && <ActivityIndicator style={styles.centered} />}
      {isError && (
        <ThemedText style={styles.centered}>
          {error instanceof Error ? error.message : 'Something went wrong. Try again.'}
        </ThemedText>
      )}
      {!isLoading && !isError && debouncedQuery.length > 0 && (results?.length ?? 0) === 0 && (
        <ThemedText style={styles.centered}>No results for &quot;{debouncedQuery}&quot;.</ThemedText>
      )}

      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SearchResultRow volume={item} alreadySaved={savedGoogleIds.has(item.id)} colors={colors} />
        )}
      />
    </SafeAreaView>
  );
}

function SearchResultRow({
  volume,
  alreadySaved,
  colors,
}: {
  volume: GoogleBooksVolume;
  alreadySaved: boolean;
  colors: (typeof Colors)['light'];
}) {
  const { title, authors, imageLinks } = volume.volumeInfo;

  return (
    <Pressable
      style={styles.row}
      disabled={alreadySaved}
      onPress={() => router.push(`/add/${volume.id}`)}>
      {imageLinks?.thumbnail ? (
        <Image source={{ uri: imageLinks.thumbnail }} style={styles.thumbnail} contentFit="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { borderColor: colors.icon }]} />
      )}
      <View style={styles.rowText}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {title}
        </ThemedText>
        {authors && authors.length > 0 && (
          <ThemedText numberOfLines={1} style={{ opacity: 0.7 }}>
            {authors.join(', ')}
          </ThemedText>
        )}
      </View>
      <IconSymbol
        name={alreadySaved ? 'checkmark.circle.fill' : 'plus.circle.fill'}
        size={28}
        color={alreadySaved ? colors.tint : colors.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  centered: {
    textAlign: 'center',
    marginTop: 24,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 72,
    borderRadius: 4,
  },
  thumbnailPlaceholder: {
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
  },
});
