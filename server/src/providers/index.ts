import type { Env } from '../types';
import { createGeminiProvider } from './gemini-provider';
import type { VisionProvider } from './types';
import { createWorkersAiProvider } from './workers-ai-provider';

// Provider is chosen via wrangler.toml's VISION_PROVIDER var — Gemini stays
// fully implemented but inactive by default (billing was never enabled for
// it, and it should stay that way per instruction). Flip
// VISION_PROVIDER = "gemini" in wrangler.toml and redeploy to reactivate it
// later; no code changes needed.
export function getActiveVisionProvider(env: Env): VisionProvider {
  if (env.VISION_PROVIDER === 'gemini') {
    return createGeminiProvider(env.GEMINI_API_KEY);
  }
  return createWorkersAiProvider(env.AI);
}
