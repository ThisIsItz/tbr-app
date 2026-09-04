import { jsonResponse } from './http';
import { checkGlobalBudget, checkPerTokenLimit } from './rate-limit';
import type { Env } from './types';

const MODEL = '@cf/meta/m2m100-1.2b';
const FEATURE = 'translate';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_CATEGORIES_PER_REQUEST = 100;
const MAX_CATEGORY_LENGTH = 200;
const SUPPORTED_TARGET_LANGS = new Set(['es']);

interface WorkersAiTranslateResponse {
  translated_text?: string;
}

function cacheKeyFor(category: string, targetLang: string): string {
  return `translate:${targetLang}:${category.trim().toLowerCase()}`;
}

async function translateOne(env: Env, category: string, targetLang: string): Promise<string> {
  const cacheKey = cacheKeyFor(category, targetLang);
  const cached = await env.RECOGNITION_KV.get(cacheKey);
  if (cached !== null) return cached;

  const withinBudget = await checkGlobalBudget(env.RECOGNITION_KV, FEATURE, env.TRANSLATE_DAILY_BUDGET_LIMIT);
  if (!withinBudget) return category;

  try {
    const result = (await env.AI.run(MODEL, {
      text: category,
      source_lang: 'en',
      target_lang: targetLang,
    })) as WorkersAiTranslateResponse;
    const translated = result.translated_text?.trim();
    if (!translated) return category;

    await env.RECOGNITION_KV.put(cacheKey, translated, { expirationTtl: CACHE_TTL_SECONDS });
    return translated;
  } catch (error) {
    console.error('[translate] Workers AI request failed', { error: String(error) });
    return category;
  }
}

export async function handleTranslateCategories(request: Request, env: Env): Promise<Response> {
  const clientToken = request.headers.get('x-client-token');
  if (!clientToken) {
    return jsonResponse({ error: 'missing_client_token' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const { categories, targetLang } = (body ?? {}) as { categories?: unknown; targetLang?: unknown };

  if (typeof targetLang !== 'string' || !SUPPORTED_TARGET_LANGS.has(targetLang)) {
    return jsonResponse({ error: 'unsupported_target_lang' }, 400);
  }
  if (
    !Array.isArray(categories) ||
    categories.some((c) => typeof c !== 'string' || c.length === 0 || c.length > MAX_CATEGORY_LENGTH)
  ) {
    return jsonResponse({ error: 'invalid_categories' }, 400);
  }
  if (categories.length > MAX_CATEGORIES_PER_REQUEST) {
    return jsonResponse({ error: 'too_many_categories' }, 400);
  }

  const uniqueCategories = [...new Set(categories as string[])];

  // Rate limits only guard the paid AI call, so check cache first — a fully
  // cached request (the common case once genres warm up) costs zero KV writes.
  const cacheChecks = await Promise.all(
    uniqueCategories.map(
      async (category) => [category, await env.RECOGNITION_KV.get(cacheKeyFor(category, targetLang))] as const,
    ),
  );
  const cached = new Map(cacheChecks.filter((entry): entry is [string, string] => entry[1] !== null));
  const missing = uniqueCategories.filter((category) => !cached.has(category));

  if (missing.length > 0) {
    const withinTokenLimit = await checkPerTokenLimit(
      env.RECOGNITION_KV,
      FEATURE,
      clientToken,
      env.TRANSLATE_PER_TOKEN_DAILY_LIMIT,
    );
    if (!withinTokenLimit) {
      return jsonResponse({ error: 'rate_limited' }, 429);
    }
  }

  const missingEntries = await Promise.all(
    missing.map(async (category) => [category, await translateOne(env, category, targetLang)] as const),
  );

  return jsonResponse({ translations: Object.fromEntries([...cached, ...missingEntries]) }, 200);
}
