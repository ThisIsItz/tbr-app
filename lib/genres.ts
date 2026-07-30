// Google Books categories arrive as hierarchical paths (e.g. "Fiction /
// Fantasy / Epic") and often repeat across multiple entries for the same
// book. We only want the meaningful leaf of each path, with generic/empty
// segments dropped and near-duplicates (case/whitespace variants) merged.
const GENERIC_GENRE_TERMS = new Set(['fiction', 'general', 'nonfiction', 'non-fiction']);

function extractLeaf(path: string): string | null {
  const segments = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !GENERIC_GENRE_TERMS.has(segment.toLowerCase()));

  return segments.length > 0 ? segments[segments.length - 1] : null;
}

export function normalizeGenres(raw: string[]): string[] {
  const seen = new Map<string, string>();

  for (const entry of raw) {
    const leaf = extractLeaf(entry);
    if (!leaf) continue;

    const key = leaf.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.set(key, leaf);
    }
  }

  return [...seen.values()];
}
