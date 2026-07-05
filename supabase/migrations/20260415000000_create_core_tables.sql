/*
  # Create core reference and pantry tables

  Establishes the three tables that were created directly in production
  and never captured in migration files:

    - ingredients       — universal and user-private ingredient catalog
    - unit_conversions  — maps preferred_unit → base_unit with a numeric factor
    - user_pantry       — per-user inventory tracking

  Also replaces the ai_pantry_snapshot view (originally pointed at the legacy
  pantry_items table) to use user_pantry + ingredients and expose the
  raw_weight_or_count column required by check_recipe_cookability (20260524180000).

  ## Design notes

  unit_conversions.ingredient_id has no FK reference constraint.  This prevents
  a migration error in 20260524180000, which inserts a row using a hardcoded
  production UUID for Swordfish.  That UUID will differ locally (ingredients get
  new UUIDs from gen_random_uuid()), so a FK constraint would reject the INSERT.
  The orphaned row is harmless — all RPC functions look up conversions by joining
  on the locally-generated ingredient UUID from the ingredients table.

  RLS on unit_conversions is enabled by 20260516055658.
  RLS on user_pantry is enabled by 20260516060132.
  user_pantry.user_id gains ON DELETE CASCADE via 20260521054431.
  ingredients.user_id column is added by 20260522215329.
*/

-- ── 1. ingredients ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingredients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  category       text NOT NULL CHECK (category = ANY (ARRAY[
                   'Protein','Vegetable','Fruit','Grain',
                   'Oil','Fat','Dairy','Baking','Spice/Sauce','Pantry'
                 ])),
  base_unit      text NOT NULL,
  preferred_unit text NOT NULL,
  CONSTRAINT ingredients_name_key UNIQUE (name)
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Initial INSERT policy — 20260522215329 replaces this with a user-scoped one
-- once the user_id column is added.
CREATE POLICY "Authenticated users can add net new ingredients"
  ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── 2. unit_conversions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS unit_conversions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id  uuid,
  input_unit     text NOT NULL,
  output_value   numeric NOT NULL,
  output_unit    text NOT NULL
);

-- ── 3. user_pantry ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_pantry (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id),
  ingredient_id          uuid REFERENCES ingredients(id),
  current_quantity_value numeric DEFAULT 0,
  last_updated           timestamptz DEFAULT now(),
  is_permanent           boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, ingredient_id)
);

-- ── 4. ai_pantry_snapshot view ───────────────────────────────────────────────

-- Replace the legacy pantry_items-based view with one backed by user_pantry
-- and ingredients.  raw_weight_or_count exposes current_quantity_value (in base
-- units) and is read by check_recipe_cookability and get_recipe_ingredient_statuses.
-- DROP + CREATE required because CREATE OR REPLACE cannot rename existing columns.
DROP VIEW IF EXISTS ai_pantry_snapshot;
CREATE VIEW ai_pantry_snapshot AS
  SELECT
    i.name,
    i.category,
    up.current_quantity_value                              AS raw_weight_or_count,
    up.current_quantity_value::text || ' ' || i.base_unit  AS human_readable_inventory
  FROM user_pantry up
  JOIN ingredients i ON up.ingredient_id = i.id
  WHERE up.user_id = auth.uid();
