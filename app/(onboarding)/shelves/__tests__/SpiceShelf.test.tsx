// SpiceShelf.tsx imports the real Supabase client, which throws during
// construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import * as mockedSupabaseModule from '@/lib/supabase';
const { mockQueryResult, mockRpc } =
  mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

// ShelfAddPanel drags in SingleIngredientBar + useBundles — irrelevant to the
// count chip / suggestion pill behavior under test here, so stub it out.
jest.mock('../ShelfAddPanel', () => ({
  ShelfAddPanel: () => {
    const { View } = require('react-native');
    return <View testID="mock-shelf-add-panel" />;
  },
}));

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SpiceShelf } from '../SpiceShelf';
import { SHELVES } from '../ShelfConfig';

const spiceSlot = SHELVES.find((s) => s.key === 'spice')!;

const noop = () => {};

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks — it would wipe the queryBuilder
  // chain methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockRpc.mockClear();
});

describe('SpiceShelf', () => {
  it('shows the count chip text reflecting the count prop', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 3 }}
        onAdded={noop}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    await waitFor(() => expect(getByText('3 on the shelf')).toBeTruthy());
  });

  it('renders a 5-segment mini bar with only the first `count` segments filled', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { toJSON } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 2 }}
        onAdded={noop}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    await waitFor(() => {
      const colors = miniSegmentColors(toJSON());
      expect(colors).toHaveLength(5);
    });

    const colors = miniSegmentColors(toJSON());
    expect(colors).toEqual(['#D2691E', '#D2691E', '#EFD6BC', '#EFD6BC', '#EFD6BC']);
  });

  it('caps the mini bar at 5 filled segments even when count exceeds 5', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { toJSON } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 7 }}
        onAdded={noop}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    await waitFor(() => expect(miniSegmentColors(toJSON())).toHaveLength(5));
    expect(miniSegmentColors(toJSON())).toEqual(['#D2691E', '#D2691E', '#D2691E', '#D2691E', '#D2691E']);
  });

  it('renders one suggestion pill for each hardcoded ingredient', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 0 }}
        onAdded={noop}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    await waitFor(() => {
      expect(getByText('cumin')).toBeTruthy();
      expect(getByText('red pepper flakes')).toBeTruthy();
      expect(getByText('sriracha')).toBeTruthy();
      expect(getByText('rice vinegar')).toBeTruthy();
    });
  });

  it('does not call add_pantry_item when a pill is tapped before the unit lookup resolves', async () => {
    let resolveLookup!: (value: { data: unknown; error: unknown }) => void;
    mockQueryResult.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLookup = resolve;
        })
    );

    const onAdded = jest.fn();
    const { getByText } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 0 }}
        onAdded={onAdded}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    // Let the lookup's `await` reach the queryBuilder's thenable (assigning
    // resolveLookup) without letting it resolve yet.
    await waitFor(() => expect(mockQueryResult).toHaveBeenCalledTimes(1));

    // The lookup query hasn't resolved yet — tapping a pill must no-op.
    fireEvent.press(getByText('cumin'));

    expect(mockRpc).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();

    // Resolve the lookup and flush pending state updates.
    await act(async () => {
      resolveLookup({
        data: [{ name: 'Cumin (Ground)', preferred_unit: 'tsp' }],
        error: null,
      });
      await Promise.resolve();
    });
  });

  it('calls add_pantry_item with the exact ingredient name, quantity 1, and the looked-up unit, then calls onAdded', async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [
        { name: 'Cumin (Ground)', preferred_unit: 'tsp' },
        { name: 'Crushed Red Pepper Flakes', preferred_unit: 'tsp' },
        { name: 'Sriracha', preferred_unit: 'tbsp' },
        { name: 'Rice Vinegar', preferred_unit: 'tbsp' },
      ],
      error: null,
    });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const onAdded = jest.fn();
    const { getByText } = render(
      <SpiceShelf
        slot={spiceSlot}
        index={3}
        meterCounts={{ spice: 0 }}
        onAdded={onAdded}
        onNext={noop}
        onSkipSetup={noop}
      />
    );

    // Wait for the lookup to resolve before tapping.
    await waitFor(() => expect(mockQueryResult).toHaveBeenCalledTimes(1));

    fireEvent.press(getByText('cumin'));

    await waitFor(() =>
      expect(mockRpc).toHaveBeenCalledWith('add_pantry_item', {
        p_ingredient_name: 'Cumin (Ground)',
        p_quantity: 1,
        p_unit: 'tsp',
      })
    );

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
  });
});

function miniSegmentColors(tree: any): string[] {
  const colors: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'View' && Array.isArray(node.props?.style)) {
      const [base, variant] = node.props.style;
      if (base?.width === 18 && base?.height === 6 && variant?.backgroundColor) {
        colors.push(variant.backgroundColor);
      }
    }
    if (node.children) walk(node.children);
  }
  walk(tree);
  return colors;
}
