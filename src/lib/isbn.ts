import type { GoogleBooksVolume } from '@/types/google-books';

export interface ExtractedIsbns {
  isbn13: string | null;
  isbn10: string | null;
}

function cleanIdentifier(value: string): string {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase();
}

export function isbn10ToIsbn13(isbn10: string): string | null {
  const cleaned = cleanIdentifier(isbn10);
  if (cleaned.length !== 10) return null;

  const core = `978${cleaned.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${core}${checkDigit}`;
}

export function normalizeIsbn13(raw: string): string | null {
  const cleaned = cleanIdentifier(raw);
  if (cleaned.length !== 13 || !/^97[89]/.test(cleaned)) return null;
  return cleaned;
}

function findIdentifier(volume: GoogleBooksVolume, type: 'ISBN_13' | 'ISBN_10'): string | null {
  return volume.volumeInfo.industryIdentifiers?.find((i) => i.type === type)?.identifier ?? null;
}

export function extractIsbnsFromVolume(volume: GoogleBooksVolume): ExtractedIsbns {
  const isbn10Raw = findIdentifier(volume, 'ISBN_10');
  const isbn10 = isbn10Raw ? cleanIdentifier(isbn10Raw) : null;

  const isbn13Raw = findIdentifier(volume, 'ISBN_13');
  const isbn13 = isbn13Raw ? normalizeIsbn13(isbn13Raw) : isbn10 ? isbn10ToIsbn13(isbn10) : null;

  return { isbn13, isbn10 };
}

export function parseIsbnInput(raw: string): ExtractedIsbns | null {
  const cleaned = cleanIdentifier(raw);
  if (cleaned.length === 13) {
    const isbn13 = normalizeIsbn13(cleaned);
    return isbn13 ? { isbn13, isbn10: null } : null;
  }
  if (cleaned.length === 10) {
    return { isbn13: isbn10ToIsbn13(cleaned), isbn10: cleaned };
  }
  return null;
}

// For dedup/matching only — prefer extractIsbnsFromVolume for persistence.
export function getBestIsbn(volume: GoogleBooksVolume): string | null {
  const identifiers = volume.volumeInfo.industryIdentifiers ?? [];
  const { isbn13, isbn10 } = extractIsbnsFromVolume(volume);
  return isbn13 ?? isbn10 ?? identifiers[0]?.identifier ?? null;
}
