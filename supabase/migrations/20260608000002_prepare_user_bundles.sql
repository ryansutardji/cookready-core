/*
  # Prepare User Bundles

  ## Summary
  Future-proofs the bundles schema for user-created bundles, matching the
  pattern used on the ingredients table where:
    - user_id IS NULL  = system/universal row (existing bundles, untouched)
    - user_id = <uuid> = user-owned row (future feature)

  No UI is being built — this is DB-layer prep only.

  ## Changes
  1. Add user_id column to bundles (nullable, FK to auth.users)
  2. Replace the read-only RLS policies on both tables with policies that
     scope read access to system rows + the user's own rows, and grant
     write access only to user-owned rows.

  ## Rollback
  -- Re-drop new policies, re-add old read-only policies, remove column:
  DROP POLICY IF EXISTS "users can read system and own bundles" ON bundles;
  DROP POLICY IF EXISTS "users can insert own bundles" ON bundles;
  DROP POLICY IF EXISTS "users can update own bundles" ON bundles;
  DROP POLICY IF EXISTS "users can delete own bundles" ON bundles;
  DROP POLICY IF EXISTS "users can read bundle_ingredients for system and own bundles" ON bundle_ingredients;
  DROP POLICY IF EXISTS "users can insert bundle_ingredients for own bundles" ON bundle_ingredients;
  DROP POLICY IF EXISTS "users can update bundle_ingredients for own bundles" ON bundle_ingredients;
  DROP POLICY IF EXISTS "users can delete bundle_ingredients for own bundles" ON bundle_ingredients;
  CREATE POLICY "authenticated users can read bundles"
    ON bundles FOR SELECT TO authenticated USING (true);
  CREATE POLICY "authenticated users can read bundle_ingredients"
    ON bundle_ingredients FOR SELECT TO authenticated USING (true);
  ALTER TABLE bundles DROP COLUMN user_id;
*/

-- ============================================================
-- Step 1: Add user_id column to bundles
-- ============================================================
-- Nullable so all existing system rows remain user_id = NULL with no backfill.

ALTER TABLE bundles
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- Step 2: Drop existing RLS policies
-- ============================================================
-- Policy names are exactly as defined in 20260601000000_create_bundle_tables.sql.

DROP POLICY "authenticated users can read bundles"            ON bundles;
DROP POLICY "authenticated users can read bundle_ingredients" ON bundle_ingredients;

-- ============================================================
-- Step 3: Add new RLS policies
-- ============================================================

-- bundles: SELECT — system rows (user_id IS NULL) are visible to all authenticated users;
--          user-owned rows are visible only to their owner.
CREATE POLICY "users can read system and own bundles"
  ON bundles FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- bundles: INSERT/UPDATE/DELETE — only the row owner may mutate their own bundles.
CREATE POLICY "users can insert own bundles"
  ON bundles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own bundles"
  ON bundles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users can delete own bundles"
  ON bundles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- bundle_ingredients: SELECT — visible when the parent bundle is a system row
--                    or belongs to the current user.
CREATE POLICY "users can read bundle_ingredients for system and own bundles"
  ON bundle_ingredients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles b
      WHERE b.id = bundle_id
        AND (b.user_id IS NULL OR b.user_id = auth.uid())
    )
  );

-- bundle_ingredients: INSERT/UPDATE/DELETE — only allowed when the parent bundle
--                    is owned by the current user (system bundles are immutable).
CREATE POLICY "users can insert bundle_ingredients for own bundles"
  ON bundle_ingredients FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bundles b
      WHERE b.id = bundle_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "users can update bundle_ingredients for own bundles"
  ON bundle_ingredients FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles b
      WHERE b.id = bundle_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "users can delete bundle_ingredients for own bundles"
  ON bundle_ingredients FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles b
      WHERE b.id = bundle_id
        AND b.user_id = auth.uid()
    )
  );
