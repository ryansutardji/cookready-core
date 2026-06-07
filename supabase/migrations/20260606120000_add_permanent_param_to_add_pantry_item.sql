/*
  # Extend add_pantry_item with p_is_permanent parameter

  ## Summary
  Adds a `p_is_permanent boolean DEFAULT false` parameter to add_pantry_item().
  This allows callers to pin an item at insert time (e.g. when adding from the
  ingredient browser with the pin toggle enabled).

  ## Changes
  - CREATE OR REPLACE FUNCTION public.add_pantry_item(text, numeric, text, boolean)
    - New INSERT includes is_permanent column
    - ON CONFLICT UPDATE sets is_permanent via OR logic:
        is_permanent = existing OR p_is_permanent
      This means passing true always pins; passing false (default) preserves
      whatever value is already stored, so adding more quantity cannot unpin
      an item that was previously pinned.
  - REVOKE/GRANT updated to cover the new 4-argument overload

  ## Backward compatibility
  The old 3-argument signature (text, numeric, text) is replaced by this
  4-argument signature with a DEFAULT. Existing callers that omit the fourth
  argument continue to work because PostgreSQL resolves the default at call time.
  The REVOKE/GRANT statements use the new full signature so that only
  authenticated users can call it.
*/

-- ---------------------------------------------------------------------------
-- add_pantry_item (extended)
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

    -- Prefer an ingredient-specific conversion; fall back to a global one
    SELECT output_value INTO v_conversion_factor
      FROM public.unit_conversions
     WHERE (ingredient_id = v_ing_id OR ingredient_id IS NULL)
       AND input_unit = p_unit
     ORDER BY ingredient_id DESC  -- ingredient-specific rows sort before NULL
     LIMIT 1;

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
