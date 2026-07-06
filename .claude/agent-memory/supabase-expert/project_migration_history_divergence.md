---
name: project-migration-history-divergence
description: 8 mismatched-version migrations reconciled 2026-07-06; add_pantry_item remote-history gap closed same day by backfilling 20260706052444; origin/backend_unit_tests merged into main 2026-07-06, but left a duplicate add_pantry_item migration file (20260706045911 vs 20260706052444) with conflicting accounts of prod-deployment status, still unresolved
metadata:
  type: project
---

TODO.md section 2A's "8 unverified migrations with mismatched local/remote
versions" were all individually verified against production (via
`npx supabase db query --linked` against `information_schema.columns`,
`pg_constraint`, `pg_indexes`, `role_column_grants`, and `pg_get_functiondef`)
and found equivalent to their local files, then reconciled with
`supabase migration repair --linked` (revert remote version, apply local
version — bookkeeping only, no DDL run). `npx supabase migration list` now
shows a clean 1:1 match for these.

Verified in 4 groups (grouped, not independently, where migrations are links
in a rename chain — an intermediate schema state can't be introspected once
later migrations in the same chain have superseded it):
- Group 1: `add_pantry_item` 3-arg overload drop (remote had a different name
  too: `drop_old_add_pantry_item_overload`)
- Group 2: `profiles.unlimited_recipes` / `profiles.locked_until` +
  `apply_abuse_lockout()` + the `authenticated` column-UPDATE-grant list
- Group 3: `daily_ai_usage` table + `request_count`→`recipe_count` rename +
  `increment_daily_ai_usage`→`increment_daily_recipe_count` rename
- Group 4: `ai_events`→`session_strikes` rename chain (3 migrations) +
  `increment_ai_event`→`increment_session_strike` + `deferred_count` addition

**Why this mattered:** `supabase db push` was unsafe until reconciled — it
would have tried to re-run DDL already live on prod under different version
numbers, and the CLI would refuse/misbehave on the mismatched history.

**`add_pantry_item` remote-history gap — closed 2026-07-06:**
`TODO.md` and `supabase/CLAUDE.md` previously claimed a local file
`20260706045911_fix_add_pantry_item_conversion_priority.sql` existed and
would show as local-only in `migration list` (shipped via MCP
`apply_migration`, not `db push`). That exact file did not exist on `main`
(it was never actually committed there), but `apply_migration` had in fact
registered a **remote-tracked** row under a different version,
`20260706052444` (confirmed via `SELECT * FROM
supabase_migrations.schema_migrations WHERE version = '20260706052444'`) —
not local-only as the docs assumed. Fixed by creating
`supabase/migrations/20260706052444_fix_add_pantry_item_conversion_priority.sql`
using that exact remote-tracked version number, with the body pulled
verbatim from production via `pg_get_functiondef` (not reconstructed from
memory). `npx supabase migration list --linked` now shows `20260706052444`
matching in both `local` and `remote` — no `repair` needed since the
filename's version already equalled the tracked remote version. Lesson: the
assumption "`apply_migration` leaves no remote-tracked history row" was
**wrong** — always verify directly against
`supabase_migrations.schema_migrations` rather than assuming.

**Update 2026-07-06 — `origin/backend_unit_tests` has since been merged into `main`
via a plain `git pull`** (fast-forward, not a manual cherry-pick). `main` now has
the full 7-file pgTAP suite (`add_pantry_item` 7-case version including the
ingredient-specific-vs-global tiebreak regression, `deplete_pantry_item`,
`apply_abuse_lockout`, `check_recipe_cookability`,
`get_recipe_ingredient_statuses`, `increment_session_strike`, `rls_policies`),
the updated `supabase/seed.sql` (global grants for local pgTAP runs — see
[[project_public_schema_grants_gap]]), and its own migration file for the
`add_pantry_item` fix under timestamp `20260706045911`. The "unmerged, awaiting
a decision" framing this note previously used is now stale — the merge already
happened.

**What's still actually open — a duplicate migration file, with conflicting
prod-status claims, not a merge decision:** the merge left TWO local migration
files for the same fix — the pre-existing `20260706052444_fix_add_pantry_item_conversion_priority.sql`
(created same day, believed to match the version tracked in prod's
`schema_migrations` table) and the newly-merged `20260706045911_fix_add_pantry_item_conversion_priority.sql`
(same function body, believed by [[project_unit_conversions_null_ordering]] to
be local-only, not yet shipped to prod at all). These two accounts of prod
status directly contradict each other and have **not** been reconciled — don't
trust either until re-verified fresh against `supabase_migrations.schema_migrations`
on the live project. Also unresolved: the local dev Postgres instance's
`schema_migrations` table already has a bookkeeping row for `20260706045911`
predating its file ever being committed to `main` (from a previous session
applying it locally without committing), which blocks `supabase migration up`
locally until repaired. Full detail and the fix commands are in
`supabase/CLAUDE.md` → "Not yet resolved — duplicate `add_pantry_item`
conversion-priority fix"; the actionable checklist is in `TODO.md` §2A.

**How to apply:** Before trusting any doc claim that a specific migration
file exists locally, grep/`find` `main`'s working tree first — a claim in
`TODO.md`/memory is not the same as a file being on disk *on the branch
you're checking* (see [[project_pantry_rpc_overloads]] for the same lesson
applied to overload assumptions). Similarly, don't trust a doc's claim about
whether a fix reached production without checking `schema_migrations`
directly — two notes here made opposite claims about the same fix and both
can't be right. When using the MCP `apply_migration` tool for one-off prod
fixes, create and commit the matching local migration file in the *same*
change, and verify whether it registered a remote-tracked version via
`schema_migrations` — don't assume either way.

Related: [[project_migration_sync]], [[project_pantry_rpc_overloads]],
[[project_test_infrastructure]]
