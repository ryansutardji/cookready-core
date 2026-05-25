# Edge Functions — Deno TypeScript

## Runtime & Imports
- Deno, not Node — use `npm:` prefix for packages (e.g., `npm:@google/generative-ai`), not package.json.
- Env vars via `Deno.env.get()`: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `GEMINI_API_KEY`.

## Security
- SERVICE_ROLE_KEY bypasses RLS — never use it for user-scoped queries.
- Validate incoming user identity via anon key if acting on their behalf.

## CORS
- Both functions return `Access-Control-Allow-Origin: *` on OPTIONS in an early-return block at the top.

## Deployment
- Deploy via `supabase functions deploy <name>` — not via migrations.
- Secrets via `supabase secrets set KEY=value`, not `.env`.
