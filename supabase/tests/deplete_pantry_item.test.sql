-- pgTAP suite for public.deplete_pantry_item(text, numeric, text).
--
-- Seeds each case via a direct INSERT INTO user_pantry (not via add_pantry_item)
-- so this file's correctness is independent of add_pantry_item's own test suite.
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select tests.create_test_user('11111111-1111-1111-1111-111111111111');

-- ── Case 1: reduces by the correct converted amount ─────────────────────────
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222222', 'Pgtap Test Butter D', 'Dairy', 'g', 'g');

insert into public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
values ('22222222-2222-2222-2222-222222222222', 'stick', 113, 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1000, false);

select public.deplete_pantry_item('Pgtap Test Butter D', 2, 'stick');

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222222'
  ),
  774::numeric,
  'deplete_pantry_item reduces quantity by the converted amount (1000 - 2x113 = 774)'
);

-- ── Case 2: clamps to zero, never negative ──────────────────────────────────
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('33333333-3333-3333-3333-333333333333', 'Pgtap Test Milk', 'Dairy', 'ml', 'ml');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 100, false);

-- Unit matches base_unit and no unit_conversions row exists, so the conversion
-- factor defaults to null -> raw quantity is subtracted directly.
select public.deplete_pantry_item('Pgtap Test Milk', 500, 'ml');

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '33333333-3333-3333-3333-333333333333'
  ),
  0::numeric,
  'deplete_pantry_item clamps current_quantity_value at 0 instead of going negative'
);

-- ── Case 3: silently skips when is_permanent = true ─────────────────────────
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222224', 'Pgtap Test Oil', 'Oil', 'g', 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', 200, true);

select public.deplete_pantry_item('Pgtap Test Oil', 50, 'g');

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '22222222-2222-2222-2222-222222222224'
  ),
  200::numeric,
  'deplete_pantry_item leaves current_quantity_value unchanged when is_permanent is true'
);

-- ── Case 4: falls back to preferred_unit on an empty-string unit ────────────
insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('33333333-3333-3333-3333-333333333334', 'Pgtap Test Cheese', 'Dairy', 'g', 'cup');

insert into public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
values ('33333333-3333-3333-3333-333333333334', 'cup', 120, 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333334', 1000, false);

-- p_unit = '' (empty string) should resolve to the ingredient's preferred_unit ('cup').
select public.deplete_pantry_item('Pgtap Test Cheese', 1, '');

select is(
  (
    select current_quantity_value
      from public.user_pantry
     where user_id = '11111111-1111-1111-1111-111111111111'
       and ingredient_id = '33333333-3333-3333-3333-333333333334'
  ),
  880::numeric,
  'deplete_pantry_item falls back to preferred_unit when p_unit is an empty string (1000 - 1x120 = 880)'
);

select * from finish();

rollback;
