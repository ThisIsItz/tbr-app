import { handleBookById, handleBooksSearch } from './books';
import { getCachedResult, hashImageBytes, setCachedResult } from './cache';
import { corsPreflightResponse, jsonResponse } from './http';
import { getActiveVisionProvider } from './providers';
import { VisionProviderError } from './providers/types';
import { checkGlobalBudget, checkPerTokenLimit } from './rate-limit';
import type { Env } from './types';

const RECOGNIZE_PATH = '/v1/recognize-cover';
const BOOKS_VOLUMES_PATH = '/v1/books/volumes';
const ALLOWED_CONTENT_TYPE = 'image/jpeg';

async function handleRecognizeCover(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('content-type');
  if (contentType !== ALLOWED_CONTENT_TYPE) {
    return jsonResponse({ error: 'unsupported_content_type' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > env.MAX_BODY_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413);
  }

  const clientToken = request.headers.get('x-client-token');
  if (!clientToken) {
    return jsonResponse({ error: 'missing_client_token' }, 400);
  }

  const imageBytes = await request.arrayBuffer();
  if (imageBytes.byteLength > env.MAX_BODY_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413);
  }
  if (imageBytes.byteLength === 0) {
    return jsonResponse({ error: 'empty_body' }, 400);
  }

  const withinGlobalBudget = await checkGlobalBudget(env.RECOGNITION_KV, 'recognize', env.DAILY_BUDGET_LIMIT);
  if (!withinGlobalBudget) {
    return jsonResponse({ error: 'daily_budget_exceeded' }, 503);
  }

  const withinTokenLimit = await checkPerTokenLimit(
    env.RECOGNITION_KV,
    'recognize',
    clientToken,
    env.PER_TOKEN_DAILY_LIMIT,
  );
  if (!withinTokenLimit) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  const requestId = crypto.randomUUID();
  const imageHash = await hashImageBytes(imageBytes);

  const cached = await getCachedResult(env, imageHash);
  if (cached) {
    return jsonResponse({ books: cached, requestId }, 200);
  }

  try {
    const provider = getActiveVisionProvider(env);
    const books = await provider.recognizeBookCover(imageBytes);
    await setCachedResult(env, imageHash, books);
    return jsonResponse({ books, requestId }, 200);
  } catch (error) {
    // Never log request bodies or image contents — status/error code only.
    const code = error instanceof VisionProviderError ? error.code : 'unknown';
    console.error('[recognize-cover] vision provider failed', { code, requestId });
    return jsonResponse({ error: 'model_error', requestId }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);

    if (url.pathname === RECOGNIZE_PATH) {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'method_not_allowed' }, 405);
      }
      return handleRecognizeCover(request, env);
    }

    if (url.pathname === BOOKS_VOLUMES_PATH) {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'method_not_allowed' }, 405);
      }
      return handleBooksSearch(request, env);
    }

    if (url.pathname.startsWith(`${BOOKS_VOLUMES_PATH}/`)) {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'method_not_allowed' }, 405);
      }
      const volumeId = url.pathname.slice(`${BOOKS_VOLUMES_PATH}/`.length);
      if (!volumeId) {
        return jsonResponse({ error: 'not_found' }, 404);
      }
      return handleBookById(request, env, volumeId);
    }

    return jsonResponse({ error: 'not_found' }, 404);
  },
} satisfies ExportedHandler<Env>;
