-- Migration: rename daily_ai_usage.request_count → recipe_count
-- and replace increment_daily_ai_usage() with increment_daily_recipe_count()
-- to clarify that only successful recipe responses are counted.

BEGIN;

-- 1. Rename the column
ALTER TABLE public.daily_ai_usage
  RENAME COLUMN request_count TO recipe_count;

-- 2. Drop the old RPC (signature must match exactly)
DROP FUNCTION IF EXISTS public.increment_daily_ai_usage(uuid, date);

-- 3. Recreate under the new name, targeting the renamed column
CREATE OR REPLACE FUNCTION public.increment_daily_recipe_count(
  p_user_id    uuid,
  p_usage_date date
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.daily_ai_usage (user_id, usage_date, recipe_count)
  VALUES (p_user_id, p_usage_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET recipe_count = public.daily_ai_usage.recipe_count + 1;
$$;

REVOKE ALL ON FUNCTION public.increment_daily_recipe_count(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_recipe_count(uuid, date) TO authenticated;

COMMIT;

-- ============================================================
-- Rollback / Down migration (run manually if needed):
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.increment_daily_recipe_count(uuid, date);
-- ALTER TABLE public.daily_ai_usage RENAME COLUMN recipe_count TO request_count;
-- CREATE OR REPLACE FUNCTION public.increment_daily_ai_usage(p_user_id uuid, p_usage_date date)
-- RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
--   INSERT INTO public.daily_ai_usage (user_id, usage_date, request_count)
--   VALUES (p_user_id, p_usage_date, 1)
--   ON CONFLICT (user_id, usage_date)
--   DO UPDATE SET request_count = public.daily_ai_usage.request_count + 1;
-- $$;
-- REVOKE ALL ON FUNCTION public.increment_daily_ai_usage(uuid, date) FROM PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.increment_daily_ai_usage(uuid, date) TO authenticated;
-- COMMIT;
