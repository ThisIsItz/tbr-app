import { useQuery } from '@tanstack/react-query';

import { useAddBook } from '@/hooks/useLibrary';
import { normalizeGenres } from '@/lib/genres';
import { getGoogleBookById, searchGoogleBooks, toHttpsUrl } from '@/api/google-books';
import { sanitizeDescription } from '@/lib/sanitize-html';
import type { GoogleBooksVolume } from '@/types/google-books';

export function useSearchBooks(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['google-books-search', trimmed],
    queryFn: () => searchGoogleBooks(trimmed),
    enabled: trimmed.length > 0,
  });
}

export function useGoogleBookDetails(volumeId: string | undefined) {
  return useQuery({
    queryKey: ['google-books-volume', volumeId],
    queryFn: () => getGoogleBookById(volumeId as string),
    enabled: !!volumeId,
  });
}

// Saves a search/scan result straight to the library with its default
// (categories-derived) genres — no detail-review step. Used by the "+ Add"
// button on result cards; tapping the card itself still opens /add/[id] for
// reviewing/editing genres before saving.
export function useQuickAddBook() {
  const addBook = useAddBook();

  function quickAdd(volume: GoogleBooksVolume) {
    const { title, authors, description, publishedDate, pageCount, publisher, language, imageLinks, categories } =
      volume.volumeInfo;
    return addBook.mutateAsync({
      googleBooksId: volume.id,
      title,
      authors: authors ?? [],
      genres: normalizeGenres(categories ?? []),
      thumbnailUrl: toHttpsUrl(imageLinks?.thumbnail),
      description: description ? sanitizeDescription(description) : null,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
      publisher: publisher ?? null,
      language: language ?? null,
    });
  }

  function isAdding(googleBooksId: string): boolean {
    return addBook.isPending && addBook.variables?.googleBooksId === googleBooksId;
  }

  return { quickAdd, isAdding };
}
