/*
  # Fix check_recipe_cookability function

  ## Summary
  The ai_pantry_snapshot view does not expose a user_id column — it is already
  filtered to the current user via RLS. This migration replaces the function to
  remove the incorrect user_id filter on that view.

  ## Changes
  - Replaces check_recipe_cookability with a corrected version that queries
    ai_pantry_snapshot without a user_id column reference
*/

CREATE OR REPLACE FUNCTION check_recipe_cookability(p_recipe_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_ingredients jsonb;
  v_ingredient jsonb;
  v_pantry_qty numeric;
  v_all_available boolean := true;
BEGIN
  SELECT user_id, ingredients
  INTO v_user_id, v_ingredients
  FROM saved_recipes
  WHERE id = p_recipe_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    SELECT raw_weight_or_count
    INTO v_pantry_qty
    FROM ai_pantry_snapshot
    WHERE lower(name) = lower(v_ingredient->>'name')
    LIMIT 1;

    IF v_pantry_qty IS NULL OR v_pantry_qty <= 0 THEN
      v_all_available := false;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_all_available;
END;
$$;
