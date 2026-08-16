// recap.tsx imports the real Supabase client (and, transitively via
// './build-pantry', useRouter and the shelves screens), which throws during
// construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import * as mockedSupabaseModule from '@/lib/supabase';
const { mockQueryResult, mockFrom } = mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

// The global expo-router mock (jest.setup.ts) returns a brand-new
// { push, replace, back } object from a factory called fresh on every
// useRouter() invocation. recap.tsx's event handlers close over whatever
// `router` reference was captured at the most recent render — a stable
// singleton is needed here for reliable assertions on `.replace`.
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => mockRouter,
}));

jest.mock('../shelves/ShelfAddPanel', () => ({
  ShelfAddPanel: ({ slot }: { slot: { key: string } }) => {
    const { Text } = require('react-native');
    return <Text testID="mock-shelf-add-panel">{`slot:${slot.key}`}</Text>;
  },
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecapScreen from '../recap';

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks here since they would wipe the
  // queryBuilder chain methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
});

// protein/grain/oil/spice are satisfied; vegetable is the only unmet
// required shelf. fruit and baking (extras) have items too, to prove extras
// never flip into a "met" state no matter what's in the pantry.
const snapshotRows = [
  { name: 'Chicken', category: 'Protein' },
  { name: 'Rice', category: 'Grain' },
  { name: 'Olive Oil', category: 'Oil' },
  { name: 'Salt', category: 'Spice/Sauce' },
  { name: 'Pepper', category: 'Spice/Sauce' },
  { name: 'Garlic Powder', category: 'Spice/Sauce' },
  { name: 'Cumin', category: 'Spice/Sauce' },
  { name: 'Paprika', category: 'Spice/Sauce' },
  { name: 'Apple', category: 'Fruit' },
  { name: 'Flour', category: 'Baking' },
];

describe('RecapScreen', () => {
  it('shows a met required shelf with its joined item names', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: snapshotRows, error: null });

    const { getByText } = render(<RecapScreen />);

    await waitFor(() => expect(getByText('Chicken')).toBeTruthy());
    // Protein is met — the row shows its slot label and the joined names,
    // not the "skipped" summary.
    expect(getByText('Protein')).toBeTruthy();
  });

  it('shows an unmet required shelf in the dashed "skipped" state', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: snapshotRows, error: null });

    const { getByText, getAllByText } = render(<RecapScreen />);

    await waitFor(() => expect(getByText('Veggie')).toBeTruthy());

    // Only vegetable is unmet among the required shelves in this snapshot.
    expect(getAllByText('skipped')).toHaveLength(1);
  });

  it('always renders Fruit and Baking extras in the dashed/optional style, never as "met", even when items exist for them', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: snapshotRows, error: null });

    const { getByText, queryByText } = render(<RecapScreen />);

    await waitFor(() => expect(getByText('Fruit')).toBeTruthy());
    expect(getByText('Baking')).toBeTruthy();

    // Extras never show a joined-names summary — only the always-dashed
    // "Add" row — regardless of what's actually in the pantry for them.
    expect(queryByText('Apple')).toBeNull();
    expect(queryByText('Flour')).toBeNull();
  });

  it('opens the modal with ShelfAddPanel scoped to the tapped unmet shelf', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: snapshotRows, error: null });

    const { getByText, getAllByText, queryByTestId, getByTestId } = render(<RecapScreen />);

    await waitFor(() => expect(getByText('Veggie')).toBeTruthy());

    expect(queryByTestId('mock-shelf-add-panel')).toBeNull();

    // The required shelves render before the extras in the JSX, and
    // vegetable is the only unmet required shelf in this snapshot — so the
    // first "Add" pill belongs to it.
    fireEvent.press(getAllByText('Add')[0]);

    await waitFor(() =>
      expect(getByTestId('mock-shelf-add-panel')).toHaveTextContent('slot:vegetable')
    );
  });

  it('calls router.replace with the finish route when the primary CTA is tapped', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: snapshotRows, error: null });

    const { getByText } = render(<RecapScreen />);

    await waitFor(() => expect(getByText('Show me what I can cook')).toBeTruthy());

    fireEvent.press(getByText('Show me what I can cook'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(onboarding)/finish');
  });
});
