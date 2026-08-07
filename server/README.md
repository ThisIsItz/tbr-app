# Cover Recognition Worker

Cloudflare Worker backend for `app/recognize-cover.tsx`'s smart-scan path. Proxies to Gemini 2.5 Flash-Lite so the API key never ships inside the mobile app. See `/Users/itziar/.claude/plans/sleepy-spinning-hinton.md` for the full architecture rationale.

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

# 4. For local `wrangler dev` testing, also copy the key into .dev.vars
cp .dev.vars.example .dev.vars
# then edit .dev.vars and paste the same key in (this file is gitignored)
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
```

## Deploying

```bash
npm run deploy
```

Then set `EXPO_PUBLIC_RECOGNIZE_COVER_API_URL` in the app's `.env` to the deployed Worker URL (e.g. `https://tbr-cover-recognition.<your-subdomain>.workers.dev`).

## Tuning cost controls

`wrangler.toml`'s `[vars]` block controls the two rate limits without a code change:
- `DAILY_BUDGET_LIMIT` — global daily request ceiling across all clients (the primary cost safeguard).
- `PER_TOKEN_DAILY_LIMIT` — soft per-install daily limit.

After a deploy, redeploy (`npm run deploy`) to apply any `[vars]` change.
