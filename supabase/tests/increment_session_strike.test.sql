-- pgTAP suite for public.increment_session_strike(uuid, uuid, date, text).
--
-- This function trusts p_user_id directly (no internal auth.uid() check —
-- it's intended to be called from the edge function via the service role),
-- so no impersonation is needed. It still needs a real auth.users row to
-- satisfy session_strikes.user_id's FK.
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select tests.create_test_user('11111111-1111-1111-1111-111111111111');

-- ── Case 1: increments off_topic_count on first insert ──────────────────────
select public.increment_session_strike(
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777771',
  current_date,
  'off_topic'
);

select is(
  (
    select off_topic_count
      from public.session_strikes
     where user_id = '11111111-1111-1111-1111-111111111111'
       and session_id = '77777777-7777-7777-7777-777777777771'
  ),
  1,
  'increment_session_strike sets off_topic_count = 1 on first off_topic event'
);

-- ── Case 2: increments safety_decline_count for a new session ───────────────
select public.increment_session_strike(
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777772',
  current_date,
  'safety_decline'
);

select is(
  (
    select safety_decline_count
      from public.session_strikes
     where user_id = '11111111-1111-1111-1111-111111111111'
       and session_id = '77777777-7777-7777-7777-777777777772'
  ),
  1,
  'increment_session_strike sets safety_decline_count = 1 on first safety_decline event'
);

-- ── Case 3: increments deferred_count for a new session ─────────────────────
select public.increment_session_strike(
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777773',
  current_date,
  'deferred'
);

select is(
  (
    select deferred_count
      from public.session_strikes
     where user_id = '11111111-1111-1111-1111-111111111111'
       and session_id = '77777777-7777-7777-7777-777777777773'
  ),
  1,
  'increment_session_strike sets deferred_count = 1 on first deferred event'
);

-- ── Case 4: upsert accumulates on the same session, doesn't overwrite ───────
select public.increment_session_strike(
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777771',
  current_date,
  'off_topic'
);

select is(
  (
    select off_topic_count
      from public.session_strikes
     where user_id = '11111111-1111-1111-1111-111111111111'
       and session_id = '77777777-7777-7777-7777-777777777771'
  ),
  2,
  'increment_session_strike accumulates off_topic_count on a repeat call for the same session (1 -> 2)'
);

select * from finish();

rollback;
