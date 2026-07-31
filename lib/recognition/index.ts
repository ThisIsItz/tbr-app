export type { BookCoverRecognitionService, CoverRecognitionResult } from './types';
// Sole place the concrete OCR implementation is wired in — swap this line
// for a multimodal-AI-backed service later without touching any screen.
export { ocrBookCoverRecognitionService as bookCoverRecognitionService } from './ocr-recognition-service';
