import { useEffect, useState } from 'react';

import { toHttpsUrl } from '@/api/googleBooks';
import { resolveCoverUrl } from '@/lib/coverResolution';
import type { Book } from '@/types/book';

import { useUpdateBookCoverUrl } from './useLibrary';

type ResolvableBook = Pick<Book, 'id' | 'thumbnailUrl' | 'coverResolved'>;

// Resolves a saved book's cover at most once, ever: if it's already marked
// resolved, returns the stored URL as-is (no check). Otherwise checks once
// and persists the answer so future renders — for this book, anywhere in
// the app — never check again.
export function useResolvedCoverUrl(book: ResolvableBook | null): string | null {
  const updateCoverUrl = useUpdateBookCoverUrl();
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!book || book.coverResolved || !book.thumbnailUrl) return;

    let cancelled = false;
    resolveCoverUrl(book.thumbnailUrl).then(({ url, resolved }) => {
      if (cancelled) return;
      setLiveUrl(url);
      if (resolved) {
        updateCoverUrl.mutate({ id: book.id, thumbnailUrl: url });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id, book?.coverResolved, book?.thumbnailUrl]);

  if (!book?.thumbnailUrl) return null;
  if (book.coverResolved) return book.thumbnailUrl;
  return liveUrl ?? toHttpsUrl(book.thumbnailUrl);
}
