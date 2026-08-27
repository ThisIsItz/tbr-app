# Cover Recognition & Books Worker

Cloudflare Worker backend for `app/recognize-cover.tsx`'s smart-scan path, and for all Google Books search/lookup calls (`src/api/googleBooks.ts`). Proxies to Gemini 2.5 Flash-Lite and to Google Books so neither API key ever ships inside the mobile app. See `/Users/itziar/.claude/plans/sleepy-spinning-hinton.md` for the cover-recognition architecture rationale, and `/Users/itziar/.claude/plans/cryptic-questing-noodle.md` for the Google Books proxy.

## One-time setup (manual — requires your own Cloudflare/Google accounts)

```bash
cd server
npm install

# 1. Log in to Cloudflare (if not already)
npx wrangler login

# 2. Create the KV namespace used for rate-limit counters + result cache
npx wrangler kv namespace create RECOGNITION_KV
# Paste the returned `id` into wrangler.toml's [[kv_namespaces]] block.

# 3. Set your Gemini API key as a Worker secret (never committed)
npx wrangler secret put GEMINI_API_KEY
# Get a key at https://aistudio.google.com/apikey if you don't have one.

# 4. Set your Google Books API key as a Worker secret (never committed)
npx wrangler secret put GOOGLE_BOOKS_API_KEY
# Get one at https://console.cloud.google.com/apis/credentials after enabling
# the "Books API" for a project.

# 5. For local `wrangler dev` testing, also copy both keys into .dev.vars
cp .dev.vars.example .dev.vars
# then edit .dev.vars and paste the same keys in (this file is gitignored)
```

## Local development

```bash
npm run dev        # wrangler dev — serves on http://localhost:8787
npm run typecheck  # tsc --noEmit
```

### Manual test cases (run against `wrangler dev`)

```bash
# Valid request (replace with a real resized JPEG)
curl -i -X POST http://localhost:8787/v1/recognize-cover \
  -H "Content-Type: image/jpeg" \
  -H "X-Client-Token: test-token-1" \
  --data-binary @/path/to/cover.jpg

# Wrong content-type -> expect 415
curl -i -X POST http://localhost:8787/v1/recognize-cover \
  -H "Content-Type: application/json" \
  -H "X-Client-Token: test-token-1" \
  -d '{}'

# Oversized body -> expect 413 (generate a >2MB file first)
head -c 3000000 /dev/urandom > /tmp/big.jpg
curl -i -X POST http://localhost:8787/v1/recognize-cover \
  -H "Content-Type: image/jpeg" \
  -H "X-Client-Token: test-token-1" \
  --data-binary @/tmp/big.jpg

# Repeat the first (valid) request with the same file -> second call should
# be a cache hit (same result, no new Gemini call — check Gemini usage in
# Google AI Studio to confirm no extra billed request).

# Rate limit -> repeat the valid request 21+ times with the same
# X-Client-Token in one day; the 21st+ should return 429.

# Books search
curl -i "http://localhost:8787/v1/books/volumes?q=harry+potter" \
  -H "X-Client-Token: test-token-1"

# Missing token -> expect 400
curl -i "http://localhost:8787/v1/books/volumes?q=harry+potter"

# Book by id (use a real id from the search response above)
curl -i "http://localhost:8787/v1/books/volumes/<id>" \
  -H "X-Client-Token: test-token-1"

# Repeat either call -> second response should be a cache hit (faster,
# check `wrangler dev`'s console output for no repeated upstream fetch).
```

## Deploying

```bash
npm run deploy
```

Then set both of these in the app's `.env` **including the endpoint path** (the client fetches these URLs directly with no path appended, so the base domain alone will 404):
- `EXPO_PUBLIC_RECOGNIZE_COVER_API_URL=https://tbr-cover-recognition.<your-subdomain>.workers.dev/v1/recognize-cover`
- `EXPO_PUBLIC_BOOKS_API_URL=https://tbr-cover-recognition.<your-subdomain>.workers.dev/v1/books`

If building via EAS, also update both in EAS's own env store (`eas env:create --environment preview --name <VAR_NAME> --value <url> --force`), since cloud builds don't read the local `.env`.

## Tuning cost controls

`wrangler.toml`'s `[vars]` block controls the rate limits without a code change:
- `DAILY_BUDGET_LIMIT` / `PER_TOKEN_DAILY_LIMIT` — cover-recognition global/per-client daily ceilings.
- `BOOKS_DAILY_BUDGET_LIMIT` / `BOOKS_PER_TOKEN_DAILY_LIMIT` — same, for the `/v1/books/*` proxy. Search is a much lighter, more frequent action than a vision-model scan, so these start higher.

After a deploy, redeploy (`npm run deploy`) to apply any `[vars]` change.
