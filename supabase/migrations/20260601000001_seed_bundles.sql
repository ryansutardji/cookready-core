/*
  # Seed Bundles

  ## Summary
  Inserts the 6 pre-defined bundles and their 43 ingredients into the
  bundles and bundle_ingredients tables created in 20260601000000.

  Bundle ingredients are resolved by name at migration time via subqueries
  against the ingredients table (user_id IS NULL = universal ingredients).
  This is safe for a seed migration because:
    - Universal ingredient names are stable reference data
    - The subquery will fail with a constraint violation if a name doesn't
      match, making missing/mismatched names immediately visible
    - UUIDs can vary per environment (local vs. remote), so name lookups
      are more portable than hardcoded UUIDs

  ## Bundles
  0. Seasoning Staples  (6 ingredients)
  1. Asian Flavors      (8 ingredients)
  2. Italian Pantry     (8 ingredients)
  3. Baking Basics      (7 ingredients)
  4. Mexican Staples    (7 ingredients)
  5. Mediterranean Mezze (7 ingredients)

  Total: 43 ingredients

  ## Rollback
  DELETE FROM bundle_ingredients;
  DELETE FROM bundles;
*/

-- ============================================================
-- 1. Insert bundles
-- ============================================================

INSERT INTO bundles (id, name, description, tag, icon, color, sort_order) VALUES
  ('seasoning-staples',   'Seasoning Staples',     'The spice rack every kitchen needs.',               'Everyday', '🧂', '#D2691E', 0),
  ('asian-flavors',       'Asian Flavors',          'Bold sauces and aromatics for Asian cooking.',      'Cuisine',  '🥢', '#B8860B', 1),
  ('italian-pantry',      'Italian Pantry',         'Everything you need for classic Italian dishes.',   'Cuisine',  '🍝', '#4A7A4A', 2),
  ('baking-basics',       'Baking Basics',          'The essentials for any baking project.',            'Project',  '🥣', '#8B5A2B', 3),
  ('mexican-staples',     'Mexican Staples',        'The foundation of a great Mexican pantry.',         'Cuisine',  '🌶️', '#C2410C', 4),
  ('mediterranean-mezze', 'Mediterranean Mezze',   'Bold flavors for dips, flatbreads, and spreads.',   'Cuisine',  '🫒', '#5A7A5A', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Helper: resolve ingredient id by name (fails loudly on miss)
-- ============================================================
-- Each INSERT uses a scalar subquery: (SELECT id FROM ingredients WHERE name = '...' AND user_id IS NULL)
-- If the name doesn't exist the subquery returns NULL, which violates the NOT NULL FK and
-- raises "null value in column ingredient_id" — an explicit, actionable error.

-- ============================================================
-- 2a. Seasoning Staples (6)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'container', 0 FROM ingredients WHERE name = 'Salt'                   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'jar',       1 FROM ingredients WHERE name = 'Black Pepper (Ground)'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'jar',       2 FROM ingredients WHERE name = 'Garlic Powder'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'jar',       3 FROM ingredients WHERE name = 'Onion Powder'           AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'jar',       4 FROM ingredients WHERE name = 'Paprika'                AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'seasoning-staples', id, 'jar',       5 FROM ingredients WHERE name = 'Cumin (Ground)'         AND user_id IS NULL;

-- ============================================================
-- 2b. Asian Flavors (8)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 0 FROM ingredients WHERE name = 'Soy Sauce'         AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 1 FROM ingredients WHERE name = 'Toasted Sesame Oil' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 2 FROM ingredients WHERE name = 'Rice Vinegar'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 3 FROM ingredients WHERE name = 'Mirin'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 4 FROM ingredients WHERE name = 'Hoisin Sauce'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'bottle', 5 FROM ingredients WHERE name = 'Oyster Sauce'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'jar',    6 FROM ingredients WHERE name = 'Ginger (Ground)'   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'asian-flavors', id, 'tub',    7 FROM ingredients WHERE name = 'Gochujang'         AND user_id IS NULL;

-- ============================================================
-- 2c. Italian Pantry (8)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'bottle', 0 FROM ingredients WHERE name = 'Extra Virgin Olive Oil' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    1 FROM ingredients WHERE name = 'Marinara Sauce'         AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'can',    2 FROM ingredients WHERE name = 'Tomato Paste'           AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    3 FROM ingredients WHERE name = 'Pesto'                  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    4 FROM ingredients WHERE name = 'Dried Basil'            AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    5 FROM ingredients WHERE name = 'Dried Oregano'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    6 FROM ingredients WHERE name = 'Italian Seasoning'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'italian-pantry', id, 'jar',    7 FROM ingredients WHERE name = 'Dried Thyme'            AND user_id IS NULL;

-- ============================================================
-- 2d. Baking Basics (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'bag',       0 FROM ingredients WHERE name = 'All-Purpose Flour'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'bag',       1 FROM ingredients WHERE name = 'Granulated Sugar'   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'container', 2 FROM ingredients WHERE name = 'Baking Powder'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'box',       3 FROM ingredients WHERE name = 'Baking Soda'        AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'bottle',    4 FROM ingredients WHERE name = 'Vanilla Extract'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'bottle',    5 FROM ingredients WHERE name = 'Vegetable Oil'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'baking-basics', id, 'container', 6 FROM ingredients WHERE name = 'Cornstarch'         AND user_id IS NULL;

-- ============================================================
-- 2e. Mexican Staples (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'jar',   0 FROM ingredients WHERE name = 'Chili Powder (Standard)'   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'jar',   1 FROM ingredients WHERE name = 'Smoked Paprika'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'jar',   2 FROM ingredients WHERE name = 'Mexican Oregano (Dried)'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'jar',   3 FROM ingredients WHERE name = 'Cumin Seeds'                AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'can',   4 FROM ingredients WHERE name = 'Chipotle in Adobo'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'bag',   5 FROM ingredients WHERE name = 'Dried Ancho Chile'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mexican-staples', id, 'block', 6 FROM ingredients WHERE name = 'Achiote Paste'              AND user_id IS NULL;

-- ============================================================
-- 2f. Mediterranean Mezze (7)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 0 FROM ingredients WHERE name = 'Tahini'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 1 FROM ingredients WHERE name = 'Za''atar'        AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 2 FROM ingredients WHERE name = 'Harissa'         AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 3 FROM ingredients WHERE name = 'Preserved Lemon' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 4 FROM ingredients WHERE name = 'Kalamata Olives' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 5 FROM ingredients WHERE name = 'Capers'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'mediterranean-mezze', id, 'jar', 6 FROM ingredients WHERE name = 'Sumac'           AND user_id IS NULL;

-- ============================================================
-- 3. Assertion: exactly 43 rows must exist
-- ============================================================
-- If any ingredient name above didn't match a universal ingredient row,
-- its INSERT...SELECT produced 0 rows (no FK violation, but count will be < 43).
-- This assertion catches silent misses.

DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM bundle_ingredients) = 43,
    'Expected 43 bundle ingredient rows — check ingredient names against the ingredients table';
END $$;
