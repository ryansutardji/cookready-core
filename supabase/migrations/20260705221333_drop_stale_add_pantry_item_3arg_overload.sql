/*
  # Drop stale 3-arg overload of add_pantry_item

  ## Summary
  add_pantry_item() currently has two coexisting overloads:
    - public.add_pantry_item(text, numeric, text)
        from 20260524120000_backfill_pantry_rpc_functions.sql
    - public.add_pantry_item(text, numeric, text, boolean DEFAULT false)
        from 20260606120000_add_permanent_param_to_add_pantry_item.sql

  Postgres treats different arity as a distinct function signature, so the
  CREATE OR REPLACE in the second migration added a second overload rather
  than replacing the first. PostgREST resolves an RPC call by matching the
  exact set of named JSON keys supplied against candidate signatures, so any
  caller that omits `p_is_permanent` resolves to the stale 3-arg version
  instead of the 4-arg version's default. Today this happens to produce the
  same behavior (both default is_permanent to false), but it's a correctness
  footgun: any future change to the 3-arg body (or removal of the parallel
  maintenance burden) could silently diverge from the 4-arg version.

  ## Verification before writing this migration
  Grepped app/ and components/ for `supabase.rpc('add_pantry_item'` — 4 call
  sites found (app/(onboarding)/build-pantry.tsx x2, components/SmartAddBar.tsx
  x2, components/BundleSheet.tsx x1). Only one call site
  (components/SmartAddBar.tsx handleSave) passes `p_is_permanent` explicitly;
  the rest omit it. All of these resolve correctly against the 4-arg
  signature's DEFAULT false once the 3-arg overload is removed, so dropping it
  is safe and does not change behavior for any current caller.

  ## Changes
  - DROP FUNCTION public.add_pantry_item(text, numeric, text) — the stale
    3-arg overload. The 4-arg overload (text, numeric, text, boolean) is left
    untouched and becomes the sole implementation.

  ## Rollback
  To restore the 3-arg overload, re-run the CREATE OR REPLACE FUNCTION body
  from 20260524120000_backfill_pantry_rpc_functions.sql (do not edit that
  file — copy its body into a new migration if this ever needs reverting).
*/

DROP FUNCTION IF EXISTS public.add_pantry_item(text, numeric, text);
