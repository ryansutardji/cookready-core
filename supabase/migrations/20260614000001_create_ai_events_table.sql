-- Migration: create ai_events table for per-session off-topic and safety-decline tracking
-- Writes come exclusively from the edge function via the service role key (bypasses RLS).
-- Users can read only their own rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id           uuid        NOT NULL,
  -- PST date, same convention as daily_ai_usage
  usage_date           date        NOT NULL,
  off_topic_count      integer     NOT NULL DEFAULT 0,
  safety_decline_count integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

-- Index for fast per-user lookups (user_id + usage_date range scans)
CREATE INDEX IF NOT EXISTS ai_events_user_date_idx
  ON public.ai_events (user_id, usage_date);

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own event rows only.
-- No INSERT/UPDATE policy — all writes go through the service role in the edge function.
CREATE POLICY "users can read own ai events"
  ON public.ai_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Atomic upsert-and-increment called from the edge function via service role.
-- p_event_type must be 'off_topic' or 'safety_decline'; other values are silently ignored.
CREATE OR REPLACE FUNCTION public.increment_ai_event(
  p_user_id    uuid,
  p_session_id uuid,
  p_usage_date date,
  p_event_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_events (user_id, session_id, usage_date, off_topic_count, safety_decline_count)
  VALUES (
    p_user_id,
    p_session_id,
    p_usage_date,
    CASE WHEN p_event_type = 'off_topic'       THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'safety_decline'  THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET
    off_topic_count      = public.ai_events.off_topic_count
                           + CASE WHEN p_event_type = 'off_topic'      THEN 1 ELSE 0 END,
    safety_decline_count = public.ai_events.safety_decline_count
                           + CASE WHEN p_event_type = 'safety_decline' THEN 1 ELSE 0 END,
    updated_at           = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_event(uuid, uuid, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_event(uuid, uuid, date, text) TO authenticated;

COMMIT;

-- ============================================================
-- Rollback / Down migration (run manually if needed):
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.increment_ai_event(uuid, uuid, date, text);
-- DROP TABLE IF EXISTS public.ai_events;
-- COMMIT;
