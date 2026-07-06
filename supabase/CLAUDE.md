# Supabase Migrations

## Immutability Rule
- NEVER edit an existing migration file — Supabase tracks checksums and will error on mismatch.
- All changes go in a new file: `supabase migration new <description>`.

## Known Gap — Missing RPC Functions
- `add_pantry_item()` and `deplete_pantry_item()` are called throughout the app but are NOT
  in any migration. They exist directly in the Supabase project.
- To modify them, add a new migration with `CREATE OR REPLACE FUNCTION`.

## Unit Conversions
- Every `preferred_unit` on an ingredient must have a matching row in `unit_conversions` where `input_unit = preferred_unit` and `output_unit = base_unit`.
- When adding a new ingredient with a non-base preferred_unit, always include the conversion INSERT in the same migration.

## RLS
- `SECURITY DEFINER` on RPCs that cross RLS boundaries — see `check_recipe_cookability`, `delete_own_account`.

## Migration History Divergence — never run a blind `supabase db push`

Local `supabase/migrations/` and the hosted project's applied-migration history do not match 1:1 (confirmed 2026-07-06 via `supabase migration list`). About 11 versions are recorded on the remote project under different timestamps/names than the local filenames suggest (same underlying change, pushed at a different time under a different version), and two early migrations have no remote-tracked counterpart at all. A plain `supabase db push` would see ~10 "new" local migrations that are actually already live, and try to re-run them — expect errors or duplicate schema changes, not a clean no-op.

- **Avoid:** `supabase db push` — pushes every pending local migration; will try to reapply already-live changes it doesn't recognize as applied.
- **Avoid:** assuming `supabase migration list` shows local/remote in sync — check it every time before considering a push, don't assume based on past state.
- **Use instead, to ship a single fix to production:** apply it directly and narrowly via the Supabase MCP `apply_migration` tool (or the SQL editor) with just that one `CREATE OR REPLACE FUNCTION` / `ALTER TABLE` statement. This sidesteps the whole-history comparison entirely. This is how `20260706045911_fix_add_pantry_item_conversion_priority` was shipped.
- **Always verify after a targeted apply:** pull the deployed object back (`pg_get_functiondef`, `information_schema.columns`, `pg_get_viewdef`, etc.) and confirm it matches what you intended — targeted applies don't update any migration tracking table, so there's no automatic confirmation step.
- If the history ever needs full reconciliation, `supabase migration repair --status applied|reverted <version>` re-stamps the remote tracking table without touching schema — but verify each pair is actually content-equivalent first. Two versions are confirmed NOT equivalent (see below) — do not repair those without a real fix first.

### Known inaccurate migrations — accepted gap, do not mark "applied" via repair

`20260415000000_create_core_tables.sql` and `20260415000001_seed_ingredients.sql` were written after the fact to describe tables/data that already existed in production, but production has since drifted further (direct edits that never made it back into a migration). Confirmed differences as of 2026-07-06:

- `ingredients.category` — file says `NOT NULL`; production has no `NOT NULL`.
- `unit_conversions` — production has `UNIQUE (ingredient_id, input_unit)`; the file never creates this constraint.
- `user_pantry.user_id` — production defaults to `auth.uid()`; the file has no default.
- `user_pantry.ingredient_id` — production is `NOT NULL`; the file leaves it nullable.
- `ai_pantry_snapshot` view — production converts stored base-unit quantities back into the ingredient's `preferred_unit` for display and hides zero-quantity rows (`current_quantity_value > 0`); the file's version does neither and is missing a `base_unit` column production exposes.
- Universal ingredient count is off by ~3 versus what the file's header comment plus later seed migrations would predict.

**Decision: accept this gap rather than correct it right now.** Do not run `supabase migration repair --status applied` on these two versions — that would tell tooling they're equivalent to production when they demonstrably aren't, hiding the gap instead of documenting it. If a fresh environment is ever built from `supabase/migrations/` alone (disaster recovery, new preview project), these two tables and the view will come out schema-valid but behaviorally different from production (raw base-unit display instead of preferred-unit, zero-quantity items not hidden, weaker constraints) — revisit this before relying on such a rebuild.
