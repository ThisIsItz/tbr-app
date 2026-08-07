import { ocrBookCoverRecognitionService } from './ocr-recognition-service';
import type { BookCoverRecognitionService, CoverRecognitionResult } from './types';
import { recognizeCoverWithVisionApi } from './vision-recognition-service';

export type { BookCoverRecognitionService, BookGuess, CoverRecognitionResult, RecognitionConfidence } from './types';

const isVisionConfigured = !!process.env.EXPO_PUBLIC_RECOGNIZE_COVER_API_URL;

// The single entry point the UI uses. Tries the vision backend first (when
// configured); any failure there — network error, timeout, unconfigured
// URL, a bad response — falls back to on-device OCR rather than dead-ending,
// per the "OCR as optional fallback" requirement. The result is always
// tagged with which path actually produced it so the UI can show a "less
// reliable, on-device guess" notice instead of silently swapping providers.
export const bookCoverRecognitionService: BookCoverRecognitionService = {
  isSupported: isVisionConfigured || ocrBookCoverRecognitionService.isSupported,
  async recognizeCover(imageUri: string): Promise<CoverRecognitionResult> {
    if (isVisionConfigured) {
      try {
        return await recognizeCoverWithVisionApi(imageUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[recognition] vision API failed, falling back to on-device OCR:', error);
        const ocrResult = await ocrBookCoverRecognitionService.recognizeCover(imageUri);
        return { ...ocrResult, debugFallbackReason: message };
      }
    }
    const ocrResult = await ocrBookCoverRecognitionService.recognizeCover(imageUri);
    return { ...ocrResult, debugFallbackReason: 'EXPO_PUBLIC_RECOGNIZE_COVER_API_URL not set' };
  },
};
