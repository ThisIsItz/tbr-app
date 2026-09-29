import { toHighResUrl, toHttpsUrl } from '@/api/googleBooks';

export interface CoverResolution {
  url: string;
  resolved: boolean;
}

// A missing zoom=3 tier returns 200 with a placeholder graphic (png, not
// jpeg) instead of erroring — content-type is the only way to tell.
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
