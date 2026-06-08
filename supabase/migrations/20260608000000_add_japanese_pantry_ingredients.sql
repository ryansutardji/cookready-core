/*
  # Add Japanese Pantry Ingredients

  Inserts 3 universal ingredients used by the Japanese Kitchen bundle.
  Uses INSERT ... ON CONFLICT DO NOTHING so the migration is idempotent
  if any rows were already inserted directly on the remote.

    - White Miso Paste:             preferred_unit = 'tub', 1 tub = 500 g
    - Bonito Flakes (Katsuobushi):  preferred_unit = 'bag', 1 bag = 40 g
    - Shichimi Togarashi:           preferred_unit = 'jar', 1 jar = 50 g

  All rows: category = 'Spice/Sauce', base_unit = 'g', user_id = NULL (universal).

  ## Rollback
  DELETE FROM ingredients
  WHERE name IN ('White Miso Paste', 'Bonito Flakes (Katsuobushi)', 'Shichimi Togarashi')
  AND user_id IS NULL;
*/

-- Insert ingredients; skip silently if a row already exists (idempotent).
INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('White Miso Paste',             'Spice/Sauce', 'g', 'tub'),
  ('Bonito Flakes (Katsuobushi)',  'Spice/Sauce', 'g', 'bag'),
  ('Shichimi Togarashi',           'Spice/Sauce', 'g', 'jar')
ON CONFLICT (name) DO NOTHING;

-- Insert unit_conversions only for rows that don't already have one.
-- This handles partial state (e.g. ingredient exists but conversion was missed).
INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
SELECT
  i.id,
  i.preferred_unit,
  CASE i.name
    WHEN 'White Miso Paste'            THEN 500
    WHEN 'Bonito Flakes (Katsuobushi)' THEN 40
    WHEN 'Shichimi Togarashi'          THEN 50
  END,
  'g'
FROM ingredients i
WHERE i.name IN ('White Miso Paste', 'Bonito Flakes (Katsuobushi)', 'Shichimi Togarashi')
  AND i.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM unit_conversions uc
    WHERE uc.ingredient_id = i.id
  );

-- Verify: all 3 rows exist (whether inserted now or already present)
DO $$ BEGIN
  ASSERT (
    SELECT COUNT(*) FROM ingredients
    WHERE name IN (
      'White Miso Paste',
      'Bonito Flakes (Katsuobushi)',
      'Shichimi Togarashi'
    ) AND user_id IS NULL
  ) = 3,
  'Expected 3 Japanese pantry ingredient rows';
END $$;
