// hooks/useBundles.ts imports the real Supabase client, which throws during
// construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import { renderHook, waitFor } from '@testing-library/react-native';
import * as mockedSupabaseModule from '@/lib/supabase';
import { useBundles } from '../useBundles';

// `jest.mock('@/lib/supabase')` (no factory) redirects every import of
// '@/lib/supabase' to the manual mock at lib/__mocks__/supabase.ts. Importing
// the mock's helpers from '@/lib/__mocks__/supabase' directly would instead
// evaluate that file as a *second*, unrelated module instance (a different
// module id), producing jest.fn()s that the hook's `supabase.from(...)` calls
// never touch. Casting the mocked '@/lib/supabase' import to the mock file's
// real shape (a type-only operation, erased at compile time — no second
// module evaluation) gives us the exact mock instances the hook actually uses.
const { mockQueryResult, mockFrom } =
  mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

afterEach(() => {
  // mockResolvedValueOnce values are consumed in call order and don't leak
  // across tests, but clear call history so assertions on mockFrom/mockQueryResult
  // (if ever added) start from a clean slate. Avoid clearAllMocks/resetAllMocks
  // here since they would wipe the queryBuilder chain methods' mockReturnValue
  // (e.g. `select` returning `queryBuilder`), breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
});

describe('useBundles', () => {
  it('returns an empty list and stops loading when the database has no bundles', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useBundles());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bundles).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('reshapes a raw bundle row into a Bundle, sorting ingredients by sort_order', async () => {
    const rawRow = {
      id: 'bundle-1',
      name: 'Taco Night',
      description: 'Everything for taco night',
      tag: 'Mexican',
      icon: 'taco',
      color: '#FF5733',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      bundle_ingredients: [
        {
          default_unit: 'oz',
          sort_order: 1,
          ingredients: { id: 'ing-cheese', name: 'Cheese' },
        },
        {
          default_unit: 'lb',
          sort_order: 0,
          ingredients: { id: 'ing-beef', name: 'Ground Beef' },
        },
      ],
    };

    mockQueryResult.mockResolvedValueOnce({ data: [rawRow], error: null });

    const { result } = renderHook(() => useBundles());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bundles).toHaveLength(1);

    const bundle = result.current.bundles[0];

    expect(bundle.id).toBe(rawRow.id);
    expect(bundle.name).toBe(rawRow.name);
    expect(bundle.description).toBe(rawRow.description);
    expect(bundle.tag).toBe(rawRow.tag);
    expect(bundle.icon).toBe(rawRow.icon);
    expect(bundle.color).toBe(rawRow.color);

    expect(bundle.ingredients).toEqual([
      { ingredientId: 'ing-beef', name: 'Ground Beef', defaultUnit: 'lb' },
      { ingredientId: 'ing-cheese', name: 'Cheese', defaultUnit: 'oz' },
    ]);
  });

  it('starts in a loading state and transitions to not-loading once the query resolves', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useBundles());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('surfaces the Supabase error message without throwing, leaving bundles empty', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: null,
      error: { message: 'some db error' },
    });

    const { result } = renderHook(() => useBundles());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bundles).toEqual([]);
    expect(result.current.error).toBe('some db error');
    expect(result.current.loading).toBe(false);
  });
});
