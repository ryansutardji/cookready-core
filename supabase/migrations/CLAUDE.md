# Supabase Migrations

## Immutability Rule
- NEVER edit an existing migration file — Supabase tracks checksums and will error on mismatch.
- All changes go in a new file: `supabase migration new <description>`.

## Known Gap — Missing RPC Functions
- `add_pantry_item()` and `deplete_pantry_item()` are called throughout the app but are NOT
  in any migration. They exist directly in the Supabase project.
- To modify them, add a new migration with `CREATE OR REPLACE FUNCTION`.

## Unit Conversions
- See root CLAUDE.md — always keep `unit_conversions.input_unit` in sync with `preferred_unit`.

## RLS
- `SECURITY DEFINER` on RPCs that cross RLS boundaries — see `check_recipe_cookability`, `delete_own_account`.
