import { useQuery } from '@tanstack/react-query';

import { translateCategories } from '@/api/translate';
import { useTranslation } from '@/hooks/useTranslation';

export function useTranslatedGenres(genres: string[]): Record<string, string> {
  const { locale } = useTranslation();
  const sortedGenres = [...new Set(genres)].sort();

  const { data } = useQuery({
    queryKey: ['translatedGenres', locale, sortedGenres],
    queryFn: () => translateCategories(sortedGenres, locale),
    enabled: locale !== 'en' && sortedGenres.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return data ?? {};
}
