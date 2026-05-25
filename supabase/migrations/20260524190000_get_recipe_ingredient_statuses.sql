/*
  # Add get_recipe_ingredient_statuses RPC

  Returns per-ingredient availability for a recipe, using the same unit-conversion
  logic as check_recipe_cookability. Fixes the recipe detail screen which previously
  only checked ingredient existence (qty > 0) rather than comparing against the
  required quantity.
*/

CREATE OR REPLACE FUNCTION public.get_recipe_ingredient_statuses(p_recipe_id uuid)
RETURNS TABLE(ingredient_name text, available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id        uuid;
  v_ingredients    jsonb;
  v_ingredient     jsonb;
  v_ingredient_id  uuid;
  v_effective_unit text;
  v_conv_factor    numeric;
  v_required_base  numeric;
  v_pantry_qty     numeric;
BEGIN
  SELECT user_id, ingredients
  INTO v_user_id, v_ingredients
  FROM public.saved_recipes
  WHERE id = p_recipe_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN RETURN; END IF;

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
    v_required_base := CASE
      WHEN v_conv_factor > 0 THEN (v_ingredient->>'quantity')::numeric * v_conv_factor
      ELSE (v_ingredient->>'quantity')::numeric
    END;

    -- raw_weight_or_count in ai_pantry_snapshot is already in base units.
    SELECT raw_weight_or_count INTO v_pantry_qty
    FROM public.ai_pantry_snapshot
    WHERE lower(name) = lower(v_ingredient->>'name')
    LIMIT 1;

    ingredient_name := v_ingredient->>'name';
    available       := v_pantry_qty IS NOT NULL AND v_pantry_qty >= v_required_base;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_recipe_ingredient_statuses(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_recipe_ingredient_statuses(uuid) TO authenticated;
