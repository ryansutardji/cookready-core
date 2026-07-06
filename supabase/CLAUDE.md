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

`supabase/migrations/` timestamps and the hosted project's applied-migration history do not match 1:1 for a few entries — this is expected, not a bug, but it means a plain `supabase db push` is unsafe until reconciled: it would see already-live changes as "new" local migrations and try to re-run them.

- **Avoid:** `supabase db push` until `npx supabase migration list` is confirmed clean — check every time, don't assume based on past state.
- **Use instead, to ship a single fix to production:** apply it directly and narrowly via the Supabase MCP `apply_migration` tool (or the SQL editor) with just that one `CREATE OR REPLACE FUNCTION` / `ALTER TABLE` statement. This sidesteps the whole-history comparison entirely.
- **Always verify after a targeted apply:** pull the deployed object back (`pg_get_functiondef`, `information_schema.columns`, `pg_get_viewdef`, etc.) and confirm it matches what you intended. Also check `supabase_migrations.schema_migrations` directly rather than assuming whether the apply left a remote-tracked history row — that assumption has been wrong before (see below). Create/commit the matching local migration file in the same change so the two don't drift apart.
- If the history ever needs full reconciliation, `supabase migration repair --status applied|reverted <version>` re-stamps the remote tracking table without touching schema — but diff the deployed object against the local file first; a matching name/timestamp is not sufficient evidence.

### Known inaccurate migrations — accepted gap, do not mark "applied" via repair

`20260415000000_create_core_tables.sql` and `20260415000001_seed_ingredients.sql` were written after the fact to describe tables/data that already existed in production, but production has since drifted further (direct edits that never made it back into a migration). Confirmed differences as of 2026-07-06:

- `ingredients.category` — file says `NOT NULL`; production has no `NOT NULL`.
- `unit_conversions` — production has `UNIQUE (ingredient_id, input_unit)`; the file never creates this constraint.
- `user_pantry.user_id` — production defaults to `auth.uid()`; the file has no default.
- `user_pantry.ingredient_id` — production is `NOT NULL`; the file leaves it nullable.
- `ai_pantry_snapshot` view — production converts stored base-unit quantities back into the ingredient's `preferred_unit` for display and hides zero-quantity rows (`current_quantity_value > 0`); the file's version does neither and is missing a `base_unit` column production exposes.
- Universal ingredient count is off by ~3 versus what the file's header comment plus later seed migrations would predict.

**Decision: accept this gap rather than correct it right now.** Do not run `supabase migration repair --status applied` on these two versions — that would tell tooling they're equivalent to production when they demonstrably aren't, hiding the gap instead of documenting it. If a fresh environment is ever built from `supabase/migrations/` alone (disaster recovery, new preview project), these two tables and the view will come out schema-valid but behaviorally different from production (raw base-unit display instead of preferred-unit, zero-quantity items not hidden, weaker constraints) — revisit this before relying on such a rebuild.

### Reconciled 2026-07-06 — 8 mismatched-version migrations

The 8 migrations from `20260610000000` through `20260705221333` were applied on production under different version timestamps (one, `20260705221333_drop_stale_add_pantry_item_3arg_overload.sql`, also under a different name: `drop_old_add_pantry_item_overload`). Each was verified equivalent by diffing live prod definitions (`pg_get_functiondef`, `information_schema.columns`/`role_column_grants`, `pg_constraint`, `pg_indexes`) against the local files — grouped where migrations are links in the same rename chain (`daily_ai_usage`→`recipe_count`, `ai_events`→`session_strikes`) rather than checked independently, since an intermediate schema state can't be introspected after later migrations in the chain have already superseded it — then reconciled via `supabase migration repair --linked`. `npx supabase migration list` now shows a clean 1:1 match for these.

### Not yet resolved — duplicate `add_pantry_item` conversion-priority fix

Two local migration files now exist for the same fix (the NULL-ordering tiebreak bug — see [[project_unit_conversions_null_ordering]]), under two different timestamps with the same function body: `20260706045911_fix_add_pantry_item_conversion_priority.sql` and `20260706052444_fix_add_pantry_item_conversion_priority.sql`.

These come with **conflicting accounts** of production status that haven't been reconciled:
- One note claims `20260706052444` is the version actually tracked in production's `schema_migrations` table (checked directly via SQL), with its body pulled verbatim from prod via `pg_get_functiondef`.
- [[project_unit_conversions_null_ordering]] instead claims the fix is **not yet shipped to production at all**, and only exists in the `20260706045911` file, applied to the local stack only.

There's also a local dev-stack wrinkle: the local Postgres instance's `supabase_migrations.schema_migrations` table has a bookkeeping row for `20260706045911` that predates that file ever being committed to `main`, which can block `supabase migration up` locally (`LegacyMigrationMissingLocalError`) until reconciled. The local function body itself is already correct (verified against the local DB), so this is a bookkeeping-only mismatch — fixing it means running `supabase migration repair --status reverted 20260706045911` (clears the phantom local row) followed by `supabase migration up` (applies `20260706052444` for real, a no-op `CREATE OR REPLACE` given the body already matches) — but hold off until the branch/dedup question above is settled, since the answer may change which version numbers end up canonical locally.

**Do not delete either migration file or run `migration repair` on this pair until the production status is verified fresh** — treat both prior accounts as unverified. See `TODO.md` §2A.
