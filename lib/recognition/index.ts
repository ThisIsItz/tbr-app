import { ocrBookCoverRecognitionService } from './ocr-recognition-service';
import type { BookCoverRecognitionService, CoverRecognitionResult } from './types';
import { recognizeCoverWithVisionApi } from './vision-recognition-service';

export type { BookCoverRecognitionService, BookGuess, CoverRecognitionResult, RecognitionConfidence } from './types';

const isVisionConfigured = !!process.env.EXPO_PUBLIC_RECOGNIZE_COVER_API_URL;

// Tries vision first, falls back to OCR on any failure.
export const bookCoverRecognitionService: BookCoverRecognitionService = {
  isSupported: isVisionConfigured || ocrBookCoverRecognitionService.isSupported,
  async recognizeCover(imageUri: string): Promise<CoverRecognitionResult> {
    if (isVisionConfigured) {
      try {
        return await recognizeCoverWithVisionApi(imageUri);
      } catch (error) {
        console.warn('[recognition] vision API failed, falling back to on-device OCR:', error);
      }
    }
    return ocrBookCoverRecognitionService.recognizeCover(imageUri);
  },
};
