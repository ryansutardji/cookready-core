/*
  # Add user_id to ingredients and unit_conversions for user-created ingredients

  ## Summary
  This migration supports a "net new ingredient" flow where users can add custom
  ingredients that don't exist in the universal database. These user-created rows
  are scoped to the creating user so they don't pollute shared reference data.

  ## Changes

  ### 1. ingredients table
  - Add nullable `user_id` column (FK → auth.users ON DELETE CASCADE)
  - NULL = universal ingredient visible to all authenticated users
  - UUID = private ingredient visible only to that user
  - Add index on user_id for efficient per-user filtering
  - Drop the overly-permissive SELECT policy (USING (true)) and replace with one
    that allows reading universal rows AND the user's own private rows
  - Drop the existing INSERT policy and replace with one requiring the row's
    user_id to match the inserting user

  ### 2. unit_conversions table
  - Add INSERT policy so users can add conversions for their own custom ingredients
    (verified via a join back to ingredients.user_id)

  ## Security Notes
  - Universal ingredients (user_id IS NULL) remain readable by all authenticated users
  - Private ingredients are only readable by their creator
  - Users cannot insert a private ingredient on behalf of another user
  - Users can only insert unit_conversions for ingredients they own
*/

-- 1. Add user_id column to ingredients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE ingredients
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ingredients_user_id_idx ON ingredients(user_id);

-- 2. Replace SELECT policy to scope user-private rows
DROP POLICY IF EXISTS "Authenticated users can read ingredients" ON ingredients;

CREATE POLICY "Authenticated users can read ingredients"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- 3. Replace INSERT policy to enforce user_id ownership
DROP POLICY IF EXISTS "Authenticated users can add net new ingredients" ON ingredients;

CREATE POLICY "Users can insert own custom ingredients"
  ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Add INSERT policy on unit_conversions for user-owned ingredient conversions
CREATE POLICY "Users can insert conversions for own ingredients"
  ON unit_conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ingredient_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM ingredients
      WHERE ingredients.id = ingredient_id
        AND ingredients.user_id = auth.uid()
    )
  );
