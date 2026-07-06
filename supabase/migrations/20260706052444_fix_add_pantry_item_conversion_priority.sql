/*
  # Fix add_pantry_item unit-conversion tiebreak bug

  ## Summary
  `add_pantry_item`'s single-query lookup:

      SELECT output_value INTO v_conversion_factor
        FROM public.unit_conversions
       WHERE (ingredient_id = v_ing_id OR ingredient_id IS NULL)
         AND input_unit = p_unit
       ORDER BY ingredient_id DESC  -- ingredient-specific rows sort before NULL
       LIMIT 1;

  was documented as preferring the ingredient-specific row over the global
  one, but Postgres's default null-ordering for `DESC` is `NULLS FIRST` — so
  this actually preferred the *global* (`ingredient_id IS NULL`) row on a tie,
  the opposite of the inline comment's claim.

  ## Changes
  Replaces the single ORDER BY/LIMIT query with two explicit steps, matching
  `deplete_pantry_item`'s existing pattern:
    1. Look up an ingredient-specific conversion row first.
    2. Only if none is found, fall back to the global (`ingredient_id IS
       NULL`) row.

  ## Provenance
  This fix was shipped directly to production on 2026-07-06 via the Supabase
  MCP `apply_migration` tool (registered on prod under this exact version,
  `20260706052444`) before this local file existed. This migration reproduces
  the live production function body verbatim (pulled via
  `pg_get_functiondef`), backfilling the missing local git record so
  `supabase migration list` shows a 1:1 match for this version. See
  `supabase/CLAUDE.md` → "Migration History Divergence" for the full
  reconciliation history.

  No REVOKE/GRANT statements are included here — CREATE OR REPLACE FUNCTION
  preserves existing privileges on the object, and this migration is not
  intended to change grants.
*/

CREATE OR REPLACE FUNCTION public.add_pantry_item(p_ingredient_name text, p_quantity numeric, p_unit text, p_is_permanent boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
$function$
;
