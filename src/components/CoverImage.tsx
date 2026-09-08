import { Image, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import type { StyleProp } from 'react-native';

import { toFallbackZoomUrl } from '@/api/googleBooks';

interface CoverImageProps {
  uri: string;
  /** Explicit fallback to start from and fall back to on error. When
   *  omitted, derived from `uri` by undoing the zoom=3 bump `toHighResUrl`
   *  applies. */
  fallbackUri?: string | null;
  style: StyleProp<ImageStyle>;
  blurRadius?: number;
  contentFit?: 'cover' | 'contain';
}

// Not every scanned cover has a zoom=3 tier. When it's missing, Google's
// content server doesn't error — it responds 200 with its own "image not
// available" graphic in place of the cover, served as image/png (real
// covers always come back as image/jpeg). `onError` never fires for that,
// so we can't just retry on failure: we start from the safe fallback and
// only switch to the sharper `uri` once a HEAD check confirms it's real.
export function CoverImage({ uri, fallbackUri, style, blurRadius, contentFit = 'cover' }: CoverImageProps) {
  const resolvedFallback = fallbackUri === undefined ? toFallbackZoomUrl(uri) : fallbackUri;
  const [source, setSource] = useState(resolvedFallback ?? uri);

  useEffect(() => {
    setSource(resolvedFallback ?? uri);
    if (!resolvedFallback || resolvedFallback === uri) return;

    let cancelled = false;
    fetch(uri, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled && res.headers.get('content-type') === 'image/jpeg') {
          setSource(uri);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uri, resolvedFallback]);

  return (
    <Image
      source={{ uri: source }}
      style={style}
      contentFit={contentFit}
      blurRadius={blurRadius}
      onError={(e) => {
        if (source !== resolvedFallback && resolvedFallback) {
          setSource(resolvedFallback);
        } else {
          console.warn('[CoverImage] cover failed to load:', source, e.error);
        }
      }}
    />
  );
}
