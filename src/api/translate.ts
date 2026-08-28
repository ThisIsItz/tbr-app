import { getOrCreateDeviceToken } from '@/lib/deviceToken';

function translateApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_TRANSLATE_API_URL;
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_TRANSLATE_API_URL is not configured');
  }
  return apiUrl;
}

export async function translateCategories(
  categories: string[],
  targetLang: string,
): Promise<Record<string, string>> {
  if (categories.length === 0) return {};

  try {
    const deviceToken = await getOrCreateDeviceToken();
    const response = await fetch(translateApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Token': deviceToken },
      body: JSON.stringify({ categories, targetLang }),
    });
    if (!response.ok) return {};

    const data = (await response.json()) as { translations?: Record<string, string> };
    return data.translations ?? {};
  } catch {
    return {};
  }
}
