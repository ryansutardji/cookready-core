/*
  # Fix user_pantry foreign key to cascade on delete

  1. Changes
    - `user_pantry` table: drop the existing `user_pantry_user_id_fkey` constraint
      and re-add it with ON DELETE CASCADE so that deleting an auth user
      automatically removes their pantry rows.

  2. Notes
    - No data is lost — only the constraint behavior changes
    - All other user-referencing tables already have ON DELETE CASCADE
*/

ALTER TABLE public.user_pantry
  DROP CONSTRAINT IF EXISTS user_pantry_user_id_fkey;

ALTER TABLE public.user_pantry
  ADD CONSTRAINT user_pantry_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
