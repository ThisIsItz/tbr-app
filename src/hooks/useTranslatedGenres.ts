import { useQuery } from '@tanstack/react-query';

import { translateCategories } from '@/api/translate';
import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedGenres {
  translations: Record<string, string>;
  /** True while a translation the caller will actually need is still in flight —
   *  lets callers hide the untranslated text instead of flashing it before it swaps. */
  isLoading: boolean;
}

export function useTranslatedGenres(genres: string[]): TranslatedGenres {
  const { locale } = useTranslation();
  const sortedGenres = [...new Set(genres)].sort();

  const { data } = useQuery({
    queryKey: ['translatedGenres', locale, sortedGenres],
    queryFn: () => translateCategories(sortedGenres, locale),
    enabled: locale !== 'en' && sortedGenres.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    translations: data ?? {},
    isLoading: locale !== 'en' && sortedGenres.length > 0 && !data,
  };
}
