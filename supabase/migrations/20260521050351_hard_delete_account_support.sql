/*
  # Hard delete account support

  1. Changes
    - `profiles`: add ON DELETE CASCADE FK to auth.users (deletes profile when auth user deleted)
    - `user_pantry`: add ON DELETE CASCADE FK to auth.users (deletes all pantry rows when auth user deleted)
    - `saved_recipes`: add ON DELETE CASCADE FK to auth.users (deletes all saved recipes when auth user deleted)
    - Create `delete_own_account()` RPC function: SECURITY DEFINER function that allows an
      authenticated user to delete their own row from auth.users, triggering all cascades

  2. Security
    - `delete_own_account` only deletes the row matching `auth.uid()` — no other user can be deleted
    - Function is owned by postgres (superuser) via SECURITY DEFINER so it can touch auth.users
    - Granted EXECUTE to authenticated role only

  3. Notes
    - All three tables already have user_id / id columns of type uuid referencing auth.users
      but without explicit FK constraints. We add them here with IF NOT EXISTS guards.
    - profiles.id IS the auth user id (not a separate user_id column).
*/

-- profiles: id = auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
      AND table_name = 'profiles'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- user_pantry: user_id = auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_pantry_user_id_fkey'
      AND table_name = 'user_pantry'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_pantry
      ADD CONSTRAINT user_pantry_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- saved_recipes: user_id = auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'saved_recipes_user_id_fkey'
      AND table_name = 'saved_recipes'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.saved_recipes
      ADD CONSTRAINT saved_recipes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RPC: delete_own_account
-- SECURITY DEFINER runs as the function owner (postgres) which can delete from auth.users.
-- The WHERE clause locks it to the calling user's uid so it cannot delete anyone else.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
