import type { GoogleBooksVolume } from '@/types/google-books';

// Phrases that mark a result as academic commentary/study material rather
// than the standard edition of a work — penalised unless the user actually
// searched for one of them.
const PENALTY_PHRASES = [
  'critical perspectives',
  'study guide',
  'analysis',
  'companion',
  'essays',
  'bibliography',
  'research',
];

const SCORE = {
  exactTitle: 100,
  titleStartsWith: 60,
  titleContainsWordsInOrder: 30,
  hasAuthor: 8,
  hasCover: 5,
  hasIsbn: 5,
  hasRatings: 4,
  penaltyPhrase: -40,
  missingAuthorAndIsbn: -15,
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getIsbn(volume: GoogleBooksVolume): string | null {
  const identifiers = volume.volumeInfo.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13');
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10');
  return isbn13?.identifier ?? isbn10?.identifier ?? identifiers[0]?.identifier ?? null;
}

function containsWordsInOrder(haystack: string, words: string[]): boolean {
  let searchFrom = 0;
  for (const word of words) {
    const index = haystack.indexOf(word, searchFrom);
    if (index === -1) return false;
    searchFrom = index + word.length;
  }
  return true;
}

function metadataCompleteness(volume: GoogleBooksVolume): number {
  const { volumeInfo } = volume;
  let score = 0;
  if (volumeInfo.imageLinks?.thumbnail) score += 1;
  if (getIsbn(volume)) score += 1;
  if (volumeInfo.description) score += 1;
  if (volumeInfo.categories?.length) score += 1;
  if ((volumeInfo.ratingsCount ?? 0) > 0) score += 1;
  if (volumeInfo.authors?.length) score += 1;
  return score;
}

/** Drops exact duplicate entries — same Google Books volume id, or same ISBN
 * under a different id (Google's catalog occasionally has both). */
export function dedupeVolumes(volumes: GoogleBooksVolume[]): GoogleBooksVolume[] {
  const seenIds = new Set<string>();
  const seenIsbns = new Set<string>();
  const result: GoogleBooksVolume[] = [];

  for (const volume of volumes) {
    if (seenIds.has(volume.id)) continue;

    const isbn = getIsbn(volume);
    if (isbn && seenIsbns.has(isbn)) continue;

    seenIds.add(volume.id);
    if (isbn) seenIsbns.add(isbn);
    result.push(volume);
  }

  return result;
}

/** Collapses different editions of the same work (same title + primary
 * author) down to the single entry with the most complete metadata, so
 * results aren't cluttered with near-identical reprints. */
export function mergeEditions(volumes: GoogleBooksVolume[]): GoogleBooksVolume[] {
  const groups = new Map<string, GoogleBooksVolume[]>();

  for (const volume of volumes) {
    const key = `${normalize(volume.volumeInfo.title ?? '')}::${normalize(volume.volumeInfo.authors?.[0] ?? '')}`;
    const group = groups.get(key);
    if (group) {
      group.push(volume);
    } else {
      groups.set(key, [volume]);
    }
  }

  return [...groups.values()].map((group) =>
    group.reduce((best, candidate) =>
      metadataCompleteness(candidate) > metadataCompleteness(best) ? candidate : best,
    ),
  );
}

/** Reusable relevance score for a single volume against a search query.
 * Higher is more relevant. Not specific to any particular title/series. */
export function scoreVolume(volume: GoogleBooksVolume, query: string): number {
  const { volumeInfo } = volume;
  const title = normalize(volumeInfo.title ?? '');
  const normQuery = normalize(query);
  const queryWords = normQuery.split(' ').filter(Boolean);

  let score = 0;

  if (title === normQuery) {
    score += SCORE.exactTitle;
  } else if (normQuery.length > 0 && title.startsWith(normQuery)) {
    score += SCORE.titleStartsWith;
  } else if (queryWords.length > 0 && containsWordsInOrder(title, queryWords)) {
    score += SCORE.titleContainsWordsInOrder;
  }

  const hasAuthor = (volumeInfo.authors?.length ?? 0) > 0;
  const hasIsbn = !!getIsbn(volume);

  if (hasAuthor) score += SCORE.hasAuthor;
  if (volumeInfo.imageLinks?.thumbnail) score += SCORE.hasCover;
  if (hasIsbn) score += SCORE.hasIsbn;
  if ((volumeInfo.ratingsCount ?? 0) > 0) score += SCORE.hasRatings;

  const haystack = normalize(`${volumeInfo.title ?? ''} ${volumeInfo.subtitle ?? ''}`);
  for (const phrase of PENALTY_PHRASES) {
    if (haystack.includes(phrase) && !normQuery.includes(phrase)) {
      score += SCORE.penaltyPhrase;
    }
  }

  if (!hasAuthor && !hasIsbn) {
    score += SCORE.missingAuthorAndIsbn;
  }

  return score;
}

/** Full pipeline: dedupe exact duplicates, merge same-work editions down to
 * the best-metadata copy, then sort by relevance to `query`. */
export function rankSearchResults(volumes: GoogleBooksVolume[], query: string): GoogleBooksVolume[] {
  const deduped = dedupeVolumes(volumes);
  const merged = mergeEditions(deduped);
  return merged
    .map((volume) => ({ volume, score: scoreVolume(volume, query) }))
    .sort((a, b) => b.score - a.score)
    .map(({ volume }) => volume);
}
