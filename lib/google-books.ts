import { rankSearchResults } from '@/lib/book-relevance'
import type {
  GoogleBooksSearchResponse,
  GoogleBooksVolume
} from '@/types/google-books'

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes'

// If an `intitle:`-scoped search returns fewer than this many results, we
// broaden to an unscoped search too — a title search alone can be too
// narrow for typos, subtitles, or less literal queries.
const MIN_RESULTS_BEFORE_FALLBACK = 5
const MAX_RESULTS_PER_QUERY = 20

export class GoogleBooksApiError extends Error {
  constructor(public status: number) {
    // This message is for logs/debugging only — never rendered directly in
    // the UI, since this module has no access to the current locale. Screens
    // should use `getErrorTranslationKey(error)` + `t(...)` to display it.
    super(`Google Books request failed (${status})`)
    this.name = 'GoogleBooksApiError'
  }
}

export function getErrorTranslationKey(
  error: unknown
): 'errors.rateLimit' | 'errors.generic' {
  return error instanceof GoogleBooksApiError && error.status === 429
    ? 'errors.rateLimit'
    : 'errors.generic'
}

export function toHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

function withApiKey(params: URLSearchParams): URLSearchParams {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY
  if (apiKey) {
    params.set('key', apiKey)
  }
  return params
}

async function fetchVolumes(q: string): Promise<GoogleBooksVolume[]> {
  const params = withApiKey(
    new URLSearchParams({ q, maxResults: String(MAX_RESULTS_PER_QUERY) })
  )

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new GoogleBooksApiError(response.status)
  }

  const data = (await response.json()) as GoogleBooksSearchResponse
  return data.items ?? []
}

export async function searchGoogleBooks(
  query: string
): Promise<GoogleBooksVolume[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  // Prefer a title-scoped search — for a normal query like "Harry Potter"
  // this surfaces the actual novels instead of unrelated books that merely
  // mention the phrase in their description.
  const titleResults = await fetchVolumes(`intitle:${trimmed}`)

  let candidates = titleResults
  if (titleResults.length < MIN_RESULTS_BEFORE_FALLBACK) {
    const broaderResults = await fetchVolumes(trimmed)
    candidates = [...titleResults, ...broaderResults]
  }

  return rankSearchResults(candidates, trimmed)
}

export async function searchGoogleBooksByIsbn(
  isbn: string
): Promise<GoogleBooksVolume | null> {
  const trimmed = isbn.trim()
  if (!trimmed) return null

  const results = await fetchVolumes(`isbn:${trimmed}`)
  return results[0] ?? null
}

export async function getGoogleBookById(
  volumeId: string
): Promise<GoogleBooksVolume> {
  const params = withApiKey(new URLSearchParams())
  const query = params.toString()

  const response = await fetch(
    `${GOOGLE_BOOKS_API_URL}/${volumeId}${query ? `?${query}` : ''}`
  )
  if (!response.ok) {
    throw new GoogleBooksApiError(response.status)
  }

  return (await response.json()) as GoogleBooksVolume
}
