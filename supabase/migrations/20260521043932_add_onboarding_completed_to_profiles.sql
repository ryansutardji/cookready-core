/*
  # Add onboarding_completed to profiles

  1. Changes
    - `profiles` table: add `onboarding_completed` boolean column (default false)
      Users who finish the onboarding flow get this set to true.
      Existing users default to false — they will see onboarding on next login,
      but since their pantry already has items the app will skip Screen 1 and
      resume at Screen 2.

  2. Notes
    - No RLS changes needed; existing profiles policies already cover this column.
    - Safe to run multiple times (IF NOT EXISTS guard).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;
