---
name: project-migration-history-divergence
description: 8 mismatched-version migrations reconciled 2026-07-06; add_pantry_item remote-history gap closed same day by backfilling 20260706052444; surfaced an unmerged branch (origin/backend_unit_tests) with the real test suite still awaiting a merge decision
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

**New discovery while closing the above (open, needs a user decision) —
`origin/backend_unit_tests` is an unmerged branch that already did most of
this work:** the "file doesn't exist anywhere in git history" claim above was
almost right but not quite — a file for this same fix, under a *different*
timestamp (`20260706045911`, matching what the docs originally described),
plus a full 7-file pgTAP suite (`add_pantry_item` 7-case version including
the ingredient-specific-vs-global tiebreak regression, `deplete_pantry_item`,
`apply_abuse_lockout`, `check_recipe_cookability`,
`get_recipe_ingredient_statuses`, `increment_session_strike`,
`rls_policies`), and an updated `supabase/seed.sql` (global grants for local
pgTAP runs — see [[project_public_schema_grants_gap]]) all exist on commit
`ce7c0b3` of `origin/backend_unit_tests`, one commit ahead of `main` — but
that commit was **never merged**. Confirmed via `npx supabase test db` that
`main`'s `supabase/tests/` currently has only the minimal one-case smoke test
(`Files=1, Tests=1, PASS`) — the "case 5 regression test already added"
claim in `TODO.md` was false for `main`, though seemingly true for the
orphaned branch. Also found: the local dev Postgres instance already has a
`schema_migrations` bookkeeping row for `20260706045911` (from a previous
session applying that branch's file locally without ever committing it) —
function body is correct locally, but this blocks `supabase migration up`
until reconciled or the branch question is resolved first. Left open
deliberately — merging/cherry-picking another branch's work and repairing
local migration bookkeeping are user decisions, not something to do
unilaterally. Full detail in `TODO.md` §2A and `supabase/CLAUDE.md`.

**How to apply:** Before trusting any doc claim that a specific migration
file exists locally, grep/`find` `main`'s working tree first — a claim in
`TODO.md`/memory is not the same as a file being on disk *on the branch
you're checking* (see [[project_pantry_rpc_overloads]] for the same lesson
applied to overload assumptions). It's also not the same as the file not
existing *anywhere* — check other branches/remotes before concluding work
was "never done," since it may just be unmerged. When using the MCP
`apply_migration` tool for one-off prod fixes, create and commit the matching
local migration file in the *same* change, and verify whether it registered
a remote-tracked version via `schema_migrations` — don't assume either way.

Related: [[project_migration_sync]], [[project_pantry_rpc_overloads]],
[[project_test_infrastructure]]
