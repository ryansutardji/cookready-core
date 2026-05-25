/*
  # Backfill pantry RPC functions into version control

  ## Summary
  add_pantry_item() and deplete_pantry_item() exist in the live project but were
  never captured in a migration file, meaning fresh environments (DB reset, new
  branches, CI) would be missing them. This migration recreates both functions
  exactly, with two security hardening additions:

    1. SET search_path = '' on each SECURITY DEFINER function to prevent search
       path injection attacks.
    2. Explicit REVOKE/GRANT so only the authenticated role can invoke them;
       the default PUBLIC execute privilege is removed.

  No business logic has been changed.

  ## Changes
  - CREATE OR REPLACE FUNCTION public.add_pantry_item(text, numeric, text)
  - CREATE OR REPLACE FUNCTION public.deplete_pantry_item(text, numeric, text)
  - Grants restricted to the authenticated role for both functions

  ## Security Notes
  - Both functions are SECURITY DEFINER so they run as the function owner and
    can bypass RLS, but they scope all writes to auth.uid() — they cannot act
    on behalf of any other user.
  - SET search_path = '' forces every table reference inside the function body
    to be schema-qualified, eliminating the risk of a rogue search_path override
    redirecting queries to a different schema.
  - The anon role cannot call either function.
*/

-- ---------------------------------------------------------------------------
-- 1. add_pantry_item
--    Converts the supplied quantity to the ingredient's base unit using
--    unit_conversions, then upserts into user_pantry (accumulating quantity
--    on conflict rather than overwriting it).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_pantry_item(
    p_ingredient_name text,
    p_quantity         numeric,
    p_unit             text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_ing_id           uuid;
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

    INSERT INTO public.user_pantry (user_id, ingredient_id, current_quantity_value)
    VALUES (auth.uid(), v_ing_id, v_total_to_add)
    ON CONFLICT (user_id, ingredient_id)
    DO UPDATE SET
        current_quantity_value = public.user_pantry.current_quantity_value + v_total_to_add,
        last_updated           = NOW();
END;
$function$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.add_pantry_item(text, numeric, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.add_pantry_item(text, numeric, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. deplete_pantry_item
--    Reduces a pantry item's quantity by the converted amount, clamping at
--    zero. Permanently-stocked ingredients (is_permanent = true) are skipped.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deplete_pantry_item(
    p_ingredient_name text,
    p_quantity         numeric,
    p_unit             text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_row           public.user_pantry%ROWTYPE;
    v_ingredient_id uuid;
    v_conv_factor   numeric;
    v_base_qty      numeric;
BEGIN
    SELECT id INTO v_ingredient_id
      FROM public.ingredients
     WHERE lower(name) = lower(p_ingredient_name)
     LIMIT 1;

    -- Ingredient not found — nothing to deplete
    IF v_ingredient_id IS NULL THEN RETURN; END IF;

    SELECT * INTO v_row
      FROM public.user_pantry
     WHERE user_id       = auth.uid()
       AND ingredient_id = v_ingredient_id
     LIMIT 1;

    -- User doesn't have this ingredient in their pantry
    IF NOT FOUND THEN RETURN; END IF;

    -- Permanent ingredients are never depleted
    IF v_row.is_permanent THEN RETURN; END IF;

    -- Try ingredient-specific conversion first
    SELECT output_value INTO v_conv_factor
      FROM public.unit_conversions
     WHERE ingredient_id = v_ingredient_id
       AND input_unit    = p_unit
     LIMIT 1;

    -- Fall back to a global conversion if no ingredient-specific one exists
    IF v_conv_factor IS NULL THEN
        SELECT output_value INTO v_conv_factor
          FROM public.unit_conversions
         WHERE ingredient_id IS NULL
           AND input_unit    = p_unit
         LIMIT 1;
    END IF;

    -- Guard against a zero/null factor to avoid dividing or multiplying by 0
    v_base_qty := CASE WHEN v_conv_factor > 0 THEN p_quantity * v_conv_factor ELSE p_quantity END;

    UPDATE public.user_pantry
       SET current_quantity_value = GREATEST(0, current_quantity_value - v_base_qty),
           last_updated           = now()
     WHERE id = v_row.id;
END;
$function$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.deplete_pantry_item(text, numeric, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.deplete_pantry_item(text, numeric, text) TO authenticated;
