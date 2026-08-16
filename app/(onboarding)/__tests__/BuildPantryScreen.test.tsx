// build-pantry.tsx imports the real Supabase client, which throws during
// construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import * as mockedSupabaseModule from '@/lib/supabase';
// `jest.mock('@/lib/supabase')` (no factory) redirects every import of
// '@/lib/supabase' to the manual mock at lib/__mocks__/supabase.ts. Casting
// the mocked import to the mock file's real shape gives us the exact mock
// instances the screen actually uses (see hooks/__tests__/useBundles.test.ts
// for the full rationale).
const { mockQueryResult, mockFrom } = mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

// The global expo-router mock (jest.setup.ts) returns a brand-new
// { push, replace, back } object from a factory called fresh on every
// useRouter() invocation. build-pantry.tsx calls useRouter() once per render
// and its event handlers close over whatever `router` reference was captured
// at the most recent render — so a *stable* singleton is needed here to make
// assertions on `.replace` reliable across renders/re-renders.
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => mockRouter,
}));

jest.mock('@/hooks/useBundles', () => ({
  useBundles: () => ({ bundles: [], loading: false }),
}));

jest.mock('../SingleIngredientBar', () => ({
  SingleIngredientBar: ({ onAdded }: { onAdded: () => void }) => {
    const { TouchableOpacity } = require('react-native');
    return <TouchableOpacity testID="mock-add" onPress={onAdded} />;
  },
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BuildPantryScreen from '../build-pantry';
import { SHELVES } from '../shelves/ShelfConfig';

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks here since they would wipe the
  // queryBuilder chain methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
});

const requiredSlotsFilledRows = [
  { name: 'Chicken', category: 'Protein' },
  { name: 'Broccoli', category: 'Vegetable' },
  { name: 'Rice', category: 'Grain' },
  { name: 'Olive Oil', category: 'Oil' },
  { name: 'Salt', category: 'Spice/Sauce' },
  { name: 'Pepper', category: 'Spice/Sauce' },
  { name: 'Garlic Powder', category: 'Spice/Sauce' },
  { name: 'Cumin', category: 'Spice/Sauce' },
  { name: 'Paprika', category: 'Spice/Sauce' },
];

// protein, vegetable, and grain are satisfied; spice (needs 5) and oil (needs
// 1) are not — the first unmet required shelf, in SHELVES order, is spice.
const proteinVegGrainOnlyRows = [
  { name: 'Chicken', category: 'Protein' },
  { name: 'Broccoli', category: 'Vegetable' },
  { name: 'Rice', category: 'Grain' },
];

// Recursively pulls out the ShelfProgressBar's segment colors from a
// rendered tree, in SHELVES order (see shelves/__tests__/ShelfProgressBar.test.tsx
// for the exact style shape this depends on).
function segmentColors(tree: any): string[] {
  const colors: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'View' && Array.isArray(node.props?.style)) {
      const [base, colorStyle] = node.props.style;
      if (base?.height === 6 && base?.borderRadius === 3 && colorStyle?.backgroundColor) {
        colors.push(colorStyle.backgroundColor);
      }
    }
    if (node.children) walk(node.children);
  }
  walk(tree);
  return colors;
}

