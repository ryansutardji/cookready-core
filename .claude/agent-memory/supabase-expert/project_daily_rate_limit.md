---
name: project-daily-rate-limit
description: generate-recipe edge function has per-user 5 req/day (PST) rate limiting via daily_ai_usage table; unlimited_recipes profile flag bypasses it
metadata:
  type: project
---

The `generate-recipe` edge function enforces a 5 requests/day per-user limit (PST day boundary), with a bypass for users whose `profiles.unlimited_recipes = true`.

**Implementation:**
- `public.daily_ai_usage` table: `(id, user_id, usage_date, request_count)` with unique constraint `(user_id, usage_date)`.
- `public.increment_daily_ai_usage(p_user_id, p_usage_date)` SECURITY DEFINER RPC does the atomic upsert-increment.
- `profiles.unlimited_recipes boolean NOT NULL DEFAULT false` — set to true to give a user unlimited access.
- Edge function flow after JWT validation:
  1. Fetch `profiles.unlimited_recipes` for the user.
  2. If `isUnlimited`, skip all rate-limit checks and increment calls entirely.
  3. Otherwise, compute PST date via `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })`, check count, block if >= 5, then increment after successful Gemini call.
- 429 response body: `{ "error": "daily_limit_reached", "limit": 5, "reset": "midnight PST" }`.
- RLS: users have SELECT on their own rows only. No user-facing INSERT/UPDATE policy — all writes go through the service role.
- `classify-ingredient` is NOT rate-limited — only `generate-recipe`.

**Why:** Control Gemini API costs. Limit changed from 10 to 5. Reset moved from UTC to PST. Unlimited flag added for internal/admin users.

**How to apply:** To grant a user unlimited access, set `profiles.unlimited_recipes = true` for their row. To change the limit, update `DAILY_REQUEST_LIMIT` const in the edge function.
