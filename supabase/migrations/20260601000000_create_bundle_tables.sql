/*
  # Create Bundle Tables

  ## Summary
  Moves bundle management from hardcoded TypeScript (lib/bundles.ts) into Supabase
  so bundles can be managed in the database without code deploys.

  ## Tables

  ### bundles
  - id          text PRIMARY KEY (slug, e.g. 'seasoning-staples')
  - name        text
  - description text
  - tag         text  (e.g. 'Everyday', 'Cuisine', 'Project')
  - icon        text  (emoji)
  - color       text  (hex color)
  - sort_order  integer
  - created_at  timestamptz

  ### bundle_ingredients
  - id            uuid PK
  - bundle_id     text FK → bundles(id) ON DELETE CASCADE
  - ingredient_id uuid FK → ingredients(id) ON DELETE CASCADE
  - default_unit  text  (e.g. 'jar', 'bottle', 'can')
  - sort_order    integer

  ## Security
  Both tables are read-only for authenticated users (same pattern as universal ingredients).
  No write policies — bundles are managed by admins via migrations, not by end users.

  ## Rollback
  DROP TABLE IF EXISTS bundle_ingredients;
  DROP TABLE IF EXISTS bundles;
*/

-- ============================================================
-- Forward migration
-- ============================================================

CREATE TABLE bundles (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  tag         text NOT NULL,
  icon        text NOT NULL,
  color       text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE bundle_ingredients (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id     text REFERENCES bundles(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  default_unit  text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0
);

-- Index for the most common access pattern: fetch all ingredients for a bundle
CREATE INDEX bundle_ingredients_bundle_id_idx ON bundle_ingredients(bundle_id);

-- RLS: all authenticated users can read (same pattern as universal ingredients)
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read bundles"
  ON bundles FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated users can read bundle_ingredients"
  ON bundle_ingredients FOR SELECT TO authenticated USING (true);
