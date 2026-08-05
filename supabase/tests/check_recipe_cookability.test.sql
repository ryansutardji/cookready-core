-- pgTAP suite for public.check_recipe_cookability(uuid).
--
-- The function's ownership check (`IF v_user_id != auth.uid()`) is plpgsql
-- application logic, not RLS, so impersonation via set_config alone is enough —
-- no role switching required.
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select tests.create_test_user('11111111-1111-1111-1111-111111111111');
select tests.create_test_user('99999999-9999-9999-9999-999999999999');

-- Shared ingredient + pantry stock for User A.
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222222', 'Pgtap Test Rice', 'Grain', 'g', 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 500, false);

-- Impersonate User A for auth.uid().
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- ── Case 1: true when all ingredients are sufficiently stocked ──────────────
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  'Pgtap Test Rice Bowl',
  '[{"name":"Pgtap Test Rice","quantity":200,"unit":"g"}]'::jsonb
);

select is(
  public.check_recipe_cookability('44444444-4444-4444-4444-444444444441'),
  true,
  'check_recipe_cookability returns true when pantry stock covers every ingredient'
);

-- ── Case 2: false when an ingredient is insufficiently stocked ──────────────
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  'Pgtap Test Rice Feast',
  '[{"name":"Pgtap Test Rice","quantity":1000,"unit":"g"}]'::jsonb
);

select is(
  public.check_recipe_cookability('44444444-4444-4444-4444-444444444442'),
  false,
  'check_recipe_cookability returns false when an ingredient requires more than is stocked'
);

-- ── Case 3: true when an is_always_available staple (Water) has no pantry row ──
-- Water is seeded globally with is_always_available = true
-- (20260803060407_add_is_always_available_ingredient_flag.sql). No user_pantry
-- row exists for it, but the RPC should short-circuit to available regardless.
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Pgtap Test Rice Soup',
  '[{"name":"Pgtap Test Rice","quantity":200,"unit":"g"},{"name":"Water","quantity":4,"unit":"cup"}]'::jsonb
);

select is(
  public.check_recipe_cookability('44444444-4444-4444-4444-444444444444'),
  true,
  'check_recipe_cookability treats an is_always_available staple (Water) as available with no pantry row'
);

-- ── Case 4: false for a recipe owned by a different user (ownership short-circuit) ──
insert into public.saved_recipes (id, user_id, recipe_name, ingredients)
values (
  '44444444-4444-4444-4444-444444444445',
  '99999999-9999-9999-9999-999999999999',
  'Pgtap Test Other User Recipe',
  '[{"name":"Pgtap Test Rice","quantity":200,"unit":"g"}]'::jsonb
);

-- Still impersonating User A here.
select is(
  public.check_recipe_cookability('44444444-4444-4444-4444-444444444445'),
  false,
  'check_recipe_cookability returns false (not an error) for a recipe owned by another user'
);

select * from finish();

rollback;
