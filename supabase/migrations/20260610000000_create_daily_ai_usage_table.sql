-- Migration: create daily_ai_usage table for per-user AI request rate limiting
-- The edge function writes to this table using the service role key (bypasses RLS).
-- Users can read only their own rows to display usage in the app if needed.

BEGIN;

CREATE TABLE IF NOT EXISTS public.daily_ai_usage (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date   date    NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
  request_count integer NOT NULL DEFAULT 0,
  CONSTRAINT daily_ai_usage_user_date_unique UNIQUE (user_id, usage_date)
);

-- Index to make the rate-limit lookup fast (user_id + usage_date point lookup)
CREATE INDEX IF NOT EXISTS daily_ai_usage_user_date_idx
  ON public.daily_ai_usage (user_id, usage_date);

ALTER TABLE public.daily_ai_usage ENABLE ROW LEVEL SECURITY;

-- Atomic upsert-and-increment called from the edge function via service role.
-- Using a SECURITY DEFINER function so the edge function's supabase-js admin client
-- can invoke it without needing raw INSERT/UPDATE grants on the table.
CREATE OR REPLACE FUNCTION public.increment_daily_ai_usage(
  p_user_id   uuid,
  p_usage_date date
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.daily_ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, p_usage_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = public.daily_ai_usage.request_count + 1;
$$;

-- Users can read their own usage rows (e.g. to show "X/10 requests used today")
-- No insert/update policy for authenticated users — writes go through the service role key in the edge function.
CREATE POLICY "users can read own daily ai usage"
  ON public.daily_ai_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMIT;

-- ============================================================
-- Rollback / Down migration (run manually if needed):
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.daily_ai_usage;
-- COMMIT;
