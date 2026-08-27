import { getCachedBooksResult, setCachedBooksResult } from './cache';
import { jsonResponse } from './http';
import { checkGlobalBudget, checkPerTokenLimit } from './rate-limit';
import type { Env, GoogleBooksSearchResponse, GoogleBooksVolume } from './types';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const FEATURE = 'books';

async function checkBudgets(env: Env, clientToken: string): Promise<Response | null> {
  const withinGlobalBudget = await checkGlobalBudget(env.RECOGNITION_KV, FEATURE, env.BOOKS_DAILY_BUDGET_LIMIT);
  if (!withinGlobalBudget) {
    return jsonResponse({ error: 'daily_budget_exceeded' }, 503);
  }

  const withinTokenLimit = await checkPerTokenLimit(
    env.RECOGNITION_KV,
    FEATURE,
    clientToken,
    env.BOOKS_PER_TOKEN_DAILY_LIMIT,
  );
  if (!withinTokenLimit) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  return null;
}

function requireClientToken(request: Request): string | Response {
  const clientToken = request.headers.get('x-client-token');
  if (!clientToken) {
    return jsonResponse({ error: 'missing_client_token' }, 400);
  }
  return clientToken;
}

async function fetchFromGoogle(path: string, params: URLSearchParams, env: Env): Promise<Response> {
  params.set('key', env.GOOGLE_BOOKS_API_KEY);
  const response = await fetch(`${GOOGLE_BOOKS_API_URL}${path}?${params.toString()}`);
  if (!response.ok) {
    return jsonResponse({ error: 'upstream_error', status: response.status }, 502);
  }
  return response;
}

export async function handleBooksSearch(request: Request, env: Env): Promise<Response> {
  const clientTokenOrResponse = requireClientToken(request);
  if (clientTokenOrResponse instanceof Response) return clientTokenOrResponse;

  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  if (!q) {
    return jsonResponse({ error: 'missing_query' }, 400);
  }
  const maxResults = url.searchParams.get('maxResults') ?? '20';

  const cacheKey = `search:${q}:${maxResults}`;
  const cached = await getCachedBooksResult<GoogleBooksSearchResponse>(env, cacheKey);
  if (cached) {
    return jsonResponse(cached, 200);
  }

  const budgetResponse = await checkBudgets(env, clientTokenOrResponse);
  if (budgetResponse) return budgetResponse;

  const upstreamResponse = await fetchFromGoogle('', new URLSearchParams({ q, maxResults }), env);
  if (!upstreamResponse.ok) return upstreamResponse;

  const data = (await upstreamResponse.json()) as GoogleBooksSearchResponse;
  await setCachedBooksResult(env, cacheKey, data);
  return jsonResponse(data, 200);
}

export async function handleBookById(request: Request, env: Env, volumeId: string): Promise<Response> {
  const clientTokenOrResponse = requireClientToken(request);
  if (clientTokenOrResponse instanceof Response) return clientTokenOrResponse;

  const cacheKey = `volume:${volumeId}`;
  const cached = await getCachedBooksResult<GoogleBooksVolume>(env, cacheKey);
  if (cached) {
    return jsonResponse(cached, 200);
  }

  const budgetResponse = await checkBudgets(env, clientTokenOrResponse);
  if (budgetResponse) return budgetResponse;

  const upstreamResponse = await fetchFromGoogle(`/${volumeId}`, new URLSearchParams(), env);
  if (!upstreamResponse.ok) return upstreamResponse;

  const data = (await upstreamResponse.json()) as GoogleBooksVolume;
  await setCachedBooksResult(env, cacheKey, data);
  return jsonResponse(data, 200);
}
