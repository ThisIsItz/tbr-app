import { toHighResUrl, toHttpsUrl } from '@/api/googleBooks';

export interface CoverResolution {
  url: string;
  /** false only on a network failure — the URL shown is a safe guess, not
   * a confirmed answer, so callers shouldn't persist it as final. */
  resolved: boolean;
}

// Google doesn't error when the zoom=3 tier is missing — it returns 200
// with its own "image not available" graphic (served as image/png; real
// covers are always image/jpeg), so this is the only reliable way to tell.
export async function resolveCoverUrl(rawThumbnailUrl: string): Promise<CoverResolution> {
  const fallback = toHttpsUrl(rawThumbnailUrl) ?? rawThumbnailUrl;
  const highRes = toHighResUrl(rawThumbnailUrl);
  if (!highRes || highRes === fallback) return { url: fallback, resolved: true };

  try {
    const response = await fetch(highRes, { method: 'HEAD' });
    const isRealCover = response.headers.get('content-type') === 'image/jpeg';
    return { url: isRealCover ? highRes : fallback, resolved: true };
  } catch {
    return { url: fallback, resolved: false };
  }
}
