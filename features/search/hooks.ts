import { useQuery } from '@tanstack/react-query';

import { getGoogleBookById, searchGoogleBooks } from '@/lib/google-books';

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
