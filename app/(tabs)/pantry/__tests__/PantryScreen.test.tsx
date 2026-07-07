// index.tsx imports the real Supabase client, which throws during
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

jest.mock('@/components/SmartAddBar', () => ({
  SmartAddBar: () => null,
}));

import { render, waitFor, within } from '@testing-library/react-native';
import PantryScreen from '../index';

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks here since they would wipe the
  // queryBuilder chain methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
});

const EMPTY_GLOBAL_CONVERSIONS = { data: [], error: null };

const threeItemsTwoCategories = [
  {
    id: 'row-1',
    current_quantity_value: '2',
    is_permanent: false,
    ingredients: {
      id: 'ing-chicken',
      name: 'Chicken Breast',
      category: 'Protein',
      preferred_unit: 'lb',
      unit_conversions: [],
    },
  },
  {
    id: 'row-2',
    current_quantity_value: '3',
    is_permanent: false,
    ingredients: {
      id: 'ing-carrot',
      name: 'Carrot',
      category: 'Vegetable',
      preferred_unit: 'each',
      unit_conversions: [],
    },
  },
  {
    id: 'row-3',
    current_quantity_value: '1',
    is_permanent: false,
    ingredients: {
      id: 'ing-broccoli',
      name: 'Broccoli',
      category: 'Vegetable',
      preferred_unit: 'head',
      unit_conversions: [],
    },
  },
];

describe('PantryScreen', () => {
  it('shows the empty state when the pantry query returns no rows', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });
    mockQueryResult.mockResolvedValueOnce(EMPTY_GLOBAL_CONVERSIONS);

    const { getByText, queryByText } = render(<PantryScreen />);

    await waitFor(() => expect(queryByText('Loading your pantry...')).toBeNull());

    expect(getByText('Your pantry is empty')).toBeTruthy();
    expect(getByText('Start adding ingredients to see them here.')).toBeTruthy();
  });

  it('renders items grouped by category when the pantry has rows', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: threeItemsTwoCategories, error: null });
    mockQueryResult.mockResolvedValueOnce(EMPTY_GLOBAL_CONVERSIONS);

    const { getByText, queryByText } = render(<PantryScreen />);

    await waitFor(() => expect(queryByText('Loading your pantry...')).toBeNull());

    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Vegetable')).toBeTruthy();
    expect(getByText('Chicken Breast')).toBeTruthy();
    expect(getByText('Carrot')).toBeTruthy();
    expect(getByText('Broccoli')).toBeTruthy();
  });

  it('shows the correct item count and category count in the header stats', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: threeItemsTwoCategories, error: null });
    mockQueryResult.mockResolvedValueOnce(EMPTY_GLOBAL_CONVERSIONS);

    const { getByText, queryByText } = render(<PantryScreen />);

    await waitFor(() => expect(queryByText('Loading your pantry...')).toBeNull());

    // Each `<Text>` in JSX is a composite component wrapping a host "Text"
    // fiber, so `.parent` on the matched host text lands on that composite
    // wrapper — `.parent.parent` is needed to reach the enclosing host
    // `<View>` that groups the count with its label.
    const ingredientsLabel = getByText('ingredients');
    const ingredientsStatBlock = ingredientsLabel.parent!.parent!;
    expect(within(ingredientsStatBlock).getByText('3')).toBeTruthy();

    const categoriesLabel = getByText('categories');
    const categoriesStatBlock = categoriesLabel.parent!.parent!;
    expect(within(categoriesStatBlock).getByText('2')).toBeTruthy();
  });
});
