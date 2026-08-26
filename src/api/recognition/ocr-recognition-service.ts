import { extractTextFromImage, isSupported } from 'expo-text-extractor';

import type { BookCoverRecognitionService, BookGuess, CoverRecognitionResult, RecognitionConfidence } from './types';

const MIN_LINE_LENGTH = 2;

const BARCODE_OR_NUMERIC_LINE = /^[\d\s\-–—.]{6,}$/;
const BY_PREFIX = /^by\s+/i;

// Crude "looks like a person's name" check: 2-4 capitalized words.
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

function deriveGuess(rawText: string[]): {
  title: string | null;
  author: string | null;
  confidence: RecognitionConfidence;
} {
  const lines = cleanLines(rawText);
  if (lines.length === 0) {
    return { title: null, author: null, confidence: 'low' };
  }

  const byLine = lines.find((line) => BY_PREFIX.test(line));
  const explicitAuthor = byLine?.replace(BY_PREFIX, '').trim() || null;

  const remaining = lines.filter((line) => line !== byLine);
  const nameLine = remaining.find(looksLikeName) ?? null;
  const author = explicitAuthor ?? nameLine;

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
    const books: BookGuess[] = title ? [{ title, author, confidence }] : [];
    return { books, rawText, source: 'ocr' };
  },
};
