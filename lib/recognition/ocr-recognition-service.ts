import { extractTextFromImage, isSupported } from 'expo-text-extractor';

import type { BookCoverRecognitionService, BookGuess, CoverRecognitionResult, RecognitionConfidence } from './types';

const MIN_LINE_LENGTH = 2;

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

// OCR line order/length is a weak signal on its own — promotional blurbs
// and back-cover copy are often the most prominent text in a photo, so this
// produces a single best-effort guess with an explicit confidence level
// rather than a ranked list presented as if it were structured metadata.
function deriveGuess(rawText: string[]): {
  title: string | null;
  author: string | null;
  confidence: RecognitionConfidence;
} {
  const lines = cleanLines(rawText);
  if (lines.length === 0) {
    return { title: null, author: null, confidence: 'low' };
  }

  // An explicit "by <name>" line (common on front covers) is the strongest
  // possible author signal.
  const byLine = lines.find((line) => BY_PREFIX.test(line));
  const explicitAuthor = byLine?.replace(BY_PREFIX, '').trim() || null;

  const remaining = lines.filter((line) => line !== byLine);
  const nameLine = remaining.find(looksLikeName) ?? null;
  const author = explicitAuthor ?? nameLine;

  // Whatever's left, longest line first — a book's title is usually the
  // most prominent (and often longest) text on the cover. This is still
  // just a guess, which is why it's never auto-searched.
  const title = remaining.filter((line) => line !== author).sort((a, b) => b.length - a.length)[0] ?? null;

  let confidence: RecognitionConfidence = 'low';
  if (explicitAuthor && title) {
    confidence = 'high';
  } else if (author && title) {
    confidence = 'medium';
  }

  return { title, author, confidence };
}

export const ocrBookCoverRecognitionService: BookCoverRecognitionService = {
  isSupported,
  async recognizeCover(imageUri: string): Promise<CoverRecognitionResult> {
    const rawText = await extractTextFromImage(imageUri);
    const { title, author, confidence } = deriveGuess(rawText);
    // No usable guess is represented as an empty books array, not a
    // BookGuess with a null title — title is required for any real guess.
    const books: BookGuess[] = title ? [{ title, author, confidence }] : [];
    return { books, rawText, source: 'ocr' };
  },
};
