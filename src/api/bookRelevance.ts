import { getBestIsbn } from '@/lib/isbn';
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
  crossFieldMatch: 50,
  titleContainsWordsInOrder: 30,
  authorMatch: 110,
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches each word as a whole word, not a raw substring — otherwise a
// short query word like "j" or "mass" spuriously matches inside unrelated
// words ("January", "Massachusetts"), inflating the relevance score of
// books that have nothing to do with the query.
function containsWordsInOrder(haystack: string, words: string[]): boolean {
  let searchFrom = 0;
  for (const word of words) {
    const match = new RegExp(`\\b${escapeRegExp(word)}`).exec(haystack.slice(searchFrom));
    if (!match) return false;
    searchFrom += match.index + word.length;
  }
  return true;
}

function containsWord(haystack: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}`).test(haystack);
}

function metadataCompleteness(volume: GoogleBooksVolume): number {
  const { volumeInfo } = volume;
  let score = 0;
  if (volumeInfo.imageLinks?.thumbnail) score += 1;
  if (getBestIsbn(volume)) score += 1;
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

    const isbn = getBestIsbn(volume);
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

  const hasAuthor = (volumeInfo.authors?.length ?? 0) > 0;
  const hasIsbn = !!getBestIsbn(volume);

  // A search for an author's name should surface their own bibliography
  // ahead of unrelated books that merely happen to share that title — e.g.
  // biographies of the author, which otherwise win purely on title match.
  const authorMatches =
    normQuery.length > 2 &&
    (volumeInfo.authors ?? []).some((author) => {
      const normAuthor = normalize(author);
      return normAuthor === normQuery || normAuthor.includes(normQuery) || normQuery.includes(normAuthor);
    });
  if (authorMatches) score += SCORE.authorMatch;

  let titleMatched = false;
  if (title === normQuery) {
    // An exact title match is always meaningful — e.g. an author's own
    // self-titled memoir is genuinely their most notable "Isaac Asimov".
    score += SCORE.exactTitle;
    titleMatched = true;
  } else if (!authorMatches) {
    // Skip weaker partial title-match tiers when the author already
    // matched: an anthology titled "Isaac Asimov Presents..." would
    // otherwise double-count the same "it's his name" signal and outrank
    // his actual standalone novels, whose titles don't repeat his name.
    if (normQuery.length > 0 && title.startsWith(normQuery)) {
      score += SCORE.titleStartsWith;
      titleMatched = true;
    } else if (queryWords.length > 0 && containsWordsInOrder(title, queryWords)) {
      score += SCORE.titleContainsWordsInOrder;
      titleMatched = true;
    }
  }

  // Query words split across title and author (e.g. "Rayuela Julio").
  if (!authorMatches && !titleMatched && queryWords.length > 1) {
    const normAuthors = (volumeInfo.authors ?? []).map(normalize);
    const coversEveryWord = queryWords.every(
      (word) => containsWord(title, word) || normAuthors.some((author) => containsWord(author, word)),
    );
    if (coversEveryWord) score += SCORE.crossFieldMatch;
  }

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
