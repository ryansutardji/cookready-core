// NewIngredientExpansion.tsx imports the real Supabase client, which throws
// during construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import * as mockedSupabaseModule from '@/lib/supabase';
const { mockQueryResult, mockAuthGetSession } =
  mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NewIngredientExpansion } from '../NewIngredientExpansion';

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks — it would wipe the queryBuilder chain
  // methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockAuthGetSession.mockClear();
  (global.fetch as jest.Mock | undefined)?.mockClear?.();
});

const noop = () => {};

describe('NewIngredientExpansion — unlocked (AI-classify) path', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('classifies via a raw fetch call to the classify-ingredient function and never touches supabase.functions.invoke', async () => {
    // fetchUnitsByCategory's two supabase queries. 'oz' is a UNIVERSAL_UNITS
    // entry so the save button doesn't require confirming a custom
    // conversion first — keeps this a focused smoke test of the fetch path.
    mockQueryResult.mockResolvedValueOnce({
      data: [{ category: 'Vegetable', base_unit: 'oz', preferred_unit: 'oz' }],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({
        category: 'Vegetable',
        preferred_unit: 'oz',
        base_unit: 'oz',
        conversion_value: null,
        conversion_to_unit: null,
        needs_custom_conversion: false,
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const onSave = jest.fn().mockResolvedValue(undefined);

    const { getByText, getAllByText, queryByText } = render(
      <NewIngredientExpansion
        ingredientName="Zucchini"
        saving={false}
        onCancel={noop}
        onSave={onSave}
      />
    );

    expect(getByText('Figuring out the best fit...')).toBeTruthy();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/functions/v1/classify-ingredient'));
    expect(JSON.parse(init.body)).toEqual({ ingredient_name: 'Zucchini' });

    await waitFor(() => expect(queryByText('Add to Pantry')).toBeTruthy());

    // Both the category and unit sections show an AI-suggested tag once the
    // classify response resolves.
    expect(getAllByText('AI SUGGESTED').length).toBeGreaterThanOrEqual(1);

    fireEvent.press(getByText('Add to Pantry'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Zucchini', category: 'Vegetable' })
      )
    );
  });
});

describe('NewIngredientExpansion — locked-category anti-troll path', () => {
  it('never calls fetch when lockedCategory is set', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ category: 'Protein', base_unit: 'lb', preferred_unit: 'oz' }],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const mockFetch = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;

    const { getByText } = render(
      <NewIngredientExpansion
        ingredientName="orange"
        lockedCategory="Protein"
        saving={false}
        onCancel={noop}
        onSave={jest.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => expect(getByText('Add to Pantry')).toBeTruthy());

    expect(mockFetch).not.toHaveBeenCalled();

    global.fetch = originalFetch;
  });

  it('does not render the tappable CATEGORIES pill row when locked', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ category: 'Protein', base_unit: 'lb', preferred_unit: 'oz' }],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, queryByText } = render(
      <NewIngredientExpansion
        ingredientName="orange"
        lockedCategory="Protein"
        saving={false}
        onCancel={noop}
        onSave={jest.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => expect(getByText('Add to Pantry')).toBeTruthy());

    expect(queryByText('Vegetable')).toBeNull();
    expect(queryByText('Grain')).toBeNull();
    expect(queryByText('Baking')).toBeNull();
  });

  it('shows a locked badge with the locked category and never shows an AI SUGGESTED tag', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ category: 'Protein', base_unit: 'lb', preferred_unit: 'oz' }],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, queryByText } = render(
      <NewIngredientExpansion
        ingredientName="orange"
        lockedCategory="Protein"
        saving={false}
        onCancel={noop}
        onSave={jest.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => expect(getByText('Add to Pantry')).toBeTruthy());

    expect(getByText('Protein')).toBeTruthy();
    expect(queryByText('AI SUGGESTED')).toBeNull();
  });

  it('prefers a universal unit over an alphabetically-earlier non-universal one, so save is never silently blocked behind an unset conversion (regression: e2e caught "bag" beating "lb")', async () => {
    // fetchUnitsByCategory sorts each category's unit set alphabetically —
    // 'bag' sorts before 'lb', and 'bag' isn't in UNIVERSAL_UNITS. With no AI
    // suggestion to steer the pick (that's the whole point of the locked
    // path), naively taking catUnits[0] would select 'bag', which requires a
    // "how does 1 bag measure?" conversion value that's never supplied here —
    // silently disabling the save button with no error shown.
    mockQueryResult.mockResolvedValueOnce({
      data: [
        { category: 'Protein', base_unit: 'bag', preferred_unit: 'bag' },
        { category: 'Protein', base_unit: 'lb', preferred_unit: 'lb' },
      ],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const onSave = jest.fn().mockResolvedValue(undefined);

    const { getByText, queryByText } = render(
      <NewIngredientExpansion
        ingredientName="orange"
        lockedCategory="Protein"
        saving={false}
        onCancel={noop}
        onSave={onSave}
      />
    );

    await waitFor(() => expect(getByText('Add to Pantry')).toBeTruthy());

    // The unresolved-conversion prompt must not appear — 'lb' (universal)
    // should have been auto-selected over 'bag'.
    expect(queryByText(/How does 1 .+ measure\?/)).toBeNull();

    fireEvent.press(getByText('Add to Pantry'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'orange', category: 'Protein', preferred_unit: 'lb' })
      )
    );
  });

  it('calls onSave with category set to the locked category even though ingredientName is unrelated ("orange")', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ category: 'Protein', base_unit: 'lb', preferred_unit: 'oz' }],
      error: null,
    });
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const onSave = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <NewIngredientExpansion
        ingredientName="orange"
        lockedCategory="Protein"
        saving={false}
        onCancel={noop}
        onSave={onSave}
      />
    );

    await waitFor(() => expect(getByText('Add to Pantry')).toBeTruthy());

    fireEvent.press(getByText('Add to Pantry'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'orange', category: 'Protein' })
      )
    );
  });
});
