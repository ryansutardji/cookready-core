---
name: project-unit-conversions-null-ordering
description: add_pantry_item's ingredient-specific-vs-global unit_conversions tiebreak actually prefers the global (NULL) row, not the ingredient-specific one, due to Postgres's default DESC null-ordering — FIXED and confirmed live on production 2026-07-06 as migration 20260706052444
metadata:
  type: project
---

**STATUS (2026-07-06): Fixed, confirmed live on production.**
The two-step lookup fix below shipped as
`supabase/migrations/20260706052444_fix_add_pantry_item_conversion_priority.sql`.
Checked fresh directly against production: `SELECT version FROM
supabase_migrations.schema_migrations WHERE version = '20260706052444'`
returns a row, and `pg_get_functiondef('public.add_pantry_item(text, numeric,
text, boolean)')` on production matches the local file character-for-
character. A duplicate local-only migration file,
`20260706045911_fix_add_pantry_item_conversion_priority.sql`, existed
briefly (created by a previous session, applied only to the local dev DB,
never committed until it came in via a branch merge) — it has since been
deleted, and the local dev stack's tracking table was repaired
(`migration repair --status reverted`, then `migration up`) so local and
prod both cleanly show `20260706052444` applied. See
[[project_migration_history_divergence]] for the full dedup writeup.

It's covered by a new regression assertion (case 5) in
`supabase/tests/add_pantry_item.test.sql` (plan bumped from 6 to 7): an
ingredient with `base_unit = 'g'` gets an ingredient-specific `cup -> 185 g`
row that deliberately collides with the seeded global `cup -> 240 ml` row;
the test asserts `2 cup` resolves to `370` (ingredient-specific), not `480`
(global). Verified the assertion actually fails against the old
`ORDER BY ingredient_id DESC` logic (got 480, wanted 370) and passes against
the fixed two-step lookup — confirmed the test isn't a false positive. Full
suite is green locally: `Files=7, Tests=28, Result: PASS` (re-confirmed
2026-07-06 after the dedup/repair above).

`public.add_pantry_item` (in `20260524120000_backfill_pantry_rpc_functions.sql`
and later `20260606120000_add_permanent_param_to_add_pantry_item.sql`) picks a
conversion factor with:
```sql
SELECT output_value INTO v_conversion_factor
  FROM public.unit_conversions
 WHERE (ingredient_id = v_ing_id OR ingredient_id IS NULL)
   AND input_unit = p_unit
 ORDER BY ingredient_id DESC  -- comment claims: "ingredient-specific rows sort before NULL"
 LIMIT 1;
```
The inline comment is wrong: Postgres's default null-ordering for `ORDER BY ... DESC`
is `NULLS FIRST`, confirmed directly (`select unnest(array[1,2,null,3]) v order by v
desc` returns `null, 3, 2, 1`). So when both an ingredient-specific row and a global
(`ingredient_id IS NULL`) row match the same `input_unit`, the **global** row wins,
not the ingredient-specific one.

`20260415000001_seed_ingredients.sql` seeds global (`ingredient_id IS NULL`)
`unit_conversions` rows for `cup` (240 ml), `lb` (453 g), `oz` (28 g), `tbsp` (15 ml),
and `tsp` (5 g) — confirmed via
`select * from unit_conversions where ingredient_id is null`. Any pgTAP test (or
future ad-hoc query) that seeds an ingredient-specific conversion using one of
these five units to prove the ingredient-specific path will silently get the
global factor instead, producing a confusing wrong-number failure (e.g. got 480
instead of an expected 400 when testing "2 cup -> 400 g" with an ingredient-
specific 200 g/cup row — the global 240 ml/cup row won instead).

**How to apply:** When writing tests (or new seed data) meant to exercise the
ingredient-specific branch of `add_pantry_item`/`deplete_pantry_item`'s conversion
lookup in isolation, pick a unit with no existing global row — e.g. `stick`,
`pinch`, `block`, `slice` — not `cup`/`lb`/`oz`/`tbsp`/`tsp`. `deplete_pantry_item`
never had this exact ordering bug (it queries ingredient-specific first, then
falls back to global only if null) — `add_pantry_item`'s single combined query
was the only affected path, and it's now fixed to match `deplete_pantry_item`'s
pattern. See `supabase/tests/add_pantry_item.test.sql` case 3/4/5 for the
working pattern and the inline comment explaining why.

Related: [[project_test_infrastructure]], [[project_migration_history_divergence]]
