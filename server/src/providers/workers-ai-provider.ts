import { extractJsonText, validateBooks, VisionProviderError, withTimeout, type VisionProvider } from './types';

// Image must be a plain byte array via `image` + `prompt` (not `messages`).
// No native JSON-schema support, so output is validated via validateBooks().
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const MAX_TOKENS = 300;
const REQUEST_TIMEOUT_MS = 12_000;

const PROMPT =
  'You are looking at a photo that may show one or more books. Identify ONLY the single main, ' +
  'foreground book that is clearly the subject of this photo — ignore background books, ' +
  'bookshelves, unrelated objects, or incidental text elsewhere in the frame. If you cannot ' +
  'confidently identify a book at all, respond with {"books": []}. For the identified book, read ' +
  'its title and author exactly as printed on the cover (do not guess or invent — omit author if ' +
  'it is not visible), and rate your own confidence as "low", "medium", or "high".\n\n' +
  'Respond with ONLY a single valid JSON object in exactly this shape, and nothing else — no ' +
  'markdown code fences, no explanation, no extra text:\n' +
  '{"books": [{"title": "...", "author": "..." | null, "confidence": "low" | "medium" | "high"}]}';

// response can come back as a string or already-parsed object.
interface WorkersAiTextResponse {
  response?: string | Record<string, unknown>;
}

export function createWorkersAiProvider(ai: Ai): VisionProvider {
  return {
    async recognizeBookCover(imageBytes: ArrayBuffer) {
      const encodedImage = [...new Uint8Array(imageBytes)];

      let result: WorkersAiTextResponse;
      try {
        result = (await withTimeout(
          ai.run(MODEL, {
            image: encodedImage,
            prompt: PROMPT,
            max_tokens: MAX_TOKENS,
            temperature: 0.2,
          }),
          REQUEST_TIMEOUT_MS,
        )) as WorkersAiTextResponse;
      } catch (error) {
        if (error instanceof VisionProviderError) throw error;
        throw new VisionProviderError(`Workers AI request failed: ${String(error)}`, 'upstream_error');
      }

      const responseValue = result.response;
      if (responseValue === undefined || responseValue === null) {
        throw new VisionProviderError('Workers AI returned no content', 'invalid_response');
      }

      let parsed: unknown;
      if (typeof responseValue === 'string') {
        try {
          parsed = JSON.parse(extractJsonText(responseValue));
        } catch {
          throw new VisionProviderError('Workers AI response was not valid JSON', 'invalid_response');
        }
      } else {
        parsed = responseValue;
      }

      return validateBooks(parsed);
    },
  };
}
