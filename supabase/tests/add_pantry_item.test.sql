-- Minimal pgTAP smoke test for public.add_pantry_item(text, numeric, text, boolean).
--
-- This is intentionally narrow in scope: it exists to prove the `supabase test db`
-- harness works end-to-end against a real local Postgres instance (TODO.md #1),
-- not to cover the full add_pantry_item behavior matrix (unit conversion, quantity
-- accumulation on conflict, is_permanent pinning semantics — see TODO.md #2 for
-- that fuller suite).
--
-- NOTE: add_pantry_item currently has two overloads in the schema —
--   (text, numeric, text) from 20260524120000_backfill_pantry_rpc_functions.sql
--   (text, numeric, text, boolean DEFAULT false) from 20260606120000_add_permanent_param_to_add_pantry_item.sql
-- Both are called explicitly here with all 4 arguments to avoid any ambiguity
-- between the two overloads.
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

-- Impersonate a specific user for auth.uid() (add_pantry_item is SECURITY DEFINER
-- and writes to user_pantry scoped to auth.uid()).
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- Real auth.users row required to satisfy user_pantry.user_id's FK.
insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'pgtap-add-pantry-item@example.com', 'authenticated', 'authenticated');

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

select * from finish();

rollback;
