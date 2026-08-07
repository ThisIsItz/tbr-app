export interface BookGuess {
  title: string;
  author: string | null;
  confidence: 'low' | 'medium' | 'high';
}

export interface RecognizeCoverResponse {
  books: BookGuess[];
  requestId: string;
}

export interface Env {
  RECOGNITION_KV: KVNamespace;
  AI: Ai;
  GEMINI_API_KEY: string;
  /** Which vision backend is active — see providers/index.ts. Gemini is
   *  kept fully implemented but not selected by default. */
  VISION_PROVIDER: 'workers-ai' | 'gemini';
  DAILY_BUDGET_LIMIT: number;
  PER_TOKEN_DAILY_LIMIT: number;
  MAX_BODY_BYTES: number;
}
