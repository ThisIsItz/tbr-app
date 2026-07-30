import en from '@/locales/en.json';
import es from '@/locales/es.json';

export type Locale = 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionaries: Record<Locale, any> = { en, es };

function lookup(dictionary: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[segment] : undefined,
      dictionary,
    );
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const template = lookup(dictionaries[locale], key) ?? lookup(dictionaries[DEFAULT_LOCALE], key) ?? key;
  return interpolate(template, params);
}

export function detectLocaleFromLanguageCode(languageCode: string | null | undefined): Locale {
  return languageCode?.toLowerCase().startsWith('es') ? 'es' : 'en';
}
