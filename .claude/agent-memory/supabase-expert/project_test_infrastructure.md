---
name: project-test-infrastructure
description: Supabase local test infrastructure setup — CLI install method, config state, and how test:db works
metadata:
  type: project
---

`supabase` CLI is pinned as an npm devDependency (currently v2.109.0) — NOT installed globally or via Homebrew. Run via `npx supabase` or `./node_modules/.bin/supabase`.

`supabase/config.toml` was created by `supabase init --force` on 2026-07-05. `project_id = "cookready-core"`.

`supabase/tests/` directory exists with a `.gitkeep` placeholder. No test files written yet — this was the initial scaffold for TODO.md item #1.

`npm run test:db` (calls `supabase test db`) requires the local Docker stack to be running first (`supabase start`). Without it, the command fails with `LegacyDbConnectError: failed to connect to postgres`. This is expected behavior.

**Why:** `supabase test db` runs pgTAP tests against the local Postgres instance — it always needs a live DB connection.

**How to apply:** When writing or running DB tests, remind user to run `supabase start` first (requires Docker). The `test:db` script is in `package.json` for convenience.
