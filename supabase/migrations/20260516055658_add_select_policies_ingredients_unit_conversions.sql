/*
  # Add SELECT RLS policies for ingredients and unit_conversions

  ## Problem
  The `ingredients` table only had an INSERT policy — no SELECT policy.
  `unit_conversions` had no policies at all.
  RLS was blocking authenticated users from reading these tables, causing
  the pantry join to return null for ingredient names and categories.

  ## Changes
  1. Add SELECT policy on `ingredients` for authenticated users (shared reference data)
  2. Enable RLS on `unit_conversions` if not already enabled
  3. Add SELECT policy on `unit_conversions` for authenticated users
*/

CREATE POLICY "Authenticated users can read ingredients"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE unit_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read unit conversions"
  ON unit_conversions
  FOR SELECT
  TO authenticated
  USING (true);
