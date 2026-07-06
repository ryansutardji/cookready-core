-- Full pgTAP suite for public.add_pantry_item(text, numeric, text, boolean).
--
-- Covers the full behavior matrix: insert-when-absent, quantity accumulation
-- on conflict, unit conversion (ingredient-specific and default-factor-of-1
-- fallback), and is_permanent pinning semantics (OR logic — once pinned, a
-- later call with p_is_permanent = false cannot unpin). See TODO.md #2.
begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

-- Impersonate a specific user for auth.uid() (add_pantry_item is SECURITY DEFINER
-- and writes to user_pantry scoped to auth.uid()).
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- Real auth.users row required to satisfy user_pantry.user_id's FK.
select tests.create_test_user('11111111-1111-1111-1111-111111111111');

-- ── Case 1: inserts a new row when ingredient not yet in pantry ─────────────
-- Universal ingredient (user_id IS NULL) whose base_unit matches the unit we add
-- with, so no unit_conversions row is needed for this minimal case.
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222222', 'Pgtap Test Flour', 'Grain', 'g', 'g');

select public.add_pantry_item('Pgtap Test Flour', 500, 'g', false);

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222222'
  ),
  500::numeric,
  'add_pantry_item inserts a new user_pantry row with the given quantity when none existed'
);

-- ── Case 2: accumulates (adds, does not replace) on a second call ──────────
select public.add_pantry_item('Pgtap Test Flour', 300, 'g', false);

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222222'
  ),
  800::numeric,
  'add_pantry_item accumulates quantity on conflict (500 + 300 = 800)'
);

-- ── Case 3: applies an ingredient-specific unit conversion ──────────────────
-- NOTE: 'cup' is deliberately avoided here — 20260415000001_seed_ingredients.sql
-- seeds a *global* (ingredient_id IS NULL) conversion for 'cup' -> 240 ml, and
-- add_pantry_item's `ORDER BY ingredient_id DESC LIMIT 1` puts that NULL row
-- first (Postgres's default null-ordering for DESC is NULLS FIRST), so it would
-- shadow an ingredient-specific 'cup' row instead of deferring to it. 'stick' has
-- no global conversion, so it isolates this case to the ingredient-specific path.
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('33333333-3333-3333-3333-333333333333', 'Pgtap Test Butter', 'Dairy', 'g', 'stick');

insert into public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
values ('33333333-3333-3333-3333-333333333333', 'stick', 200, 'g');

select public.add_pantry_item('Pgtap Test Butter', 2, 'stick', false);

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '33333333-3333-3333-3333-333333333333'
  ),
  400::numeric,
  'add_pantry_item converts quantity via unit_conversions (2 stick x 200 = 400 g)'
);

-- ── Case 4: defaults the conversion factor to 1 when no conversion row matches ──
-- 'pinch' has no ingredient-specific or global unit_conversions row (unlike
-- 'oz', 'lb', 'cup', 'tbsp', 'tsp', which all have global rows seeded).
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222224', 'Pgtap Test Salt', 'Spice/Sauce', 'g', 'g');

select public.add_pantry_item('Pgtap Test Salt', 50, 'pinch', false);

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222224'
  ),
  50::numeric,
  'add_pantry_item leaves quantity unconverted (factor 1) when no unit_conversions row matches (pinch)'
);

-- ── Case 5: ingredient-specific conversion wins over a colliding global row ──
-- Regression test for the ORDER BY ingredient_id DESC tiebreak bug: 'cup' has a
-- *global* (ingredient_id IS NULL) conversion seeded at 240 ml
-- (20260415000001_seed_ingredients.sql). Here we deliberately add an
-- ingredient-specific 'cup' row for an ingredient whose base_unit is 'g' (not
-- 'ml') with a distinct output_value of 185 g/cup. Postgres's default
-- null-ordering for ORDER BY ... DESC is NULLS FIRST, so the old single-query
-- `ORDER BY ingredient_id DESC LIMIT 1` lookup would have picked the global
-- 240 (ml) row instead of the ingredient-specific 185 (g) row, silently
-- storing 2 x 240 = 480 instead of the correct 2 x 185 = 370. The fixed
-- two-step lookup (ingredient-specific first, global fallback only if no
-- ingredient-specific row matches) must return 370.
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('44444444-4444-4444-4444-444444444444', 'Pgtap Test Almond Flour', 'Grain', 'g', 'cup');

insert into public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
values ('44444444-4444-4444-4444-444444444444', 'cup', 185, 'g');

select public.add_pantry_item('Pgtap Test Almond Flour', 2, 'cup', false);

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '44444444-4444-4444-4444-444444444444'
  ),
  370::numeric,
  'add_pantry_item prefers the ingredient-specific unit_conversions row (2 cup x 185 = 370 g) over a colliding global row (2 cup x 240 = 480 ml)'
);

-- ── Case 6: sets is_permanent = true when requested ─────────────────────────
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222225', 'Pgtap Test Sugar', 'Baking', 'g', 'g');

select public.add_pantry_item('Pgtap Test Sugar', 100, 'g', true);

select is(
  (
    select is_permanent
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222225'
  ),
  true,
  'add_pantry_item sets is_permanent = true when p_is_permanent is true'
);

-- ── Case 7: a pinned item stays pinned once later calls pass false ─────────
select public.add_pantry_item('Pgtap Test Sugar', 25, 'g', false);

select is(
  (
    select is_permanent
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222225'
  ),
  true,
  'add_pantry_item does not unpin a previously-pinned row when p_is_permanent is false (OR logic)'
);

select * from finish();

rollback;
