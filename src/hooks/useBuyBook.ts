import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking } from 'react-native';

import { buildBuyLink } from '@/affiliate';
import { getGoogleBookById } from '@/api/googleBooks';
import { extractIsbnsFromVolume } from '@/lib/isbn';
import type { Book } from '@/types/book';

import { useUpdateBookIsbn } from './useLibrary';
import { useStorePreference } from './useStorePreference';

// Fetches the ISBN from Google Books on demand — only here, never eagerly.
export function useBuyBook() {
  const [isResolving, setIsResolving] = useState(false);
  const updateIsbn = useUpdateBookIsbn();
  const { preferredStore: store } = useStorePreference();

  async function buy(book: Book) {
    if (!store) return;

    let isbn13 = book.isbn13;

    if (!isbn13 && book.googleBooksId) {
      setIsResolving(true);
      try {
        const volume = await getGoogleBookById(book.googleBooksId);
        const extracted = extractIsbnsFromVolume(volume);
        isbn13 = extracted.isbn13;
        if (extracted.isbn13 || extracted.isbn10) {
          updateIsbn.mutate({ id: book.id, isbn13: extracted.isbn13, isbn10: extracted.isbn10 });
        }
      } catch {
        // ignore, falls through to a search-based link below
      } finally {
        setIsResolving(false);
      }
    }

    const url = buildBuyLink({ isbn13, title: book.title, authors: book.authors }, store);
    if (!url) return;

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  }

  return { buy, isResolving, store };
}
