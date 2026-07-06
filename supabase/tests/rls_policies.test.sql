-- pgTAP suite exercising RLS enforcement (not just presence) on user_pantry,
-- profiles, bundles, bundle_ingredients, and daily_ai_usage.
--
-- `supabase test db` runs as the Postgres superuser, which always bypasses RLS,
-- so testing "for real" requires switching to the `authenticated` role. Seeding
-- is done first as the default (superuser) connection, since `authenticated`
-- has no INSERT grant on auth.users.
begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

-- ── Seed (as superuser) ──────────────────────────────────────────────────────
select tests.create_test_user('11111111-1111-1111-1111-111111111111');
select tests.create_test_user('99999999-9999-9999-9999-999999999999');

insert into public.ingredients (id, name, category, base_unit, preferred_unit)
values ('22222222-2222-2222-2222-222222222222', 'Pgtap Test Rls Ingredient', 'Grain', 'g', 'g');

insert into public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 100, false),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 200, false);

insert into public.bundles (id, name, description, tag, icon, color, sort_order, user_id)
values ('pgtap-system-bundle', 'Pgtap System Bundle', 'Pgtap test system bundle', 'Everyday', '📦', '#000000', 0, null);

insert into public.bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
values ('pgtap-system-bundle', '22222222-2222-2222-2222-222222222222', 'g', 0);

insert into public.daily_ai_usage (user_id, usage_date, recipe_count)
values
  ('11111111-1111-1111-1111-111111111111', current_date, 1),
  ('99999999-9999-9999-9999-999999999999', current_date, 1);

-- ── Switch to the authenticated role for the rest of the transaction ────────
-- A superuser can switch role without explicit membership; SET LOCAL is
-- transaction-scoped, matching the begin ... rollback wrapper.
set local role authenticated;

-- ── Case 1: user cannot SELECT another user's user_pantry rows ─────────────
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.user_pantry)::int,
  1,
  'authenticated user only sees their own user_pantry row via unfiltered SELECT'
);

-- ── Case 2: user cannot INSERT a user_pantry row with a different user_id ──
select throws_ok(
  $$insert into public.user_pantry (user_id, ingredient_id, current_quantity_value)
    values ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 999)$$,
  '42501',
  null,
  'authenticated user cannot INSERT a user_pantry row on behalf of another user'
);

-- ── Case 3: user cannot UPDATE another user's profiles row ──────────────────
-- has_completed_onboarding is one of the two columns authenticated has an
-- UPDATE grant on; the RLS USING clause should silently drop B's row from the
-- update set entirely (0 rows affected), rather than raising an error.
with updated as (
  update public.profiles
     set has_completed_onboarding = true
   where id = '99999999-9999-9999-9999-999999999999'
  returning 1
)
select is(
  (select count(*) from updated)::int,
  0,
  'authenticated user cannot UPDATE another user''s profiles row (RLS silently filters it)'
);

-- ── Case 4: bundles/bundle_ingredients readable by any authenticated user ──
-- Impersonate User B, who does not own the system bundle. A system row
-- (user_id IS NULL) should still be visible per the "user_id IS NULL OR
-- user_id = auth.uid()" policy — private bundles are not universally readable,
-- which is why the fixture above used a system (user_id IS NULL) row.
select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);

select is(
  (
    select count(*)
      from public.bundles b
      join public.bundle_ingredients bi on bi.bundle_id = b.id
     where b.id = 'pgtap-system-bundle'
  )::int,
  1,
  'a system (user_id IS NULL) bundle and its bundle_ingredients row are visible to any authenticated user'
);

-- ── Case 5: daily_ai_usage rows only readable by the owning user ───────────
-- Still impersonating User B here.
select is(
  (select count(*) from public.daily_ai_usage)::int,
  1,
  'authenticated user only sees their own daily_ai_usage row via unfiltered SELECT'
);

select * from finish();

rollback;
