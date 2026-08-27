// Fallback for environments without Intl.DisplayNames support.
// ISO 639-1 codes as returned by Google Books' volumeInfo.language.
const LANGUAGE_NAMES_EN: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  ca: 'Catalan',
  eu: 'Basque',
  gl: 'Galician',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  pl: 'Polish',
  tr: 'Turkish',
  el: 'Greek',
  he: 'Hebrew',
  hi: 'Hindi',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  uk: 'Ukrainian',
};

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getLanguageName(code: string, locale: string): string {
  const normalized = code.toLowerCase();
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(normalized);
    if (name && name !== normalized) return capitalize(name);
  } catch {
    // Intl.DisplayNames unsupported — fall through to the static table.
  }
  return LANGUAGE_NAMES_EN[normalized] ?? code;
}
