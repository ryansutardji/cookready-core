-- Local dev stack is missing a foreign key that exists on production
-- (unit_conversions.ingredient_id -> ingredients.id, ON DELETE CASCADE).
-- Without it, PostgREST can't resolve the embedded `ingredients(unit_conversions(...))`
-- select used by the main pantry screen, so `fetchPantry` fails locally with
-- "Could not find a relationship between 'ingredients' and 'unit_conversions'".
-- This brings the local schema in line with prod; confirmed via prod's
-- pg_get_constraintdef for unit_conversions_ingredient_id_fkey.
-- Local-only dev cruft: a conversion row pointing at an ingredient_id that no
-- longer exists locally. Can never be used (the ingredient is gone), and
-- would violate the FK being added below.
delete from public.unit_conversions uc
where uc.ingredient_id is not null
  and not exists (select 1 from public.ingredients i where i.id = uc.ingredient_id);

alter table public.unit_conversions
  add constraint unit_conversions_ingredient_id_fkey
  foreign key (ingredient_id) references public.ingredients(id) on delete cascade;
