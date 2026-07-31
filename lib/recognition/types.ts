// Decouples "how we recognize a book from a cover photo" from the UI, so an
// on-device OCR implementation can later be swapped for a multimodal-AI one
// (e.g. sending the photo to a vision model) without touching the screen.
export interface CoverRecognitionResult {
  /** Raw lines as read off the cover, in on-device-OCR order. Always shown
   *  back to the user so nothing detected is ever silently discarded. */
  rawText: string[];
  candidateTitles: string[];
  candidateAuthors: string[];
  /** Ready-to-use Google Books search queries derived from the candidates. */
  searchQueries: string[];
}

export interface BookCoverRecognitionService {
  /** False when the current device/platform can't run recognition at all
   *  (e.g. web, or an unsupported OS version) — callers should skip
   *  straight to a manual fallback rather than attempting recognition. */
  readonly isSupported: boolean;
  recognizeCover(imageUri: string): Promise<CoverRecognitionResult>;
}
