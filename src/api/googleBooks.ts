import { rankSearchResults } from '@/api/bookRelevance'
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
  return error instanceof GoogleBooksApiError && (error.status === 429 || error.status === 503)
    ? 'errors.rateLimit'
    : 'errors.generic'
}

export function toHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

// Google Books' `thumbnail` field is a small (~128px) image, but the same
// content server serves much larger versions of the same cover via `zoom` —
// bumping it gets a sharper image without a second request or re-fetch.
export function toHighResUrl(url: string | null | undefined): string | null {
  const httpsUrl = toHttpsUrl(url)
  if (!httpsUrl) return null
  return httpsUrl.replace(/([?&])zoom=\d+/, '$1zoom=3').replace(/&edge=curl/g, '')
}

// Not every scanned cover has a zoom=3 tier — when it's missing, Google's
// content server returns its own broken-image placeholder instead of the
// real cover. Undoes the zoom=3 bump from `toHighResUrl` so callers can
// retry at the default zoom level, which is always available.
export function toFallbackZoomUrl(url: string): string {
  return url.replace(/zoom=3\b/, 'zoom=1')
}

const volumesCache = new Map<string, Promise<GoogleBooksVolume[]>>()

async function fetchVolumes(q: string): Promise<GoogleBooksVolume[]> {
  const cached = volumesCache.get(q)
  if (cached) return cached

  const promise = (async () => {
    const params = new URLSearchParams({ q, maxResults: String(MAX_RESULTS_PER_QUERY) })
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`)
    if (!response.ok) {
      throw new GoogleBooksApiError(response.status)
    }

    const data = (await response.json()) as GoogleBooksSearchResponse
    return data.items ?? []
  })()

  volumesCache.set(q, promise)
  promise.catch(() => volumesCache.delete(q))
  return promise
}

export async function searchGoogleBooks(
  query: string
): Promise<GoogleBooksVolume[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const [titleResults, authorResults] = await Promise.all([
    fetchVolumes(`intitle:${trimmed}`),
    fetchVolumes(`inauthor:${trimmed}`),
  ])

  let candidates = [...titleResults, ...authorResults]
  if (titleResults.length < MIN_RESULTS_BEFORE_FALLBACK) {
    const broaderResults = await fetchVolumes(trimmed)
    candidates = [...candidates, ...broaderResults]
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

const volumeByIdCache = new Map<string, Promise<GoogleBooksVolume>>()

export function getGoogleBookById(volumeId: string): Promise<GoogleBooksVolume> {
  const cached = volumeByIdCache.get(volumeId)
  if (cached) return cached

  const promise = (async () => {
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${volumeId}`)
    if (!response.ok) {
      throw new GoogleBooksApiError(response.status)
    }

    return (await response.json()) as GoogleBooksVolume
  })()

  volumeByIdCache.set(volumeId, promise)
  promise.catch(() => volumeByIdCache.delete(volumeId))
  return promise
}
