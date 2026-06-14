-- Rename ai_events → session_strikes and increment_ai_event → increment_session_strike

ALTER TABLE public.ai_events RENAME TO session_strikes;

ALTER INDEX ai_events_user_date_idx RENAME TO session_strikes_user_date_idx;

DROP FUNCTION IF EXISTS public.increment_ai_event(uuid, uuid, date, text);

CREATE OR REPLACE FUNCTION public.increment_session_strike(
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
  INSERT INTO public.session_strikes (user_id, session_id, usage_date, off_topic_count, safety_decline_count)
  VALUES (
    p_user_id,
    p_session_id,
    p_usage_date,
    CASE WHEN p_event_type = 'off_topic'      THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'safety_decline' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET
    off_topic_count      = public.session_strikes.off_topic_count
                           + CASE WHEN p_event_type = 'off_topic'      THEN 1 ELSE 0 END,
    safety_decline_count = public.session_strikes.safety_decline_count
                           + CASE WHEN p_event_type = 'safety_decline' THEN 1 ELSE 0 END,
    updated_at           = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_session_strike(uuid, uuid, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_session_strike(uuid, uuid, date, text) TO authenticated;
