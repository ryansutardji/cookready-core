/*
  # Seed Wizard Shelf Bundles

  ## Summary
  Inserts 6 new bundles for the 5-shelf pantry onboarding wizard revamp.
  Each bundle is provably 100% one ingredients.category by construction, so
  `primary_category` (added in 20260814100000) is set inline on every INSERT
  rather than backfilled after the fact.

  Bundle ingredients are resolved by name at migration time via subqueries
  against the ingredients table (user_id IS NULL = universal ingredients),
  following the same idiom as 20260601000001_seed_bundles.sql and
  20260608000001_add_new_bundles.sql:
    - Universal ingredient names are stable reference data
    - The subquery will fail with a constraint violation if a name doesn't
      match, making missing/mismatched names immediately visible
    - UUIDs can vary per environment (local vs. remote), so name lookups
      are more portable than hardcoded UUIDs

  ## Bundles
  10. Weeknight Proteins      (Protein,   6 ingredients)
  11. Plant-Based Proteins    (Protein,   3 ingredients)
  12. Everyday Veggies        (Vegetable, 5 ingredients)
  13. Roasting Veggies        (Vegetable, 4 ingredients)
  14. Rice & Pasta Basics     (Grain,     5 ingredients)
  15. Kitchen Oils Starter    (Oil,       4 ingredients)

  New bundle_ingredients: 6 + 3 + 5 + 4 + 5 + 4 = 27
  Grand total after migration: 72 (existing) + 27 (new) = 99

  sort_order continues from 9 (the max sort_order among the 10 existing
  bundles, held by japanese-kitchen) → 10 through 15.

  ## Rollback
  DELETE FROM bundles
  WHERE id IN (
    'weeknight-proteins', 'plant-based-proteins', 'everyday-veggies',
    'roasting-veggies', 'rice-pasta-basics', 'kitchen-oils-starter'
  );
  -- bundle_ingredients cascade-deleted via ON DELETE CASCADE
*/

-- ============================================================
-- 1. Insert bundles (primary_category set inline — each is pure by construction)
-- ============================================================

INSERT INTO bundles (id, name, description, tag, icon, color, sort_order, primary_category) VALUES
  ('weeknight-proteins',   'Weeknight Proteins',   'The everyday proteins that anchor a quick dinner.',        'Everyday', '🍗', '#A63D40', 10, 'Protein'),
  ('plant-based-proteins', 'Plant-Based Proteins',  'Meat-free proteins for stir-fries, bowls, and mains.',     'Everyday', '🌱', '#4F7942', 11, 'Protein'),
  ('everyday-veggies',     'Everyday Veggies',      'The aromatics and staples every crisper drawer needs.',    'Everyday', '🥕', '#D97706', 12, 'Vegetable'),
  ('roasting-veggies',     'Roasting Veggies',      'Hearty vegetables built for the oven.',                    'Everyday', '🥦', '#2F6B3A', 13, 'Vegetable'),
  ('rice-pasta-basics',    'Rice & Pasta Basics',   'The grains and noodles that carry a meal.',                'Everyday', '🍚', '#C9A227', 14, 'Grain'),
  ('kitchen-oils-starter', 'Kitchen Oils Starter',  'The cooking oils that cover most everyday needs.',         'Everyday', '🫒', '#6B8E23', 15, 'Oil')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Bundle ingredients
-- Each INSERT uses: SELECT id FROM ingredients WHERE name = '...' AND user_id IS NULL
-- A name miss returns NULL which violates the NOT NULL FK → immediate visible error.
-- ============================================================

-- ============================================================
-- 2a. Weeknight Proteins (6)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'lb',    0 FROM ingredients WHERE name = 'Chicken Breast' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'lb',    1 FROM ingredients WHERE name = 'Ground Beef'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'lb',    2 FROM ingredients WHERE name = 'Pork Chops'     AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'count', 3 FROM ingredients WHERE name = 'Egg (Brown)'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'lb',    4 FROM ingredients WHERE name = 'Ground Turkey'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'weeknight-proteins', id, 'lb',    5 FROM ingredients WHERE name = 'Canned Tuna'    AND user_id IS NULL;

-- ============================================================
-- 2b. Plant-Based Proteins (3)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'plant-based-proteins', id, 'lb', 0 FROM ingredients WHERE name = 'Tofu'    AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'plant-based-proteins', id, 'lb', 1 FROM ingredients WHERE name = 'Tempeh'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'plant-based-proteins', id, 'lb', 2 FROM ingredients WHERE name = 'Seitan'  AND user_id IS NULL;

-- ============================================================
-- 2c. Everyday Veggies (5)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'everyday-veggies', id, 'count', 0 FROM ingredients WHERE name = 'Yellow Onion'      AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'everyday-veggies', id, 'clove', 1 FROM ingredients WHERE name = 'Garlic'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'everyday-veggies', id, 'count', 2 FROM ingredients WHERE name = 'Carrots'            AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'everyday-veggies', id, 'stalk', 3 FROM ingredients WHERE name = 'Celery'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'everyday-veggies', id, 'count', 4 FROM ingredients WHERE name = 'Bell Pepper (Red)'  AND user_id IS NULL;

-- ============================================================
-- 2d. Roasting Veggies (4)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'roasting-veggies', id, 'head',  0 FROM ingredients WHERE name = 'Broccoli'          AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'roasting-veggies', id, 'head',  1 FROM ingredients WHERE name = 'Cauliflower'       AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'roasting-veggies', id, 'bag',   2 FROM ingredients WHERE name = 'Brussels Sprouts'  AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'roasting-veggies', id, 'count', 3 FROM ingredients WHERE name = 'Butternut Squash'  AND user_id IS NULL;

-- ============================================================
-- 2e. Rice & Pasta Basics (5)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'rice-pasta-basics', id, 'bag',       0 FROM ingredients WHERE name = 'Jasmine Rice'            AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'rice-pasta-basics', id, 'box',       1 FROM ingredients WHERE name = 'Spaghetti'               AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'rice-pasta-basics', id, 'box',       2 FROM ingredients WHERE name = 'Penne'                   AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'rice-pasta-basics', id, 'container', 3 FROM ingredients WHERE name = 'Rolled Oats'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'rice-pasta-basics', id, 'bag',       4 FROM ingredients WHERE name = 'Short Grain White Rice'  AND user_id IS NULL;

-- ============================================================
-- 2f. Kitchen Oils Starter (4)
-- ============================================================

INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'kitchen-oils-starter', id, 'bottle', 0 FROM ingredients WHERE name = 'Extra Virgin Olive Oil' AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'kitchen-oils-starter', id, 'bottle', 1 FROM ingredients WHERE name = 'Vegetable Oil'           AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'kitchen-oils-starter', id, 'bottle', 2 FROM ingredients WHERE name = 'Avocado Oil'             AND user_id IS NULL;
INSERT INTO bundle_ingredients (bundle_id, ingredient_id, default_unit, sort_order)
SELECT 'kitchen-oils-starter', id, 'bottle', 3 FROM ingredients WHERE name = 'Canola Oil'              AND user_id IS NULL;

-- ============================================================
-- 3. Assertion: exactly 99 total bundle_ingredient rows
-- ============================================================
-- 72 existing + 6 (Weeknight) + 3 (Plant-Based) + 5 (Everyday Veggies)
--             + 4 (Roasting) + 5 (Rice & Pasta) + 4 (Oils) = 99

DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM bundle_ingredients) = 99,
    'Expected 99 total bundle_ingredient rows — check ingredient names against the ingredients table';
END $$;
