---
name: project-is-always-available-ingredient-flag
description: ingredients.is_always_available flag added 2026-08-03 to fix Water/Ice always showing as missing ingredients; Ice deliberately has no matching unit_conversions row
metadata:
  type: project
---

`public.ingredients.is_always_available boolean NOT NULL DEFAULT false` was added in
`supabase/migrations/20260803060407_add_is_always_available_ingredient_flag.sql` to
fix recipes always flagging "Water" (and "Ice") as missing — those names were never
seeded rows in `ingredients`, so the availability RPCs could never find a matching
`user_pantry` row for them.

Three global rows were seeded/reclaimed with the flag set true: `Water`, `Tap Water`
(both `preferred_unit 'cup'`, `base_unit 'ml'`), and `Ice` (`preferred_unit 'cup'`,
`base_unit 'g'`). Both `check_recipe_cookability` and `get_recipe_ingredient_statuses`
(both `CREATE OR REPLACE` in this same migration) now check `is_always_available`
immediately after resolving `v_ingredient_id` in their per-ingredient loop and
short-circuit to "available" before touching `unit_conversions`/`ai_pantry_snapshot`.

**Intentional exception to this repo's unit_conversions convention:** `Ice` has
`preferred_unit 'cup'` / `base_unit 'g'`, but there is no `unit_conversions` row (nor
a global fallback — the global `cup` fallback outputs to `ml`, not `g`) that converts
`cup -> g`. Per `supabase/CLAUDE.md`'s "Unit Conversions" rule, this would normally be
a bug. It is not, here: the RPC short-circuit above means unit-conversion math never
runs for `is_always_available` ingredients, and the client (`SmartAddBar.tsx`, per the
design handoff at the time) intentionally never allows these three names to be written
to `user_pantry` in the first place. **Do not "fix" this by adding an Ice
unit_conversions row** — it would be dead code masking as a fix.

**Collision guard used in the seed inserts:** `ingredients_name_key` is a global
`UNIQUE(name)` (not scoped by `user_id`), and users can already have created a private
per-user row named exactly `Water`/`Tap Water`/`Ice` via the app's "add as new
ingredient" flow. The seed INSERTs use
`ON CONFLICT (name) DO UPDATE SET is_always_available = true, user_id = NULL` (not
`DO NOTHING`) so any such pre-existing private row is reclaimed as global and gets the
flag, rather than silently being left unflagged.

Verified locally only (`supabase db reset` + `supabase test db`, 2026-08-03): full
pgTAP suite passes, `Files=7, Tests=30`. Not applied to the remote/production project
— see [[project_test_infrastructure]] and `supabase/CLAUDE.md`'s migration-history
divergence guidance before ever pushing this to prod.
