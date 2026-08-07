import type { Env } from './types';

// Slightly over a day so a slow day-boundary read doesn't drop a counter
// right before it would naturally reset.
const DAY_TTL_SECONDS = 60 * 60 * 26;

function todayKey(prefix: string, suffix: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  return `${prefix}:${suffix}:${today}`;
}

// KV is eventually consistent — this increment-then-check is not atomic, so
// concurrent requests can occasionally both slip through right at the
// boundary. Acceptable at this app's scale; not a security boundary (see
// checkPerTokenLimit below), and the global budget has headroom built in.
async function incrementAndCheck(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const current = Number((await kv.get(key)) ?? '0');
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: DAY_TTL_SECONDS });
  return true;
}

// Primary cost safeguard: a single global daily ceiling. Once tripped, every
// request fails (all clients fall back to on-device OCR) regardless of
// anything else — the actual backstop against worst-case bill shock.
export async function checkGlobalBudget(env: Env): Promise<boolean> {
  return incrementAndCheck(env.RECOGNITION_KV, todayKey('global', 'count'), env.DAILY_BUDGET_LIMIT);
}

// Secondary, soft per-client limit. The token is a client-generated UUID —
// trivially spoofable — so this only ever blocks a single runaway or
// misbehaving client, not a real abuse boundary.
export async function checkPerTokenLimit(env: Env, token: string): Promise<boolean> {
  return incrementAndCheck(env.RECOGNITION_KV, todayKey('token', token), env.PER_TOKEN_DAILY_LIMIT);
}
