const DAY_TTL_SECONDS = 60 * 60 * 26;

function todayKey(prefix: string, suffix: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}:${suffix}:${today}`;
}

// Not atomic (KV is eventually consistent) — acceptable at this scale.
async function incrementAndCheck(kv: KVNamespace, key: string, limit: number, amount = 1): Promise<boolean> {
  const current = Number((await kv.get(key)) ?? '0');
  if (current + amount > limit) return false;
  await kv.put(key, String(current + amount), { expirationTtl: DAY_TTL_SECONDS });
  return true;
}

export async function checkGlobalBudget(
  kv: KVNamespace,
  feature: string,
  limit: number,
  amount = 1,
): Promise<boolean> {
  return incrementAndCheck(kv, todayKey(`global:${feature}`, 'count'), limit, amount);
}

// Soft per-client limit; token is spoofable, not a security boundary.
export async function checkPerTokenLimit(
  kv: KVNamespace,
  feature: string,
  token: string,
  limit: number,
): Promise<boolean> {
  return incrementAndCheck(kv, todayKey(`token:${feature}`, token), limit);
}
