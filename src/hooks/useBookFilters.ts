import { useCallback, useMemo, useState } from 'react';

import { useTranslatedGenres } from '@/hooks/useTranslatedGenres';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalizeFirst } from '@/lib/capitalize';
import { normalizeGenres } from '@/lib/genres';
import { getLanguageName } from '@/lib/languageNames';
import type { Book } from '@/types/book';

/** Genre/author/language multi-select filtering shared by the library and
 * spin screens — state, derived option lists, and the actual filter. */
export function useBookFilters(books: Book[]) {
  const { locale } = useTranslation();

  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [authorFilters, setAuthorFilters] = useState<string[]>([]);
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);

  const genresByBookId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const book of books) {
      map.set(book.id, normalizeGenres(book.genres));
    }
    return map;
  }, [books]);

  const allGenres = useMemo(
    () => Array.from(new Set([...genresByBookId.values()].flat())).sort((a, b) => a.localeCompare(b)),
    [genresByBookId],
  );
  const allManualGenres = useMemo(() => Array.from(new Set(books.flatMap((book) => book.manualGenres))), [books]);
  const { translations: genreTranslations } = useTranslatedGenres(allGenres, allManualGenres);
  const allAuthors = useMemo(
    () => Array.from(new Set(books.flatMap((book) => book.authors))).sort((a, b) => a.localeCompare(b)),
    [books],
  );
  const allLanguages = useMemo(
    () =>
      Array.from(new Set(books.map((book) => book.language).filter((l): l is string => !!l))).sort((a, b) =>
        getLanguageName(a, locale).localeCompare(getLanguageName(b, locale)),
      ),
    [books, locale],
  );

  const hasActiveFilters = genreFilters.length > 0 || authorFilters.length > 0 || languageFilters.length > 0;
  const activeFilterLabels = [
    ...genreFilters.map((genre) => capitalizeFirst(genreTranslations[genre] ?? genre)),
    ...authorFilters,
    ...languageFilters.map((language) => getLanguageName(language, locale)),
  ];

  const clearFilters = useCallback(() => {
    setGenreFilters([]);
    setAuthorFilters([]);
    setLanguageFilters([]);
  }, []);

  const applyFilters = useCallback(
    (list: Book[]) => {
      let result = list;
      if (genreFilters.length > 0) {
        result = result.filter((book) => genresByBookId.get(book.id)?.some((g) => genreFilters.includes(g)));
      }
      if (authorFilters.length > 0) {
        result = result.filter((book) => book.authors.some((author) => authorFilters.includes(author)));
      }
      if (languageFilters.length > 0) {
        result = result.filter((book) => !!book.language && languageFilters.includes(book.language));
      }
      return result;
    },
    [genreFilters, authorFilters, languageFilters, genresByBookId],
  );

  return {
    genreFilters,
    setGenreFilters,
    authorFilters,
    setAuthorFilters,
    languageFilters,
    setLanguageFilters,
    genresByBookId,
    allGenres,
    allAuthors,
    allLanguages,
    genreTranslations,
    hasActiveFilters,
    activeFilterLabels,
    clearFilters,
    applyFilters,
  };
}
