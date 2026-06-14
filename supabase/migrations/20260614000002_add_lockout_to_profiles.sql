-- Migration: add locked_until to profiles + apply_abuse_lockout() RPC
-- locked_until is server-only — users cannot set it directly.
-- The blanket UPDATE policy is replaced with a column-level grant that
-- lists only the columns users are permitted to modify.

BEGIN;

-- 1. Add the lockout column (server-written only, nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL;

-- 2. Replace the blanket UPDATE grant with an explicit column list.
--    Columns users may update: has_completed_onboarding, unlimited_recipes
--    (unlimited_recipes is set by admins via service role in practice, but the
--    existing policy allows it client-side; locked_until is intentionally excluded.)
--    last_sign_in_at, created_at, updated_at, id are trigger/system managed.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (has_completed_onboarding, unlimited_recipes) ON public.profiles TO authenticated;

-- 3. SECURITY DEFINER RPC — sets a 12-hour lockout for the calling user.
--    Runs as the function owner (postgres) so it can write locked_until
--    even though authenticated role no longer has UPDATE on that column.
CREATE OR REPLACE FUNCTION public.apply_abuse_lockout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    locked_until = NOW() + INTERVAL '12 hours',
    updated_at   = NOW()
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.apply_abuse_lockout() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_abuse_lockout() TO authenticated;

COMMIT;

-- ============================================================
-- Rollback / Down migration (run manually if needed):
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.apply_abuse_lockout();
-- REVOKE UPDATE (has_completed_onboarding, unlimited_recipes) ON public.profiles FROM authenticated;
-- GRANT UPDATE ON public.profiles TO authenticated;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_until;
-- COMMIT;
