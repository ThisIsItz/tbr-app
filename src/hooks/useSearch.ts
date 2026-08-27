import { useQuery } from '@tanstack/react-query';

import { useAddBook } from '@/hooks/useLibrary';
import { normalizeGenres } from '@/lib/genres';
import { getGoogleBookById, searchGoogleBooks, toHttpsUrl } from '@/api/googleBooks';
import { sanitizeDescription } from '@/lib/sanitizeHtml';
import type { GoogleBooksVolume } from '@/types/google-books';

export function useSearchBooks(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['google-books-search', trimmed],
    queryFn: () => searchGoogleBooks(trimmed),
    enabled: trimmed.length > 0,
    staleTime: Infinity,
  });
}

export function useGoogleBookDetails(volumeId: string | undefined) {
  return useQuery({
    queryKey: ['google-books-volume', volumeId],
    queryFn: () => getGoogleBookById(volumeId as string),
    enabled: !!volumeId,
    staleTime: Infinity,
  });
}

// Saves a search/scan result straight to the library with its default
// (categories-derived) genres — no detail-review step. Used by the "+ Add"
// button on result cards; tapping the card itself still opens /add/[id] for
// reviewing/editing genres before saving.
export function useQuickAddBook() {
  const addBook = useAddBook();

  function quickAdd(volume: GoogleBooksVolume) {
    const {
      title,
      subtitle,
      authors,
      description,
      publishedDate,
      pageCount,
      publisher,
      language,
      imageLinks,
      categories,
    } = volume.volumeInfo;
    return addBook.mutateAsync({
      googleBooksId: volume.id,
      title,
      subtitle: subtitle ?? null,
      authors: authors ?? [],
      genres: normalizeGenres(categories ?? []),
      thumbnailUrl: toHttpsUrl(imageLinks?.thumbnail),
      description: description ? sanitizeDescription(description) : null,
      publishedDate: publishedDate ?? null,
      pageCount: pageCount ?? null,
      publisher: publisher ?? null,
      language: language ?? null,
      notes: null,
    });
  }

  function isAdding(googleBooksId: string): boolean {
    return addBook.isPending && addBook.variables?.googleBooksId === googleBooksId;
  }

  return { quickAdd, isAdding };
}
