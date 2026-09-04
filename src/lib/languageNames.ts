import { capitalizeFirst } from '@/lib/capitalize';

// Primary source of language names — Intl.DisplayNames support (esp. its CLDR data on
// Android/Hermes) is inconsistent across devices, so known codes are hardcoded instead.
// ISO 639-1 codes as returned by Google Books' volumeInfo.language.
const LANGUAGE_NAMES: Record<string, { en: string; es: string }> = {
  en: { en: 'English', es: 'Inglés' },
  es: { en: 'Spanish', es: 'Español' },
  fr: { en: 'French', es: 'Francés' },
  de: { en: 'German', es: 'Alemán' },
  it: { en: 'Italian', es: 'Italiano' },
  pt: { en: 'Portuguese', es: 'Portugués' },
  nl: { en: 'Dutch', es: 'Neerlandés' },
  ru: { en: 'Russian', es: 'Ruso' },
  ja: { en: 'Japanese', es: 'Japonés' },
  zh: { en: 'Chinese', es: 'Chino' },
  ko: { en: 'Korean', es: 'Coreano' },
  ar: { en: 'Arabic', es: 'Árabe' },
  ca: { en: 'Catalan', es: 'Catalán' },
  eu: { en: 'Basque', es: 'Euskera' },
  gl: { en: 'Galician', es: 'Gallego' },
  sv: { en: 'Swedish', es: 'Sueco' },
  no: { en: 'Norwegian', es: 'Noruego' },
  da: { en: 'Danish', es: 'Danés' },
  fi: { en: 'Finnish', es: 'Finlandés' },
  pl: { en: 'Polish', es: 'Polaco' },
  tr: { en: 'Turkish', es: 'Turco' },
  el: { en: 'Greek', es: 'Griego' },
  he: { en: 'Hebrew', es: 'Hebreo' },
  hi: { en: 'Hindi', es: 'Hindi' },
  cs: { en: 'Czech', es: 'Checo' },
  ro: { en: 'Romanian', es: 'Rumano' },
  hu: { en: 'Hungarian', es: 'Húngaro' },
  uk: { en: 'Ukrainian', es: 'Ucraniano' },
  id: { en: 'Indonesian', es: 'Indonesio' },
  th: { en: 'Thai', es: 'Tailandés' },
  vi: { en: 'Vietnamese', es: 'Vietnamita' },
  fa: { en: 'Persian', es: 'Persa' },
  la: { en: 'Latin', es: 'Latín' },
};

export function getLanguageName(code: string, locale: string): string {
  const normalized = code.toLowerCase();
  const known = LANGUAGE_NAMES[normalized];
  if (known) return locale.startsWith('es') ? known.es : known.en;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(normalized);
    if (name && name !== normalized) return capitalizeFirst(name);
  } catch {
    // Intl.DisplayNames unsupported — fall through to the raw code.
  }
  return code;
}
