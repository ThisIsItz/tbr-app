import type { Env } from '../types';
import { createGeminiProvider } from './gemini-provider';
import type { VisionProvider } from './types';
import { createWorkersAiProvider } from './workers-ai-provider';

// Selected via wrangler.toml's VISION_PROVIDER var.
export function getActiveVisionProvider(env: Env): VisionProvider {
  if (env.VISION_PROVIDER === 'gemini') {
    return createGeminiProvider(env.GEMINI_API_KEY);
  }
  return createWorkersAiProvider(env.AI);
}
