-- pgTAP suite for public.apply_abuse_lockout().
--
-- The handle_new_user trigger (20260519045458_create_profiles_table.sql)
-- auto-creates each user's profiles row on auth.users insert, so no manual
-- profiles insert is needed here.
begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

select tests.create_test_user('11111111-1111-1111-1111-111111111111');
select tests.create_test_user('99999999-9999-9999-9999-999999999999');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- ── Case 1: sets locked_until to ~ NOW() + 12h ───────────────────────────────
select public.apply_abuse_lockout();

select ok(
  (
    select locked_until
      from public.profiles
     where id = '11111111-1111-1111-1111-111111111111'
  ) between now() + interval '11 hours 59 minutes' and now() + interval '12 hours 1 minute',
  'apply_abuse_lockout sets locked_until to approximately now() + 12 hours'
);

-- ── Case 2: does not affect other users ──────────────────────────────────────
select ok(
  (
    select locked_until
      from public.profiles
     where id = '99999999-9999-9999-9999-999999999999'
  ) is null,
  'apply_abuse_lockout does not modify other users'' profiles rows'
);

select * from finish();

rollback;
