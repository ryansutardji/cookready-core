/*
  # Add Common Bean & Legume Ingredients

  Inserts 25 missing bean/legume ingredients following the established pattern:
    - Canned: preferred_unit = 'can',  1 can  = 400 g
    - Dried:  preferred_unit = 'bag',  1 bag  = 500 g
    - category = 'Pantry', base_unit = 'g', user_id = NULL (universal)

  Existing bean entries untouched: Canned Chickpeas, Dried Chickpeas,
  Mung Beans (Dried), Edamame, Fermented Black Beans.
*/

WITH inserted AS (
  INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
    ('Black Beans (Dried)',           'Pantry', 'g', 'bag'),
    ('Black Beans (Canned)',          'Pantry', 'g', 'can'),
    ('Kidney Beans (Dried)',          'Pantry', 'g', 'bag'),
    ('Kidney Beans (Canned)',         'Pantry', 'g', 'can'),
    ('Pinto Beans (Dried)',           'Pantry', 'g', 'bag'),
    ('Pinto Beans (Canned)',          'Pantry', 'g', 'can'),
    ('Cannellini Beans (Dried)',      'Pantry', 'g', 'bag'),
    ('Cannellini Beans (Canned)',     'Pantry', 'g', 'can'),
    ('Navy Beans (Dried)',            'Pantry', 'g', 'bag'),
    ('Navy Beans (Canned)',           'Pantry', 'g', 'can'),
    ('Great Northern Beans (Dried)',  'Pantry', 'g', 'bag'),
    ('Great Northern Beans (Canned)', 'Pantry', 'g', 'can'),
    ('Lima Beans (Dried)',            'Pantry', 'g', 'bag'),
    ('Lima Beans (Canned)',           'Pantry', 'g', 'can'),
    ('Fava Beans (Dried)',            'Pantry', 'g', 'bag'),
    ('Fava Beans (Canned)',           'Pantry', 'g', 'can'),
    ('Adzuki Beans (Dried)',          'Pantry', 'g', 'bag'),
    ('Black-Eyed Peas (Dried)',       'Pantry', 'g', 'bag'),
    ('Black-Eyed Peas (Canned)',      'Pantry', 'g', 'can'),
    ('Lentils (Brown)',               'Pantry', 'g', 'bag'),
    ('Lentils (Green)',               'Pantry', 'g', 'bag'),
    ('Lentils (Red)',                 'Pantry', 'g', 'bag'),
    ('Lentils (French/Puy)',          'Pantry', 'g', 'bag'),
    ('Split Peas (Green)',            'Pantry', 'g', 'bag'),
    ('Split Peas (Yellow)',           'Pantry', 'g', 'bag')
  RETURNING id, preferred_unit
)
INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
SELECT
  id,
  preferred_unit,
  CASE preferred_unit WHEN 'can' THEN 400 WHEN 'bag' THEN 500 END,
  'g'
FROM inserted;

-- Verify: exactly 25 new ingredients were created
DO $$ BEGIN
  ASSERT (
    SELECT COUNT(*) FROM ingredients
    WHERE name IN (
      'Black Beans (Dried)', 'Black Beans (Canned)',
      'Kidney Beans (Dried)', 'Kidney Beans (Canned)',
      'Pinto Beans (Dried)', 'Pinto Beans (Canned)',
      'Cannellini Beans (Dried)', 'Cannellini Beans (Canned)',
      'Navy Beans (Dried)', 'Navy Beans (Canned)',
      'Great Northern Beans (Dried)', 'Great Northern Beans (Canned)',
      'Lima Beans (Dried)', 'Lima Beans (Canned)',
      'Fava Beans (Dried)', 'Fava Beans (Canned)',
      'Adzuki Beans (Dried)',
      'Black-Eyed Peas (Dried)', 'Black-Eyed Peas (Canned)',
      'Lentils (Brown)', 'Lentils (Green)', 'Lentils (Red)', 'Lentils (French/Puy)',
      'Split Peas (Green)', 'Split Peas (Yellow)'
    ) AND user_id IS NULL
  ) = 25,
  'Expected 25 new bean/legume ingredient rows';
END $$;
