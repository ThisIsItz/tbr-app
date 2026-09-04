import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { translateCategories } from '@/api/translate';
import { useTranslation } from '@/hooks/useTranslation';
import { getStaticGenreTranslation } from '@/lib/genreTranslations';

interface TranslatedGenres {
  translations: Record<string, string>;
  isLoading: boolean;
}

export function useTranslatedGenres(genres: string[], manualGenres: string[] = []): TranslatedGenres {
  const { locale } = useTranslation();
  const sortedGenres = [...new Set(genres)].filter((genre) => !manualGenres.includes(genre)).sort();

  const cacheRef = useRef<{ locale: string; translations: Record<string, string> }>({
    locale,
    translations: {},
  });
  if (cacheRef.current.locale !== locale) {
    cacheRef.current = { locale, translations: {} };
  }

  const staticTranslations: Record<string, string> = {};
  for (const genre of sortedGenres) {
    const staticMatch = getStaticGenreTranslation(genre);
    if (staticMatch) staticTranslations[genre] = staticMatch;
  }

  const missingGenres = sortedGenres.filter(
    (genre) => !(genre in staticTranslations) && !(genre in cacheRef.current.translations),
  );

  const { data } = useQuery({
    queryKey: ['translatedGenres', locale, missingGenres],
    queryFn: () => translateCategories(missingGenres, locale),
    enabled: locale !== 'en' && missingGenres.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (data) Object.assign(cacheRef.current.translations, data);
  }, [data]);

  return {
    translations: { ...cacheRef.current.translations, ...data, ...staticTranslations },
    isLoading: locale !== 'en' && missingGenres.length > 0 && !data,
  };
}
