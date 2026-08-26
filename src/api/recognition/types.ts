import type { BookGuess } from '@shared/recognition';

export type { BookGuess, RecognitionConfidence } from '@shared/recognition';

export interface CoverRecognitionResult {
  // v1 only reads books[0]; kept as an array for future multi-book UI.
  books: BookGuess[];
  // Only populated by the OCR fallback path.
  rawText?: string[];
  source: 'vision' | 'ocr';
}

export interface BookCoverRecognitionService {
  readonly isSupported: boolean;
  recognizeCover(imageUri: string): Promise<CoverRecognitionResult>;
}
