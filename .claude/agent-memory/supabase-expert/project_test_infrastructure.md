---
name: project-test-infrastructure
description: Supabase local test infrastructure setup — CLI install method, config state, and how test:db works
metadata:
  type: project
---

`supabase` CLI is pinned as an npm devDependency (currently v2.109.0) — NOT installed globally or via Homebrew. Run via `npx supabase` or `./node_modules/.bin/supabase`.

`supabase/config.toml` was created by `supabase init --force` on 2026-07-05. `project_id = "cookready-core"`.

`supabase/tests/` now has a full pgTAP suite (as of 2026-07-05, TODO.md item #2): `add_pantry_item.test.sql` (plan 7), `deplete_pantry_item.test.sql` (plan 4), `check_recipe_cookability.test.sql` (plan 3), `get_recipe_ingredient_statuses.test.sql` (plan 3), `increment_session_strike.test.sql` (plan 4), `apply_abuse_lockout.test.sql` (plan 2), `rls_policies.test.sql` (plan 5) — 28 assertions total, all passing. `supabase/seed.sql` now exists with a `tests` schema and `tests.create_test_user(p_id uuid, p_email text default null)` helper that inserts a minimal `auth.users` row (satisfies FK constraints in test files without repeating the raw INSERT everywhere), plus (as of 2026-07-05) global base GRANTs for `anon`/`authenticated`/`service_role` on `public.*` — see [[project_public_schema_grants_gap]].

`npm run test:db` (calls `supabase test db`) requires the local Docker stack to be running first (`supabase start`). Without it, the command fails with `LegacyDbConnectError: failed to connect to postgres`. This is expected behavior.

**Why:** `supabase test db` runs pgTAP tests against the local Postgres instance — it always needs a live DB connection.

**How to apply:** When writing or running DB tests, remind user to run `supabase start` first (requires Docker). The `test:db` script is in `package.json` for convenience. Critically, `supabase test db` does **not** reset the database itself — it just connects and runs test files against whatever schema/seed state is already loaded. After adding/changing anything in `supabase/migrations/` or `supabase/seed.sql` (e.g. adding `tests.create_test_user` for the first time), you must run `npx supabase db reset` first, or the new schema objects/seed helpers won't exist yet and tests fail with errors like `schema "tests" does not exist`.

See [[project_public_schema_grants_gap]] for a base-privileges gap discovered while writing `rls_policies.test.sql`, and [[project_unit_conversions_null_ordering]] for a gotcha when picking test units for `add_pantry_item`/`deplete_pantry_item`.
