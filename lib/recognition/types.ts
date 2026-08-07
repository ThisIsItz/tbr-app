// Decouples "how we recognize a book from a cover photo" from the UI, so an
// on-device OCR implementation can later be swapped for a multimodal-AI one
// (e.g. sending the photo to a vision model) without touching the screen.
export type RecognitionConfidence = 'low' | 'medium' | 'high';

// A best-effort guess only — never treated as verified book metadata.
// Callers must always let the user review/edit `title`/`author` before
// searching, and must always require explicit confirmation before saving
// anything found from them.
export interface BookGuess {
  title: string;
  author: string | null;
  confidence: RecognitionConfidence;
}

export interface CoverRecognitionResult {
  /** v1 UX targets a single main book per photo — only books[0] is read by
   *  the screen today. Kept as an array as a forward-compat seed for a
   *  possible future multi-book UI; nothing beyond index 0 is rendered yet. */
  books: BookGuess[];
  /** Raw OCR lines — only ever populated by the on-device fallback path
   *  (kept as a fallback/debugging aid, e.g. to manually spot a title the
   *  heuristic got wrong). Absent for vision-backed results, which have no
   *  equivalent raw text to show. */
  rawText?: string[];
  /** Which backend actually produced this result — lets the UI show a
   *  "less reliable, on-device guess" notice when the vision API wasn't
   *  used (unreachable, unconfigured, or errored), never silently. */
  source: 'vision' | 'ocr';
}

export interface BookCoverRecognitionService {
  /** False when the current device/platform can't run recognition at all
   *  (e.g. web, or an unsupported OS version) — callers should skip
   *  straight to a manual fallback rather than attempting recognition. */
  readonly isSupported: boolean;
  /** Implementations may be OCR-based (a heuristic guess, as today) or,
   *  later, backed by a multimodal vision API for genuinely structured
   *  extraction — callers must treat every result as a *suggestion*
   *  regardless of which, per `confidence`. */
  recognizeCover(imageUri: string): Promise<CoverRecognitionResult>;
}
