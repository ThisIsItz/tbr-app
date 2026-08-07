import type { Env } from './types';

const DAY_TTL_SECONDS = 60 * 60 * 26;

function todayKey(prefix: string, suffix: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}:${suffix}:${today}`;
}

// Not atomic (KV is eventually consistent) — acceptable at this scale.
async function incrementAndCheck(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const current = Number((await kv.get(key)) ?? '0');
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: DAY_TTL_SECONDS });
  return true;
}

// Global daily ceiling — the real cost backstop.
export async function checkGlobalBudget(env: Env): Promise<boolean> {
  return incrementAndCheck(env.RECOGNITION_KV, todayKey('global', 'count'), env.DAILY_BUDGET_LIMIT);
}

// Soft per-client limit; token is spoofable, not a security boundary.
export async function checkPerTokenLimit(env: Env, token: string): Promise<boolean> {
  return incrementAndCheck(env.RECOGNITION_KV, todayKey('token', token), env.PER_TOKEN_DAILY_LIMIT);
}
