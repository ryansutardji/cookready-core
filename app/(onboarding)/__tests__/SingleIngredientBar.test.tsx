// SingleIngredientBar.tsx imports the real Supabase client, which throws
// during construction unless EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// are set. Those env vars aren't loaded in the Jest environment, so we mock
// the module boundary via the manual mock at lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import * as mockedSupabaseModule from '@/lib/supabase';
const { mockQueryResult, mockFrom } =
  mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

jest.mock('@/components/NewIngredientExpansion', () => ({
  NewIngredientExpansion: (props: { ingredientName: string; lockedCategory?: string }) => {
    const { Text } = require('react-native');
    return (
      <Text testID="mock-new-ingredient-expansion">
        {`name:${props.ingredientName}|locked:${props.lockedCategory ?? ''}`}
      </Text>
    );
  },
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SingleIngredientBar } from '../SingleIngredientBar';

afterEach(() => {
  // Avoid clearAllMocks/resetAllMocks — it would wipe the queryBuilder chain
  // methods' mockReturnValue, breaking every later test.
  mockQueryResult.mockClear();
  mockFrom.mockClear();
});

const noop = () => {};

describe('SingleIngredientBar', () => {
  it('filters the ingredient search by the exact categories prop via .in', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByPlaceholderText } = render(
      <SingleIngredientBar
        onAdded={noop}
        categories={['Protein']}
        placeholder="Search a protein…"
        lockedCategory="Protein"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search a protein…'), 'chick');

    await waitFor(
      () => {
        const builder = mockFrom.mock.results[0].value;
        expect(builder.in).toHaveBeenLastCalledWith('category', ['Protein']);
      },
      { timeout: 2000 }
    );
  });

  it('passes through multiple categories to .in exactly as given', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByPlaceholderText } = render(
      <SingleIngredientBar
        onAdded={noop}
        categories={['Oil', 'Fat']}
        placeholder="Search an oil…"
        lockedCategory="Oil"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search an oil…'), 'olive');

    await waitFor(
      () => {
        const builder = mockFrom.mock.results[0].value;
        expect(builder.in).toHaveBeenLastCalledWith('category', ['Oil', 'Fat']);
      },
      { timeout: 2000 }
    );
  });

  it('shows "No matches found" and an add-as-new row when the search returns zero results', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByPlaceholderText, getByText } = render(
      <SingleIngredientBar
        onAdded={noop}
        categories={['Protein']}
        placeholder="Search a protein…"
        lockedCategory="Protein"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search a protein…'), 'orange');

    await waitFor(() => expect(getByText('No matches found')).toBeTruthy(), { timeout: 2000 });
    expect(getByText('Add "orange" as a new protein')).toBeTruthy();
  });

  it('labels the add-as-new row using the friendly Spice/Sauce category label', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByPlaceholderText, getByText } = render(
      <SingleIngredientBar
        onAdded={noop}
        categories={['Spice/Sauce']}
        placeholder="Search a spice or sauce…"
        lockedCategory="Spice/Sauce"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search a spice or sauce…'), 'sriracha');

    await waitFor(
      () => expect(getByText('Add "sriracha" as a new spice or sauce')).toBeTruthy(),
      { timeout: 2000 }
    );
  });

  it('swaps in NewIngredientExpansion with the locked category and typed query when the add-as-new row is tapped', async () => {
    mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <SingleIngredientBar
        onAdded={noop}
        categories={['Protein']}
        placeholder="Search a protein…"
        lockedCategory="Protein"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search a protein…'), 'orange');

    await waitFor(() => expect(getByText('Add "orange" as a new protein')).toBeTruthy(), {
      timeout: 2000,
    });

    fireEvent.press(getByText('Add "orange" as a new protein'));

    expect(getByTestId('mock-new-ingredient-expansion')).toHaveTextContent(
      'name:orange|locked:Protein'
    );
  });
});
