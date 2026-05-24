# CookReady Core — Claude Guidelines

## Database Rules

### Ingredient Unit Consistency
When manually inserting a new ingredient via SQL or changing an existing ingredient's `preferred_unit`, you must always keep the `unit_conversions` table in sync:

- Every ingredient must have a `unit_conversions` row where `input_unit` matches its `preferred_unit`
- If `preferred_unit` changes, update the corresponding `unit_conversions` row's `input_unit` to match
- If the unit change also changes the physical quantity (e.g., `log → oz`), update `output_value` to reflect the correct gram equivalent for the new unit
- Never leave a `unit_conversions` row with a stale `input_unit` that no longer matches the ingredient's `preferred_unit`

**Example — inserting a new ingredient:**
```sql
INSERT INTO ingredients (name, category, base_unit, preferred_unit)
VALUES ('Example Ingredient', 'Vegetable', 'g', 'count');

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
VALUES (
  (SELECT id FROM ingredients WHERE name = 'Example Ingredient'),
  'count',   -- must match preferred_unit
  150,       -- grams per 1 count
  'g'
);
```

**Example — changing preferred_unit:**
```sql
UPDATE ingredients SET preferred_unit = 'oz' WHERE name = 'Example Ingredient';

UPDATE unit_conversions
SET input_unit = 'oz', output_value = 28.35
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Example Ingredient')
  AND input_unit = 'count';
```
