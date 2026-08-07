import type { BookGuess, Env } from './types';

// A retried/duplicate photo (accidental double-tap, user reopening the
// screen with the same image) costs nothing extra beyond one KV read.
const CACHE_TTL_SECONDS = 60 * 60 * 24;

// One-way hash of the image bytes — never the image itself. Used both as
// the cache key and to guarantee raw image bytes are never written to KV.
export async function hashImageBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getCachedResult(env: Env, imageHash: string): Promise<BookGuess[] | null> {
  const cached = await env.RECOGNITION_KV.get(`cache:${imageHash}`);
  return cached ? (JSON.parse(cached) as BookGuess[]) : null;
}

// Only the JSON result is ever stored — raw image bytes are never written
// anywhere, and nothing here logs the image contents.
export async function setCachedResult(env: Env, imageHash: string, books: BookGuess[]): Promise<void> {
  await env.RECOGNITION_KV.put(`cache:${imageHash}`, JSON.stringify(books), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
}
