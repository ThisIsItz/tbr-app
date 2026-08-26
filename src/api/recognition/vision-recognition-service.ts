import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { getOrCreateDeviceToken } from '@/lib/device-token';

import type { BookGuess, CoverRecognitionResult } from './types';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.6;
const REQUEST_TIMEOUT_MS = 15_000;

async function resizeForUpload(imageUri: string): Promise<string> {
  const image = await ImageManipulator.manipulate(imageUri).resize({ width: MAX_DIMENSION }).renderAsync();
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}

interface RecognizeCoverApiResponse {
  books?: BookGuess[];
  requestId?: string;
  error?: string;
}

// Talks to the server/ Worker. Throws on any failure so the caller can
// fall back to on-device OCR.
export async function recognizeCoverWithVisionApi(imageUri: string): Promise<CoverRecognitionResult> {
  const apiUrl = process.env.EXPO_PUBLIC_RECOGNIZE_COVER_API_URL;
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_RECOGNIZE_COVER_API_URL is not configured');
  }

  const resizedUri = await resizeForUpload(imageUri);
  const deviceToken = await getOrCreateDeviceToken();

  const imageBlob = await (await fetch(resizedUri)).blob();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Client-Token': deviceToken,
      },
      body: imageBlob,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Cover recognition request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Cover recognition API returned ${response.status}`);
  }

  const payload = (await response.json()) as RecognizeCoverApiResponse;
  if (!Array.isArray(payload.books)) {
    throw new Error('Cover recognition API returned an unexpected response shape');
  }

  return { books: payload.books, source: 'vision' };
}
