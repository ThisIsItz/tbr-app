import type { BookGuess } from '../types';

export interface VisionProvider {
  recognizeBookCover(imageBytes: ArrayBuffer): Promise<BookGuess[]>;
}

export class VisionProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'upstream_error' | 'invalid_response',
  ) {
    super(message);
    this.name = 'VisionProviderError';
  }
}

function isBookGuess(value: unknown): value is BookGuess {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === 'string' &&
    v.title.trim().length > 0 &&
    (v.author === null || v.author === undefined || typeof v.author === 'string') &&
    (v.confidence === 'low' || v.confidence === 'medium' || v.confidence === 'high')
  );
}

export function validateBooks(parsed: unknown): BookGuess[] {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { books?: unknown }).books)) {
    throw new VisionProviderError('Model response missing a valid "books" array', 'invalid_response');
  }
  const books = (parsed as { books: unknown[] }).books;
  if (!books.every(isBookGuess)) {
    throw new VisionProviderError('Model response contained a malformed book entry', 'invalid_response');
  }
  return books.map((entry) => {
    const guess = entry as BookGuess;
    return { title: guess.title.trim(), author: guess.author ?? null, confidence: guess.confidence };
  });
}

// Some models wrap JSON in a markdown code fence despite being told not to.
export function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new VisionProviderError('Vision provider request timed out', 'timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
