import { randomUUID } from 'expo-crypto';

import { getSetting, setSetting } from '@/lib/repository/settings-repository';

const DEVICE_TOKEN_SETTING_KEY = 'deviceToken';

// Per-install id used only to key the backend's rate-limit bucket.
export async function getOrCreateDeviceToken(): Promise<string> {
  const existing = await getSetting(DEVICE_TOKEN_SETTING_KEY);
  if (existing) return existing;

  const token = randomUUID();
  await setSetting(DEVICE_TOKEN_SETTING_KEY, token);
  return token;
}
