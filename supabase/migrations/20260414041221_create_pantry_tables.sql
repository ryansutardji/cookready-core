/*
  # Create Pantry Tables

  1. New Tables
    - `pantry_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - ingredient name
      - `category` (text) - e.g. Proteins, Vegetables, Grains
      - `quantity` (numeric) - current quantity
      - `unit` (text) - e.g. cups, lbs, oz
      - `human_readable_inventory` (text) - e.g. "2.5 cups"
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_pantry_snapshot` (view)
      - A view over pantry_items filtered by the current user
      - Exposes name, category, human_readable_inventory

  2. Security
    - Enable RLS on pantry_items
    - Users can only read/write their own items
*/

CREATE TABLE IF NOT EXISTS pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  human_readable_inventory text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own pantry items"
  ON pantry_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items"
  ON pantry_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items"
  ON pantry_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items"
  ON pantry_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON pantry_items(user_id);

CREATE OR REPLACE VIEW ai_pantry_snapshot AS
  SELECT name, category, human_readable_inventory
  FROM pantry_items
  WHERE user_id = auth.uid();
