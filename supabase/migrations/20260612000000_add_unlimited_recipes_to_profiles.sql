ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unlimited_recipes boolean NOT NULL DEFAULT false;
