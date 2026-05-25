/*
  # Fix deplete_pantry_item and check_recipe_cookability for empty-unit ingredients

  ## Summary
  The AI chef emits recipe ingredients with `unit: ""` when the unit is considered
  redundant (e.g. `{"name":"Swordfish","unit":"","quantity":3}` = "3 lbs of swordfish").
  Two functions failed to handle this case, causing pantry depletion to silently do
  nothing and cookability checks to never gate on quantity.

  ## Changes

  ### 1. deplete_pantry_item
  - Declare `v_effective_unit` variable
  - When `p_unit` is NULL or blank, fall back to the ingredient's `preferred_unit`
  - Use `v_effective_unit` in both unit_conversions lookups (ingredient-specific + global)
  - Stricter `SET search_path = ''`; all table references fully qualified

  ### 2. check_recipe_cookability
  - Replace simple "ingredient exists with qty > 0" check with a quantity-aware check:
    resolve the effective unit (empty → preferred_unit), look up the conversion factor,
    convert the required quantity to base units, and compare against the pantry's
    base-unit quantity
  - Stricter `SET search_path = ''`; all table references fully qualified

  ### 3. Data fix — swordfish missing unit_conversion row
  - Swordfish (id 6289aeb7-0459-48d1-af80-95f998674666) has preferred_unit = 'lb'
    but no ingredient-specific unit_conversion row, so the fallback to grams was
    silently used (1 g instead of 453 g per unit)
  - Insert the missing row: lb → g with multiplier 453

  ## Security Notes
  - Both functions remain SECURITY DEFINER so they can read other users' rows safely
  - search_path hardened to '' (empty) to prevent search-path injection
  - REVOKE/GRANT preserved: authenticated users only, no public access
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. deplete_pantry_item — handle empty/null unit by falling back to preferred_unit
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deplete_pantry_item(
  p_ingredient_name text,
  p_quantity        numeric,
  p_unit            text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row            public.user_pantry%ROWTYPE;
  v_ingredient_id  uuid;
  v_effective_unit text;
  v_conv_factor    numeric;
  v_base_qty       numeric;
BEGIN
  SELECT id INTO v_ingredient_id
  FROM public.ingredients
  WHERE lower(name) = lower(p_ingredient_name)
  LIMIT 1;

  IF v_ingredient_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_row
  FROM public.user_pantry
  WHERE user_id = auth.uid() AND ingredient_id = v_ingredient_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;
  IF v_row.is_permanent THEN RETURN; END IF;

  -- When the AI emits unit = "" (redundant unit), fall back to the ingredient's
  -- preferred_unit so the conversion table lookup succeeds.
  v_effective_unit := p_unit;
  IF v_effective_unit IS NULL OR trim(v_effective_unit) = '' THEN
    SELECT preferred_unit INTO v_effective_unit
    FROM public.ingredients
    WHERE id = v_ingredient_id;
  END IF;

  -- Ingredient-specific conversion first, then global fallback.
  SELECT output_value INTO v_conv_factor
  FROM public.unit_conversions
  WHERE ingredient_id = v_ingredient_id AND input_unit = v_effective_unit
  LIMIT 1;

  IF v_conv_factor IS NULL THEN
    SELECT output_value INTO v_conv_factor
    FROM public.unit_conversions
    WHERE ingredient_id IS NULL AND input_unit = v_effective_unit
    LIMIT 1;
  END IF;

  v_base_qty := CASE WHEN v_conv_factor > 0 THEN p_quantity * v_conv_factor ELSE p_quantity END;

  UPDATE public.user_pantry
  SET current_quantity_value = GREATEST(0, current_quantity_value - v_base_qty),
      last_updated = now()
  WHERE id = v_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.deplete_pantry_item(text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.deplete_pantry_item(text, numeric, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. check_recipe_cookability — quantity-aware check, empty-unit safe
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_recipe_cookability(p_recipe_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id            uuid;
  v_ingredients        jsonb;
  v_ingredient         jsonb;
  v_ingredient_id      uuid;
  v_effective_unit     text;
  v_conv_factor        numeric;
  v_required_base_qty  numeric;
  v_pantry_qty         numeric;
  v_all_available      boolean := true;
BEGIN
  SELECT user_id, ingredients
  INTO v_user_id, v_ingredients
  FROM public.saved_recipes
  WHERE id = p_recipe_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN RETURN false; END IF;

  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    -- Resolve ingredient id and preferred_unit.
    SELECT id, preferred_unit
    INTO v_ingredient_id, v_effective_unit
    FROM public.ingredients
    WHERE lower(name) = lower(v_ingredient->>'name')
    LIMIT 1;

    -- If the AI emitted unit = "" use the ingredient's preferred_unit instead.
    IF v_ingredient->>'unit' IS NOT NULL AND trim(v_ingredient->>'unit') != '' THEN
      v_effective_unit := v_ingredient->>'unit';
    END IF;

    -- Ingredient-specific conversion first, then global fallback.
    v_conv_factor := NULL;

    IF v_ingredient_id IS NOT NULL THEN
      SELECT output_value INTO v_conv_factor
      FROM public.unit_conversions
      WHERE ingredient_id = v_ingredient_id AND input_unit = v_effective_unit
      LIMIT 1;
    END IF;

    IF v_conv_factor IS NULL THEN
      SELECT output_value INTO v_conv_factor
      FROM public.unit_conversions
      WHERE ingredient_id IS NULL AND input_unit = v_effective_unit
      LIMIT 1;
    END IF;

    -- Convert the recipe's required quantity to base units.
    v_required_base_qty := CASE
      WHEN v_conv_factor > 0 THEN (v_ingredient->>'quantity')::numeric * v_conv_factor
      ELSE (v_ingredient->>'quantity')::numeric
    END;

    -- raw_weight_or_count in ai_pantry_snapshot equals current_quantity_value (base units).
    SELECT raw_weight_or_count INTO v_pantry_qty
    FROM public.ai_pantry_snapshot
    WHERE lower(name) = lower(v_ingredient->>'name')
    LIMIT 1;

    IF v_pantry_qty IS NULL OR v_pantry_qty < v_required_base_qty THEN
      v_all_available := false;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_all_available;
END;
$$;

REVOKE ALL ON FUNCTION public.check_recipe_cookability(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.check_recipe_cookability(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Data fix — insert missing lb→g unit_conversion for swordfish
-- ─────────────────────────────────────────────────────────────────────────────
-- Swordfish has preferred_unit = 'lb' but no ingredient-specific row, so the
-- global lb→g conversion was never found and depletion silently subtracted in grams.
INSERT INTO public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
VALUES ('6289aeb7-0459-48d1-af80-95f998674666', 'lb', 453, 'g')
ON CONFLICT DO NOTHING;
