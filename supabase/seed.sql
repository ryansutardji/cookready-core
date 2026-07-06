-- Local/CI-only seed file, loaded by `supabase db reset` (and therefore by
-- `supabase test db`, which resets before running the pgTAP suite in supabase/tests/).
-- Never applied to a hosted/production project — see supabase/config.toml's
-- `db.seed.sql_paths = ["./seed.sql"]`.
--
-- Provides a `tests` schema with a helper for creating minimal auth.users rows,
-- since pgTAP test files need real rows there to satisfy FK constraints on
-- user_pantry, saved_recipes, profiles, session_strikes, daily_ai_usage, etc.

-- ── Local-stack-only grants gap ──────────────────────────────────────────────
-- A hosted Supabase project gets base table-level GRANTs (SELECT/INSERT/UPDATE/
-- DELETE) for anon/authenticated/service_role on public.* automatically via
-- Supabase's own project-bootstrap process. Building the DB purely from
-- `supabase/migrations/` (as `supabase start`/`db reset` does locally) does NOT
-- replicate that step, since no migration file issues these GRANTs — RLS
-- policies alone never grant access, they only restrict rows once a privilege
-- already exists. Without this, `SET ROLE authenticated` fails with
-- "permission denied for table ..." before RLS even runs. This is confirmed
-- NOT a production issue (production already has these grants), so the fix
-- lives here in seed.sql (local/CI-only) rather than a migration.
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema if not exists tests;

create or replace function tests.create_test_user(p_id uuid, p_email text default null)
returns void
language sql
as $$
  insert into auth.users (id, email, aud, role)
  values (p_id, coalesce(p_email, 'pgtap-' || p_id::text || '@example.com'), 'authenticated', 'authenticated');
$$;
