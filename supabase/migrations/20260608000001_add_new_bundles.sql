/*
  # Add New Bundles

  ## Summary
  Inserts 4 new bundles and their 29 bundle_ingredients into the tables
  created in 20260601000000.

  ## Bundles
  6. Indian Spice Cabinet  (8 ingredients)
  7. French Bistro Pantry  (7 ingredients)
  8. Grain Bowl Builder    (7 ingredients)
  9. Japanese Kitchen      (7 ingredients)

  Total new bundle_ingredients: 29
  Grand total after migration: 72

  ## Rollback
  DELETE FROM bundles
  WHERE id IN ('indian-spice-cabinet', 'french-bistro', 'grain-bowl-builder', 'japanese-kitchen');
  -- bundle_ingredients cascade-deleted via ON DELETE CASCADE
*/

-- ============================================================
-- 1. Insert bundles
-- ============================================================

INSERT INTO bundles (id, name, description, tag, icon, color, sort_order) VALUES
  ('indian-spice-cabinet', 'Indian Spice Cabinet', 'The foundational spices for a rich Indian pantry.',                  'Cuisine', '🪔', '#C89118', 6),
  ('french-bistro',        'French Bistro Pantry', 'Classic condiments and aromatics for French-inspired cooking.',      'Cuisine', '🥐', '#3A5F8A', 7),
  ('grain-bowl-builder',   'Grain Bowl Builder',   'Nutrient-rich grains and legumes for wholesome, flexible bowl meals.', 'Everyday', '🌾', '#6B7A4A', 8),
  ('japanese-kitchen',     'Japanese Kitchen',     'The essential pantry for umami-rich Japanese home cooking.',         'Cuisine', '🍜', '#8B1A3A', 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Bundle ingredients
-- Each INSERT uses: SELECT id FROM ingredients WHERE name = '...' AND user_id IS NULL
-- A name miss returns NULL which violates the NOT NULL FK → immediate visible error.
-- ============================================================

-- ============================================================
-- 2a. Indian Spice Cabinet (8)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 0 FROM ingredients WHERE name = 'Turmeric (Ground)'                    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 1 FROM ingredients WHERE name = 'Garam Masala'                         AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 2 FROM ingredients WHERE name = 'Coriander (Ground)'                   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 3 FROM ingredients WHERE name = 'Cardamom (Ground)'                    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 4 FROM ingredients WHERE name = 'Cumin Seeds'                          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 5 FROM ingredients WHERE name = 'Mustard Seeds (Yellow)'               AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 6 FROM ingredients WHERE name = 'Kasuri Methi (Dried Fenugreek Leaves)' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'indian-spice-cabinet', id, 'jar', 7 FROM ingredients WHERE name = 'Asafoetida (Hing)'                    AND user_id IS NULL;

-- ============================================================
-- 2b. French Bistro Pantry (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'jar',       0 FROM ingredients WHERE name = 'Dijon Mustard'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'jar',       1 FROM ingredients WHERE name = 'Whole Grain Mustard'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'jar',       2 FROM ingredients WHERE name = 'Herbes de Provence'     AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'bag',       3 FROM ingredients WHERE name = 'Shallots'               AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'bottle',    4 FROM ingredients WHERE name = 'White Wine Vinegar'     AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'jar',       5 FROM ingredients WHERE name = 'Cornichons'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'french-bistro', id, 'container', 6 FROM ingredients WHERE name = 'Crème Fraîche'          AND user_id IS NULL;

-- ============================================================
-- 2c. Grain Bowl Builder (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'bag', 0 FROM ingredients WHERE name = 'Quinoa (White)'        AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'bag', 1 FROM ingredients WHERE name = 'Lentils (French/Puy)'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'bag', 2 FROM ingredients WHERE name = 'Lentils (Red)'         AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'bag', 3 FROM ingredients WHERE name = 'Farro'                 AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'bag', 4 FROM ingredients WHERE name = 'Bulgur Wheat'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'can', 5 FROM ingredients WHERE name = 'Canned Chickpeas'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'grain-bowl-builder', id, 'can', 6 FROM ingredients WHERE name = 'Black Beans (Canned)'  AND user_id IS NULL;

-- ============================================================
-- 2d. Japanese Kitchen (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'tub',    0 FROM ingredients WHERE name = 'White Miso Paste'            AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'bag',    1 FROM ingredients WHERE name = 'Bonito Flakes (Katsuobushi)' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'jar',    2 FROM ingredients WHERE name = 'Shichimi Togarashi'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'bottle', 3 FROM ingredients WHERE name = 'Sake'                        AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'pack',   4 FROM ingredients WHERE name = 'Nori Sheets'                 AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'bottle', 5 FROM ingredients WHERE name = 'Mirin'                       AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'japanese-kitchen', id, 'jar',    6 FROM ingredients WHERE name = 'Dashi Powder'                AND user_id IS NULL;

-- ============================================================
-- 3. Assertion: exactly 72 total bundle_ingredient rows
-- ============================================================
-- 43 existing + 8 (Indian) + 7 (French) + 7 (Grain) + 7 (Japanese) = 72

DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM bundle_ingredients) = 72,
    'Expected 72 total bundle_ingredient rows — check ingredient names against the ingredients table';
END $$;
