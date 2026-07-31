import { extractTextFromImage, isSupported } from 'expo-text-extractor';

import type { BookCoverRecognitionService, CoverRecognitionResult } from './types';

const MIN_LINE_LENGTH = 2;
const MAX_CANDIDATE_AUTHORS = 3;
const MAX_CANDIDATE_TITLES = 3;
const MAX_SEARCH_QUERIES = 3;

// ISBNs, barcodes, and prices show up as OCR lines that are mostly digits —
// they're never a useful title/author candidate.
const BARCODE_OR_NUMERIC_LINE = /^[\d\s\-–—.]{6,}$/;
const BY_PREFIX = /^by\s+/i;

// A crude "looks like a person's name" check: 2-4 capitalized words, no
// digits. Good enough as a heuristic — good OCR + real book covers rarely
// need more than this to separate an author line from a title/tagline.
function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((word) => /^[A-ZÀ-ÝÀ-Ö][\p{L}'’.-]*$/u.test(word));
}

function cleanLines(rawText: string[]): string[] {
  return rawText
    .map((line) => line.trim())
    .filter((line) => line.length >= MIN_LINE_LENGTH)
    .filter((line) => !BARCODE_OR_NUMERIC_LINE.test(line));
}

function dedupe(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function deriveCandidates(rawText: string[]): {
  candidateTitles: string[];
  candidateAuthors: string[];
} {
  const lines = cleanLines(rawText);

  // An explicit "by <name>" line (common on front covers) is the strongest
  // possible author signal, so it's pulled out before the generic heuristic.
  const byLine = lines.find((line) => BY_PREFIX.test(line));
  const explicitAuthor = byLine?.replace(BY_PREFIX, '').trim();

  const remaining = lines.filter((line) => line !== byLine);
  const nameLines = remaining.filter(looksLikeName);

  const candidateAuthors = dedupe(
    [explicitAuthor, ...nameLines].filter((value): value is string => !!value),
  ).slice(0, MAX_CANDIDATE_AUTHORS);

  // Whatever's left, longest lines first — a book's title is usually the
  // most prominent (and often longest) text on the cover.
  const candidateTitles = dedupe(
    remaining
      .filter((line) => !candidateAuthors.includes(line))
      .sort((a, b) => b.length - a.length),
  ).slice(0, MAX_CANDIDATE_TITLES);

  return { candidateTitles, candidateAuthors };
}

export function buildSearchQueries(candidateTitles: string[], candidateAuthors: string[]): string[] {
  const [primaryTitle, secondaryTitle] = candidateTitles;
  const [primaryAuthor] = candidateAuthors;

  const queries = [
    primaryTitle && primaryAuthor ? `${primaryTitle} ${primaryAuthor}` : null,
    primaryTitle,
    secondaryTitle,
  ].filter((value): value is string => !!value);

  return dedupe(queries).slice(0, MAX_SEARCH_QUERIES);
}

export const ocrBookCoverRecognitionService: BookCoverRecognitionService = {
  isSupported,
  async recognizeCover(imageUri: string): Promise<CoverRecognitionResult> {
    const rawText = await extractTextFromImage(imageUri);
    const { candidateTitles, candidateAuthors } = deriveCandidates(rawText);
    const searchQueries = buildSearchQueries(candidateTitles, candidateAuthors);
    return { rawText, candidateTitles, candidateAuthors, searchQueries };
  },
};
