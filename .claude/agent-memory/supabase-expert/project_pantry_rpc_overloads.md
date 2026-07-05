---
name: project-pantry-rpc-overloads
description: add_pantry_item's stale 3-arg overload was dropped 2026-07-05; PostgREST resolves RPC overloads by named JSON keys, not just arity
metadata:
  type: project
---

`public.add_pantry_item` used to have two coexisting overloads: a 3-arg
`(text, numeric, text)` version from `20260524120000_backfill_pantry_rpc_functions.sql`,
and a 4-arg `(text, numeric, text, boolean DEFAULT false)` version added later via
`CREATE OR REPLACE FUNCTION` in `20260606120000_add_permanent_param_to_add_pantry_item.sql`.
Because Postgres treats differing arity as a distinct signature, `CREATE OR REPLACE`
did not replace the old one — it left both live, confirmed via `\df public.add_pantry_item`.

The stale 3-arg overload was dropped in
`supabase/migrations/20260705221333_drop_stale_add_pantry_item_3arg_overload.sql`
via `DROP FUNCTION IF EXISTS public.add_pantry_item(text, numeric, text);`.
Only the 4-arg overload remains now.

**Why this mattered:** supabase-js `.rpc()` calls send named JSON params, and
PostgREST resolves the overload by matching the exact set of keys present — not by
positional arg count the way raw SQL does. Any caller omitting `p_is_permanent`
(4 of 5 call sites at the time: `app/(onboarding)/build-pantry.tsx` x2,
`components/SmartAddBar.tsx` x1, `components/BundleSheet.tsx` x1) was silently
resolving to the stale 3-arg overload instead of the 4-arg version's default. It
happened to produce identical behavior (both defaulted `is_permanent` to false),
but any future divergence between the two function bodies would have silently
broken callers that don't pass every param explicitly.

**How to apply:** When a Postgres function gets a new parameter via
`CREATE OR REPLACE FUNCTION` with a different arity, always check `\df` (or grep
migrations) for leftover overloads afterward, and drop the stale one in a follow-up
migration. Never assume `CREATE OR REPLACE` retired an old signature just because
the function name matches — Postgres overload resolution is signature-based.
This same risk pattern applies to `deplete_pantry_item` and any other
`SECURITY DEFINER` pantry/recipe RPCs called via `.rpc()` with named params — see
`supabase/CLAUDE.md`'s "Known Gap" section for the list of RPCs that live outside
normal migration history tracking.

Related: [[project_migration_sync]], [[project_test_infrastructure]]
