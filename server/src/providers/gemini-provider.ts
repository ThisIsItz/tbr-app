import { extractJsonText, validateBooks, VisionProviderError, withTimeout, type VisionProvider } from './types';

// Kept fully working but not active by default (see providers/index.ts) —
// billing was never enabled for this key, and the user asked not to enable
// it/purchase credits. Reactivating later is a config flip
// (VISION_PROVIDER = "gemini" in wrangler.toml), no code changes needed.
//
// Model choice verified directly against the live API on 2026-07-31 (doc
// pages proved stale/inconsistent, so this was confirmed empirically, not
// from docs): `gemini-2.5-flash-lite` 404s ("no longer available to new
// users"). ListModels for the test key confirmed `gemini-2.0-flash-lite` is
// still live and accepts this exact request shape (structured-output
// schema included). Re-verify with `GET /v1beta/models` if this 404s later.
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 300;

const PROMPT =
  'You are looking at a photo that may show one or more books. Identify ONLY the single main, ' +
  'foreground book that is clearly the subject of this photo — ignore background books, ' +
  'bookshelves, unrelated objects, or incidental text elsewhere in the frame. If you cannot ' +
  'confidently identify a book at all, return an empty "books" array. For the identified book, ' +
  'read its title and author exactly as printed on the cover (do not guess or invent — omit ' +
  'author if it is not visible), and rate your own confidence as "low", "medium", or "high".';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    books: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          author: { type: 'STRING', nullable: true },
          confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
        },
        required: ['title', 'confidence'],
      },
    },
  },
  required: ['books'],
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function createGeminiProvider(apiKey: string): VisionProvider {
  return {
    async recognizeBookCover(imageBytes: ArrayBuffer) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: PROMPT },
                  { inline_data: { mime_type: 'image/jpeg', data: arrayBufferToBase64(imageBytes) } },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              response_schema: RESPONSE_SCHEMA,
              max_output_tokens: MAX_OUTPUT_TOKENS,
            },
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new VisionProviderError('Gemini request timed out', 'timeout');
        }
        throw new VisionProviderError(`Gemini request failed: ${String(error)}`, 'upstream_error');
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new VisionProviderError(`Gemini returned ${response.status}`, 'upstream_error');
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new VisionProviderError('Gemini returned no content', 'invalid_response');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonText(text));
      } catch {
        throw new VisionProviderError('Gemini response was not valid JSON', 'invalid_response');
      }

      return validateBooks(parsed);
    },
  };
}
