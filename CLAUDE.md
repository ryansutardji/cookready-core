# CookReady Core — Claude Guidelines

## Database Rules

### Ingredient Unit Consistency
`unit_conversions.input_unit` must always match the ingredient's `preferred_unit`. Keep them in sync whenever inserting a new ingredient or changing `preferred_unit`:
- New ingredient → add a `unit_conversions` row with `input_unit = preferred_unit`
- `preferred_unit` changes → update the matching `unit_conversions` row's `input_unit` (and `output_value` if the physical quantity changes, e.g. `log → oz`)
- Never leave a stale `input_unit` that no longer matches `preferred_unit`