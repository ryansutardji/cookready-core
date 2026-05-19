/*
  # Create profiles table synced to auth.users

  ## Summary
  Creates a public.profiles table that mirrors essential fields from auth.users,
  kept in sync automatically via database triggers.

  ## New Tables

  ### profiles
  - `id` (uuid, primary key) - references auth.users(id), cascades on delete
  - `last_sign_in_at` (timestamptz) - synced from auth.users on insert and update
  - `created_at` (timestamptz) - set at row creation
  - `updated_at` (timestamptz) - updated automatically on any row change

  ## Triggers

  ### handle_new_user (AFTER INSERT on auth.users)
  - Inserts a new profiles row when a user signs up
  - Copies id and last_sign_in_at from the new auth.users row

  ### handle_user_update (AFTER UPDATE on auth.users)
  - Syncs last_sign_in_at into profiles whenever the auth.users row changes
  - Keeps login time accurate across subsequent sign-ins

  ## Security

  - RLS enabled on profiles
  - SELECT policy: authenticated users can only read their own row
  - UPDATE policy: authenticated users can only update their own row
  - No policy exists for other users to read any profile row

  ## Notes

  1. Email is intentionally excluded — it is available via supabase.auth.getUser() on the client and does not need to be duplicated here
  2. ON DELETE CASCADE ensures profiles rows are cleaned up if the auth user is deleted
  3. Backfill inserts profiles rows for any existing auth.users not yet represented
*/

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- UPDATE: users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function: insert profile row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, last_sign_in_at)
  VALUES (NEW.id, NEW.last_sign_in_at);
  RETURN NEW;
END;
$$;

-- Trigger: fire handle_new_user after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: sync last_sign_in_at on user update
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger: fire handle_user_update after update on auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Backfill: insert profiles for existing users not yet represented
INSERT INTO public.profiles (id, last_sign_in_at)
SELECT id, last_sign_in_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
