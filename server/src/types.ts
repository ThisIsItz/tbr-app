export type { BookGuess } from '../../shared/recognition';

export interface Env {
  RECOGNITION_KV: KVNamespace;
  AI: Ai;
  GEMINI_API_KEY: string;
  VISION_PROVIDER: 'workers-ai' | 'gemini';
  DAILY_BUDGET_LIMIT: number;
  PER_TOKEN_DAILY_LIMIT: number;
  MAX_BODY_BYTES: number;
  TRANSLATE_DAILY_BUDGET_LIMIT: number;
  TRANSLATE_PER_TOKEN_DAILY_LIMIT: number;
}
