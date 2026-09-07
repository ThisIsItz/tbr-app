import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getGenreTranslations, saveGenreTranslations } from '@/api/repository/genreTranslationsRepository';
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

  const staticTranslations: Record<string, string> = {};
  const genresNeedingLookup: string[] = [];
  for (const genre of sortedGenres) {
    const staticMatch = getStaticGenreTranslation(genre);
    if (staticMatch) staticTranslations[genre] = staticMatch;
    else genresNeedingLookup.push(genre);
  }

  const { data: persisted, isLoading: isLoadingPersisted } = useQuery({
    queryKey: ['persistedGenreTranslations', locale, genresNeedingLookup],
    queryFn: () => getGenreTranslations(genresNeedingLookup, locale),
    enabled: locale !== 'en' && genresNeedingLookup.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const missingGenres = genresNeedingLookup.filter((genre) => !persisted?.[genre]);

  const { data: fetched } = useQuery({
    queryKey: ['translatedGenres', locale, missingGenres],
    queryFn: () => translateCategories(missingGenres, locale),
    enabled: locale !== 'en' && !!persisted && missingGenres.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (fetched && Object.keys(fetched).length > 0) {
      saveGenreTranslations(fetched, locale);
    }
  }, [fetched, locale]);

  return {
    translations: { ...persisted, ...fetched, ...staticTranslations },
    isLoading:
      locale !== 'en' &&
      genresNeedingLookup.length > 0 &&
      (isLoadingPersisted || (missingGenres.length > 0 && !fetched)),
  };
}
