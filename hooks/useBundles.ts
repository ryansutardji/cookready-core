import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bundle } from '@/lib/bundles';

export type UseBundlesOptions = {
  // A single category ('Protein') or a list of categories (['Oil', 'Fat']) to
  // filter bundles by their `primary_category` column. Omit to fetch every
  // bundle unfiltered (existing behavior, e.g. SmartAddBar's bundle browser).
  primaryCategory?: string | string[];
};

export function useBundles(
  options?: UseBundlesOptions
): { bundles: Bundle[]; loading: boolean; error: string | null } {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `options.primaryCategory` may be a fresh array reference every render
  // (e.g. an inline `slot.categories` array), which would otherwise re-trigger
  // this effect forever. Depend on a stable, serialized key instead of the
  // reference itself.
  const primaryCategoryKey = JSON.stringify(options?.primaryCategory ?? null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBundles() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bundles')
        .select('*, bundle_ingredients(default_unit, sort_order, ingredients(id, name))');

      const primaryCategory: string | string[] | undefined = JSON.parse(primaryCategoryKey);

      if (Array.isArray(primaryCategory)) {
        query = query.in('primary_category', primaryCategory);
      } else if (primaryCategory !== null && primaryCategory !== undefined) {
        query = query.eq('primary_category', primaryCategory);
      }

      const { data, error: queryError } = await query.order('sort_order');

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const mapped: Bundle[] = (data ?? []).map((row: any) => {
        const sortedIngredients = [...(row.bundle_ingredients ?? [])].sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

        return {
          id: row.id,
          name: row.name,
          description: row.description,
          tag: row.tag,
          icon: row.icon,
          color: row.color,
          primaryCategory: row.primary_category,
          ingredients: sortedIngredients.map((bi: any) => ({
            ingredientId: bi.ingredients.id,
            name: bi.ingredients.name,
            defaultUnit: bi.default_unit,
          })),
        };
      });

      setBundles(mapped);
      setLoading(false);
    }

    fetchBundles();
    return () => { cancelled = true; };
  }, [primaryCategoryKey]);

  return { bundles, loading, error };
}
