---
name: project-bundle-primary-category
description: bundles.primary_category is a purity flag (NULL unless 100% one category), added for the pantry-wizard 5-shelf revamp
metadata:
  type: project
---

`bundles.primary_category` (migration `20260814100000_add_bundle_primary_category.sql`) is a **purity flag that doubles as a category tag** — it is set to a real `ingredients.category` value ONLY when 100% of a bundle's `bundle_ingredients` share that one category. It is left NULL for any bundle that mixes categories, even if one category dominates.

**Why:** the pantry onboarding wizard is being revamped into a 5-shelf sequence (2026-08-14) and a later feature will filter bundles with `WHERE primary_category = '<category>'` to populate each shelf. A "dominant category" heuristic would let a mixed bundle silently leak into a shelf it doesn't belong on, so NULL is the deliberately conservative default — never backfill a "best guess" for a mixed bundle.

Backfilled as `'Spice/Sauce'`: `seasoning-staples`, `mexican-staples`, `indian-spice-cabinet` (confirmed 100% pure by grep against `20260415000001_seed_ingredients.sql`). Left NULL: `asian-flavors`, `italian-pantry`, `mediterranean-mezze`, `french-bistro`, `grain-bowl-builder`, `baking-basics`, `japanese-kitchen` — each mixes in at least one off-category ingredient.

6 new pure-by-construction bundles were added in the same batch (`20260814100001_seed_wizard_shelf_bundles.sql`), one per shelf category, with `primary_category` set inline on insert rather than backfilled: `weeknight-proteins` + `plant-based-proteins` (Protein), `everyday-veggies` + `roasting-veggies` (Vegetable), `rice-pasta-basics` (Grain), `kitchen-oils-starter` (Oil). `bundle_ingredients` total went from 72 to 99. `sort_order` for new bundles continues from 9 (prior max, `japanese-kitchen`) → 10-15.

**How to apply:** if asked to add more bundles for the wizard shelves (e.g. a Dairy or Baking shelf), follow the same idiom — verify every ingredient's category by grep before inserting, set `primary_category` inline for new pure bundles, and never UPDATE an existing mixed bundle's `primary_category` to a non-NULL value without re-verifying 100% purity across all its `bundle_ingredients` first.
