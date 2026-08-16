/*
  # Add Bundle Primary Category

  ## Summary
  Adds a `primary_category` column to `bundles`. This is a purity flag that
  doubles as a category tag: it is set ONLY when 100% of a bundle's
  ingredients share exactly one `ingredients.category` value. It stays NULL
  for any bundle that mixes categories.

  This is deliberate, not an oversight — a later feature (the pantry-wizard
  shelf screens) will filter bundles with `WHERE primary_category = '<category>'`,
  and a mixed-category bundle must never accidentally match that filter by
  being assigned a "dominant" category. NULL means "not safe to use as a
  single-category filter match," full stop.

  ## Backfill
  Exactly 3 of the 10 existing bundles are 100% Spice/Sauce and are backfilled:
    - seasoning-staples     (6/6 Spice/Sauce)
    - mexican-staples       (7/7 Spice/Sauce)
    - indian-spice-cabinet  (8/8 Spice/Sauce)

  The remaining 7 bundles (asian-flavors, italian-pantry, mediterranean-mezze,
  french-bistro, grain-bowl-builder, baking-basics, japanese-kitchen) each mix
  in at least one off-category ingredient and are left NULL by default.

  ## Rollback
  ALTER TABLE bundles DROP COLUMN primary_category;
*/

-- ============================================================
-- Forward migration
-- ============================================================

ALTER TABLE bundles ADD COLUMN primary_category text;

COMMENT ON COLUMN bundles.primary_category IS
  'Set only when 100% of this bundle''s ingredients share one ingredients.category value. NULL for any bundle that mixes categories — used as an exact filter match by the pantry-wizard shelf screens, so a mixed bundle must never get a "dominant" category here.';

-- ============================================================
-- Backfill: 3 bundles confirmed 100% Spice/Sauce
-- ============================================================

UPDATE bundles
SET primary_category = 'Spice/Sauce'
WHERE id IN ('seasoning-staples', 'mexican-staples', 'indian-spice-cabinet');

-- ============================================================
-- Assertion: exactly 3 bundles have a non-NULL primary_category
-- ============================================================

DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM bundles WHERE primary_category IS NOT NULL) = 3,
    'Expected exactly 3 bundles with a non-NULL primary_category after backfill';
END $$;
