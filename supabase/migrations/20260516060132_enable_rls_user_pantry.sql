/*
  # Enable RLS on user_pantry and add per-user policies

  ## Problem
  RLS was disabled on `user_pantry`, meaning any authenticated user could
  read, insert, update, and delete any other user's pantry rows.

  ## Changes
  1. Enable RLS on `user_pantry`
  2. SELECT: users can only read their own rows
  3. INSERT: users can only insert rows for themselves
  4. UPDATE: users can only update their own rows
  5. DELETE: users can only delete their own rows
*/

ALTER TABLE user_pantry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pantry"
  ON user_pantry
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry"
  ON user_pantry
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry"
  ON user_pantry
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry"
  ON user_pantry
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
