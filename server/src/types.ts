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
  VISION_PROVIDER: 'workers-ai' | 'gemini';
  DAILY_BUDGET_LIMIT: number;
  PER_TOKEN_DAILY_LIMIT: number;
  MAX_BODY_BYTES: number;
}
