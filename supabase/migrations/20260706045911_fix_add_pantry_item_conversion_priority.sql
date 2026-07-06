/*
  # Fix add_pantry_item unit-conversion tiebreak

  ## Bug
  The previous version of add_pantry_item (20260606120000_add_permanent_param_to_add_pantry_item.sql)
  picked a unit_conversions row with:

      WHERE (ingredient_id = v_ing_id OR ingredient_id IS NULL)
        AND input_unit = p_unit
      ORDER BY ingredient_id DESC
      LIMIT 1;

  The inline comment claimed this makes the ingredient-specific row sort before
  the global (ingredient_id IS NULL) row. That's incorrect: Postgres's default
  null-ordering for ORDER BY ... DESC is NULLS FIRST, so when both an
  ingredient-specific row and a global row match the same input_unit, the
  global row silently wins the tiebreak instead. Because the function never
  checks that the winning row's output_unit matches the ingredient's
  base_unit, this could silently store a value converted by the wrong factor
  entirely, with no error raised.

  ## Fix
  Replace the single ORDER BY-based query with an explicit two-step lookup:
  try the ingredient-specific row first, and only fall back to the global row
  if nothing ingredient-specific matched. This mirrors the "specific, then
  global fallback" pattern already used by deplete_pantry_item (see
  20260524180000_fix_depletion_and_cookability.sql) and
  check_recipe_cookability / get_recipe_ingredient_statuses.

  ## Changes
  - CREATE OR REPLACE FUNCTION public.add_pantry_item(text, numeric, text, boolean)
    - Only the conversion-lookup section changed; signature, SECURITY DEFINER,
      SET search_path = '', upsert logic, and grants are unchanged from
      20260606120000_add_permanent_param_to_add_pantry_item.sql.
*/

-- ---------------------------------------------------------------------------
-- add_pantry_item (conversion-priority fix)
--    Converts the supplied quantity to the ingredient's base unit using
--    unit_conversions, then upserts into user_pantry (accumulating quantity
--    on conflict).  The optional p_is_permanent flag pins the item; once
--    pinned, passing false will not unpin it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_pantry_item(
    p_ingredient_name text,
    p_quantity         numeric,
    p_unit             text,
    p_is_permanent     boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_ing_id            uuid;
    v_conversion_factor decimal;
    v_total_to_add      decimal;
BEGIN
    SELECT id INTO v_ing_id
      FROM public.ingredients
     WHERE name = p_ingredient_name;

    -- Prefer an ingredient-specific conversion; fall back to a global one.
    -- Two explicit steps instead of a single ORDER BY ingredient_id DESC:
    -- Postgres's default null-ordering for DESC is NULLS FIRST, so that
    -- single-query approach actually preferred the global row on a tie.
    SELECT output_value INTO v_conversion_factor
      FROM public.unit_conversions
     WHERE ingredient_id = v_ing_id
       AND input_unit = p_unit
     LIMIT 1;

    IF v_conversion_factor IS NULL THEN
        SELECT output_value INTO v_conversion_factor
          FROM public.unit_conversions
         WHERE ingredient_id IS NULL
           AND input_unit = p_unit
         LIMIT 1;
    END IF;

    v_conversion_factor := COALESCE(v_conversion_factor, 1);
    v_total_to_add      := p_quantity * v_conversion_factor;

    INSERT INTO public.user_pantry (user_id, ingredient_id, current_quantity_value, is_permanent)
    VALUES (auth.uid(), v_ing_id, v_total_to_add, p_is_permanent)
    ON CONFLICT (user_id, ingredient_id)
    DO UPDATE SET
        current_quantity_value = public.user_pantry.current_quantity_value + v_total_to_add,
        -- OR logic: true always pins; false preserves existing pin state
        is_permanent           = public.user_pantry.is_permanent OR p_is_permanent,
        last_updated           = NOW();
END;
$function$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.add_pantry_item(text, numeric, text, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.add_pantry_item(text, numeric, text, boolean) TO authenticated;
