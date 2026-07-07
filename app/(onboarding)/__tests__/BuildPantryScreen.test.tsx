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

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks here since they would wipe the
  // queryBuilder chain methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
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

describe('BuildPantryScreen', () => {
  it('shows a muted "Continue anyway" button when required slots are unmet', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Continue anyway')).toBeTruthy());

    expect(getByText('Fill required slots for the best recipe results')).toBeTruthy();
  });

  it('shows an orange "Continue" button once all required slots are met', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: requiredSlotsFilledRows, error: null });

    const { getByText, queryByText } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Continue')).toBeTruthy());

    expect(queryByText('Fill required slots for the best recipe results')).toBeNull();
  });

  it('shows "Continue" (not "Continue anyway") even when the optional Fruit and Baking slots are still empty', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: requiredSlotsFilledRows, error: null });

    const { getByText, queryByText } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Continue')).toBeTruthy());

    expect(queryByText('Continue anyway')).toBeNull();
  });

  it('refreshes the composition meter after an ingredient is added', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByText, getByTestId } = render(<BuildPantryScreen />);

    await waitFor(() => expect(getByText('Continue anyway')).toBeTruthy());

    mockQueryResult.mockResolvedValueOnce({ data: requiredSlotsFilledRows, error: null });

    fireEvent.press(getByTestId('mock-add'));

    await waitFor(() => expect(getByText('Continue')).toBeTruthy());
  });
});
