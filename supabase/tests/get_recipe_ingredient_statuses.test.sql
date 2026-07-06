-- pgTAP suite for public.get_recipe_ingredient_statuses(uuid).
--
-- Same ownership check as check_recipe_cookability, but on unauthorized access
-- it does a bare RETURN (zero rows, no exception) rather than raising an error
-- or returning a sentinel value — assert with is_empty(), not throws_ok().
begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select tests.create_test_user('11111111-1111-1111-1111-111111111111');
select tests.create_test_user('99999999-9999-9999-9999-999999999999');

insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222222', 'Pgtap Test Rice', 'Grain', 'g', 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 500, false);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- ── Case 1: available = true for a sufficiently-stocked ingredient ──────────
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  'Pgtap Test Rice Bowl',
  '[{"name":"Pgtap Test Rice","quantity":200,"unit":"g"}]'::jsonb
);

select results_eq(
  $$select ingredient_name, available from public.get_recipe_ingredient_statuses('44444444-4444-4444-4444-444444444441')$$,
  $$values ('Pgtap Test Rice'::text, true)$$,
  'get_recipe_ingredient_statuses reports available = true when pantry stock covers the requirement'
);

-- ── Case 2: available = false for an insufficiently-stocked ingredient ──────
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  'Pgtap Test Rice Feast',
  '[{"name":"Pgtap Test Rice","quantity":1000,"unit":"g"}]'::jsonb
);

select results_eq(
  $$select ingredient_name, available from public.get_recipe_ingredient_statuses('44444444-4444-4444-4444-444444444442')$$,
  $$values ('Pgtap Test Rice'::text, false)$$,
  'get_recipe_ingredient_statuses reports available = false when the requirement exceeds pantry stock'
);

-- ── Case 3: zero rows for a recipe not owned by the caller ──────────────────
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444443',
  '99999999-9999-9999-9999-999999999999',
  'Pgtap Test Other User Recipe',
  '[{"name":"Pgtap Test Rice","quantity":200,"unit":"g"}]'::jsonb
);

-- Still impersonating User A here.
select is_empty(
  $$select * from public.get_recipe_ingredient_statuses('44444444-4444-4444-4444-444444444443')$$,
  'get_recipe_ingredient_statuses returns zero rows (no exception) for a recipe owned by another user'
);

select * from finish();

rollback;
