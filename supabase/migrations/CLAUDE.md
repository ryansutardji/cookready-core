# Supabase Migrations

## Immutability Rule
- NEVER edit an existing migration file — Supabase tracks checksums and will error on mismatch.
- All changes go in a new file: `supabase migration new <description>`.

## Known Gap — Missing RPC Functions
- `add_pantry_item()` and `deplete_pantry_item()` are called throughout the app but are NOT
  in any migration. They exist directly in the Supabase project.
- To modify them, add a new migration with `CREATE OR REPLACE FUNCTION`.

## Unit Conversions
- Every `preferred_unit` on an ingredient must have a matching row in `unit_conversions` where `input_unit = preferred_unit` and `output_unit = base_unit`.
- When adding a new ingredient with a non-base preferred_unit, always include the conversion INSERT in the same migration.

## RLS
- `SECURITY DEFINER` on RPCs that cross RLS boundaries — see `check_recipe_cookability`, `delete_own_account`.
