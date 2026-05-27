---
name: project-overview
description: CookReady core project — stack, Supabase project ID, key schema facts
metadata:
  type: project
---

CookReady is a React Native (Expo Router) app backed by Supabase project ID `nsunepmaywmmvvlbjwvc`.

Key schema facts:
- `public.ingredients`: id (uuid), name (text), category (text), base_unit (text), preferred_unit (text), user_id (uuid NULL). user_id = NULL = universal ingredient.
- `public.unit_conversions`: ingredient_id (uuid), input_unit (text), output_value (numeric), output_unit (text). input_unit must match preferred_unit of the ingredient.
- RLS: authenticated users can read ingredients where user_id IS NULL OR user_id = auth.uid(). Users can only insert ingredients with their own user_id.
- tsp/tbsp conversions are handled by global fallback rows — do NOT add them per-ingredient.

**Why:** Keep universal and user-private ingredients cleanly separated via user_id nullability.
**How to apply:** Always set user_id = NULL for universal seed data. Always verify preferred_unit matches the conversion input_unit.
