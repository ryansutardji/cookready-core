import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bundle } from '@/lib/bundles';

export function useBundles(): { bundles: Bundle[]; loading: boolean; error: string | null } {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBundles() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('bundles')
        .select('*, bundle_ingredients(default_unit, sort_order, ingredients(id, name))')
        .order('sort_order');

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
  }, []);

  return { bundles, loading, error };
}
