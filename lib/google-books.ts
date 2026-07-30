import type { GoogleBooksSearchResponse, GoogleBooksVolume } from '@/types/google-books';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

export class GoogleBooksApiError extends Error {
  constructor(public status: number) {
    super(
      status === 429
        ? 'Google Books rate limit reached. Wait a moment and try again, or set EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY.'
        : `Google Books request failed (${status})`,
    );
    this.name = 'GoogleBooksApiError';
  }
}

function withApiKey(params: URLSearchParams): URLSearchParams {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    params.set('key', apiKey);
  }
  return params;
}

export async function searchGoogleBooks(query: string): Promise<GoogleBooksVolume[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = withApiKey(new URLSearchParams({ q: trimmed, maxResults: '20' }));

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new GoogleBooksApiError(response.status);
  }

  const data = (await response.json()) as GoogleBooksSearchResponse;
  return data.items ?? [];
}

export async function getGoogleBookById(volumeId: string): Promise<GoogleBooksVolume> {
  const params = withApiKey(new URLSearchParams());
  const query = params.toString();

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${volumeId}${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new GoogleBooksApiError(response.status);
  }

  return (await response.json()) as GoogleBooksVolume;
}