describe('BuildPantryScreen', () => {
  it('resumes on the first unmet required shelf (spice) when earlier required shelves are already satisfied', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: proteinVegGrainOnlyRows, error: null });

    const { getByText } = render(<BuildPantryScreen />);

    // "The spice shelf" is SHELVES[3].question — spice is the first shelf
    // whose count (0) is below its minCount (5) in this snapshot.
    await waitFor(() => expect(getByText('The spice shelf')).toBeTruthy());

    expect(getByText('Shelf 4 of 5')).toBeTruthy();
    expect(getByText('0 on the shelf')).toBeTruthy();
  });

  it('redirects straight to recap without ever rendering a shelf when all required shelves are already met', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: requiredSlotsFilledRows, error: null });

    const { queryByText } = render(<BuildPantryScreen />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/(onboarding)/recap')
    );

    for (const slot of SHELVES) {
      expect(queryByText(slot.question)).toBeNull();
    }
  });

  it('advances to the next shelf when "Next shelf" is tapped', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText } = render(<BuildPantryScreen />);

    // Empty pantry -> first unmet required shelf is protein (index 0).
    await waitFor(() => expect(getByText('Any protein?')).toBeTruthy());

    fireEvent.press(getByText('Next shelf'));

    await waitFor(() => expect(getByText('Any veggies?')).toBeTruthy());
    expect(getByText('Shelf 2 of 5')).toBeTruthy();
  });

  it('marks a shelf muted in the progress bar purely because it was left empty — not because of which button was tapped', async () => {
    // There's only one way to leave a shelf ("Next shelf"/"Last shelf") — a
    // shelf's muted-vs-filled state in the progress bar is decided entirely
    // by whether its contents met the minimum, never by a separate "skip"
    // action. Tapping "Next shelf" on an empty protein shelf must still mute
    // it once we've moved past it.
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, toJSON } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Any protein?')).toBeTruthy());

    fireEvent.press(getByText('Next shelf'));

    await waitFor(() => expect(getByText('Any veggies?')).toBeTruthy());

    // protein (index 0) muted — left empty — vegetable (index 1, current)
    // filled regardless of its own (still-empty) contents, grain/spice/oil
    // (2-4) not yet reached.
    expect(segmentColors(toJSON())).toEqual([
      '#C8B8A2',
      '#D2691E',
      '#EAE0D2',
      '#EAE0D2',
      '#EAE0D2',
    ]);
  });

  it('marks a shelf filled once passed, not muted, if it was actually populated before moving on', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, getByTestId, toJSON } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Any protein?')).toBeTruthy());

    // Populate protein via the mocked add bar before moving on.
    mockQueryResult.mockResolvedValueOnce({
      data: [{ name: 'Chicken', category: 'Protein' }],
      error: null,
    });
    fireEvent.press(getByTestId('mock-add'));
    await waitFor(() => expect(mockQueryResult).toHaveBeenCalledTimes(2));

    fireEvent.press(getByText('Next shelf'));
    await waitFor(() => expect(getByText('Any veggies?')).toBeTruthy());

    expect(segmentColors(toJSON())).toEqual([
      '#D2691E', // protein — filled, it was actually populated
      '#D2691E', // vegetable — current
      '#EAE0D2',
      '#EAE0D2',
      '#EAE0D2',
    ]);
  });

  it('redirects to recap instead of advancing when "Next shelf" ("Last shelf") is tapped from the last shelf', async () => {
    // Every required shelf but oil is satisfied, so the initial shelf is oil
    // (the last one, index 4).
    mockQueryResult.mockResolvedValueOnce({
      data: [
        { name: 'Chicken', category: 'Protein' },
        { name: 'Broccoli', category: 'Vegetable' },
        { name: 'Rice', category: 'Grain' },
        { name: 'Salt', category: 'Spice/Sauce' },
        { name: 'Pepper', category: 'Spice/Sauce' },
        { name: 'Garlic Powder', category: 'Spice/Sauce' },
        { name: 'Cumin', category: 'Spice/Sauce' },
        { name: 'Paprika', category: 'Spice/Sauce' },
      ],
      error: null,
    });

    const { getByText } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Got an oil or fat?')).toBeTruthy());
    expect(getByText('Last shelf')).toBeTruthy();

    fireEvent.press(getByText('Last shelf'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/(onboarding)/recap')
    );
  });

  it('redirects to recap immediately when "Skip setup" is tapped, regardless of which shelf is showing', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Any protein?')).toBeTruthy());

    fireEvent.press(getByText('Skip setup'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/(onboarding)/recap')
    );
  });

  it('refreshes the meter after an item is added without advancing or changing the current shelf', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, getByTestId, queryByText } = render(<BuildPantryScreen />);

    // Empty pantry -> currentIndex resolves to protein (index 0) exactly once.
    await waitFor(() => expect(getByText('Any protein?')).toBeTruthy());

    // The next refreshMeter() call (triggered by the add) would report every
    // required slot satisfied — if resume-position logic re-ran, this would
    // wrongly redirect to recap or jump shelves.
    mockQueryResult.mockResolvedValueOnce({ data: requiredSlotsFilledRows, error: null });

    fireEvent.press(getByTestId('mock-add'));

    // Give the refreshMeter() promise a tick to resolve.
    await waitFor(() => expect(mockQueryResult).toHaveBeenCalledTimes(2));

    expect(getByText('Any protein?')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(queryByText('The spice shelf')).toBeNull();
  });
});
