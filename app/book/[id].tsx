import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GenreEditor } from '@/components/genre-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import {
  useBook,
  useDeleteBook,
  useUpdateBookGenres,
  useUpdateBookStatus,
} from '@/features/library/hooks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { READING_STATUS_LABELS, READING_STATUSES } from '@/types/book';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: book, isLoading } = useBook(id);
  const updateStatus = useUpdateBookStatus();
  const updateGenres = useUpdateBookGenres();
  const deleteBook = useDeleteBook();

  if (isLoading || !book) {
    return <ThemedView style={styles.centered} />;
  }

  function handleDelete() {
    Alert.alert('Remove book?', `"${book!.title}" will be removed from your TBR.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBook.mutateAsync(book!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {book.thumbnailUrl ? (
          <Image source={{ uri: book.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, { borderColor: colors.icon, borderWidth: 1 }]} />
        )}
        <View style={styles.headerText}>
          <ThemedText type="subtitle">{book.title}</ThemedText>
          {book.authors.length > 0 && (
            <ThemedText style={{ opacity: 0.7 }}>{book.authors.join(', ')}</ThemedText>
          )}
          {book.publishedDate && (
            <ThemedText style={{ opacity: 0.6 }}>{book.publishedDate}</ThemedText>
          )}
          {book.pageCount != null && (
            <ThemedText style={{ opacity: 0.6 }}>{book.pageCount} pages</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Status</ThemedText>
        <View style={styles.statusRow}>
          {READING_STATUSES.map((status) => {
            const isActive = status === book.status;
            return (
              <Pressable
                key={status}
                onPress={() => updateStatus.mutate({ id: book.id, status })}
                style={[
                  styles.statusChip,
                  { borderColor: colors.icon },
                  isActive && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}>
                <ThemedText style={isActive ? styles.statusChipTextActive : undefined}>
                  {READING_STATUS_LABELS[status]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Genres</ThemedText>
        <GenreEditor
          genres={book.genres}
          onChange={(genres) => updateGenres.mutate({ id: book.id, genres })}
        />
      </View>

      {book.description && (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Description</ThemedText>
          <ThemedText style={{ opacity: 0.8 }}>{book.description}</ThemedText>
        </View>
      )}

      <Pressable style={[styles.deleteButton, { borderColor: '#e5484d' }]} onPress={handleDelete}>
        <ThemedText style={{ color: '#e5484d', fontWeight: '600' }}>Remove from My TBR</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  centered: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  section: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
});
