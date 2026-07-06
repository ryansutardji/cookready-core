---
name: project-public-schema-grants-gap
description: authenticated/anon had no base SELECT/INSERT/UPDATE/DELETE grants on public-schema tables locally — FIXED 2026-07-05 via supabase/seed.sql (local/CI-only, not a migration)
metadata:
  type: project
---

FIXED locally on 2026-07-05: `supabase/seed.sql` now runs
`GRANT ALL ON ALL TABLES/SEQUENCES/FUNCTIONS IN SCHEMA public TO anon, authenticated,
service_role` plus matching `ALTER DEFAULT PRIVILEGES`, right before the `tests`
schema section. This executes on every `supabase db reset` / `supabase test db`
locally, closing the gap described below. Confirmed via `docker exec ... psql -c
"SET ROLE authenticated; SELECT count(*) FROM public.user_pantry;"` succeeding
(previously "permission denied for table"), and via full pgTAP suite passing
(`Files=7, Tests=28, Result: PASS`).

As a direct result, the manual scoped `GRANT SELECT`/`GRANT SELECT, INSERT`
workaround lines that used to live inside `supabase/tests/rls_policies.test.sql`
(added as a stopgap before this fix existed) were removed — they're redundant
now that seed.sql grants everything globally before any test file runs.

**Deliberate choice — seed.sql, not a migration:** confirmed via
`information_schema.role_table_grants` that the hosted/production project
(`ai_recipe_builder_v0`, ref `nsunepmaywmmvvlbjwvc`) already has full
`anon`/`authenticated` grants on all these tables (via Supabase's own
bootstrap process, not migration history) — so this was never a production
bug, purely a local-CLI-stack artifact. `seed.sql` only runs on local/CI
`db reset`, never against the hosted project, so a migration would be
redundant there.

**Original root cause (background, still accurate):** the local stack's
`public` schema default ACL for objects created by `postgres` only granted
`TRUNCATE, REFERENCES, TRIGGER, MAINTAIN` (`Dxtm`) to
`anon`/`authenticated`/`service_role` — not `SELECT/INSERT/UPDATE/DELETE` — and
no migration ever issued explicit table GRANTs (only RPC functions have
explicit REVOKE/GRANT; see `supabase/CLAUDE.md`'s "Known Gap" section and
[[project_pantry_rpc_overloads]]).

**Residual gap:** a from-scratch hosted-style environment built purely from
`supabase/migrations/` (new preview branch, disaster recovery, etc.) still has
no GRANTs anywhere in migration history — `seed.sql` doesn't help that case.
If that scenario becomes real, add this same GRANT block as an actual
migration.

**How to apply:** Don't reintroduce scoped GRANT workarounds in individual
pgTAP test files — `seed.sql` already covers it globally on every local
`db reset`/`test db` run. If "permission denied for table ..." reappears
locally, check `supabase/seed.sql` and `supabase/config.toml`'s
`db.seed.sql_paths` before assuming an RLS policy is wrong.

Related: [[project_test_infrastructure]], [[project_pantry_rpc_overloads]]
