export function normalizeGenres(raw: string[]): string[] {
  const seen = new Map<string, string>();

  for (const entry of raw) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, trimmed);
    }
  }

  return [...seen.values()];
}
