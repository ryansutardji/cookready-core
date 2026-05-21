/*
  # Rename onboarding_completed to has_completed_onboarding

  1. Changes
    - `profiles` table: rename column `onboarding_completed` → `has_completed_onboarding`
      to follow the convention that all boolean fields start with "is" or "has"

  2. Notes
    - Uses a safe rename (no data loss, no type change)
    - Default value and NOT NULL constraint are preserved
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN onboarding_completed TO has_completed_onboarding;
  END IF;
END $$;
