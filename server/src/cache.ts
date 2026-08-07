import type { BookGuess, Env } from './types';

const CACHE_TTL_SECONDS = 60 * 60 * 24;

// One-way hash — never the image itself.
export async function hashImageBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getCachedResult(env: Env, imageHash: string): Promise<BookGuess[] | null> {
  const cached = await env.RECOGNITION_KV.get(`cache:${imageHash}`);
  return cached ? (JSON.parse(cached) as BookGuess[]) : null;
}

export async function setCachedResult(env: Env, imageHash: string, books: BookGuess[]): Promise<void> {
  await env.RECOGNITION_KV.put(`cache:${imageHash}`, JSON.stringify(books), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
}
