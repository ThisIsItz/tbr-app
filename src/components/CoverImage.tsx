import { Image, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import type { StyleProp } from 'react-native';

import { toFallbackZoomUrl } from '@/api/googleBooks';

interface CoverImageProps {
  uri: string;
  /** Explicit fallback to retry with on error. When omitted, derived from
   *  `uri` by undoing the zoom=3 bump `toHighResUrl` applies. */
  fallbackUri?: string | null;
  style: StyleProp<ImageStyle>;
  blurRadius?: number;
  contentFit?: 'cover' | 'contain';
}

export function CoverImage({ uri, fallbackUri, style, blurRadius, contentFit = 'cover' }: CoverImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const resolvedFallback = fallbackUri === undefined ? toFallbackZoomUrl(uri) : fallbackUri;
  const source = useFallback && resolvedFallback ? resolvedFallback : uri;

  return (
    <Image
      key={uri}
      source={{ uri: source }}
      style={style}
      contentFit={contentFit}
      blurRadius={blurRadius}
      onError={(e) => {
        if (!useFallback && resolvedFallback && resolvedFallback !== source) {
          setUseFallback(true);
        } else {
          console.warn('[CoverImage] cover failed to load:', source, e.error);
        }
      }}
    />
  );
}
