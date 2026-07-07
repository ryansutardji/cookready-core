// build-pantry.tsx (transitively, via hooks/useBundles) imports the real
// Supabase client, which throws during construction unless
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set. Those env
// vars aren't loaded in the Jest environment, so we mock the module boundary
// here — CompositionMeter is a presentational component and never touches
// Supabase itself.
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { onAuthStateChange: jest.fn() } },
}));

import { render, within } from '@testing-library/react-native';
import { CompositionMeter } from '../build-pantry';

describe('CompositionMeter', () => {
  it('renders all 7 meter slots, 5 required and 2 marked optional', () => {
    const { getByText, getAllByText } = render(<CompositionMeter counts={{}} />);

    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Veggie')).toBeTruthy();
    expect(getByText('Grain')).toBeTruthy();
    expect(getByText(/Spice/)).toBeTruthy();
    expect(getByText('Oil')).toBeTruthy();
    expect(getByText('Fruit')).toBeTruthy();
    expect(getByText('Baking')).toBeTruthy();

    expect(getAllByText('opt')).toHaveLength(2);
  });

  it('shows the emoji icon and gray background for an unmet required slot', () => {
    const { getByTestId } = render(<CompositionMeter counts={{}} />);

    const slot = getByTestId('meter-slot-protein');
    expect(within(slot).getByText('🥩')).toBeTruthy();
    expect(slot).toHaveStyle({ backgroundColor: '#EDE5D8' });
  });

  it('shows a white checkmark and orange background for a met required slot', () => {
    const { getByTestId } = render(<CompositionMeter counts={{ protein: 1 }} />);

    const slot = getByTestId('meter-slot-protein');
    expect(slot).toHaveStyle({ backgroundColor: '#D2691E' });

    const check = within(slot).UNSAFE_getByType(require('lucide-react-native').Check);
    expect(check.props.color).toBe('#fff');
  });

  it('shows the emoji icon and gray background for an unmet optional slot', () => {
    const { getByTestId } = render(<CompositionMeter counts={{}} />);

    const slot = getByTestId('meter-slot-fruit');
    expect(within(slot).getByText('🍓')).toBeTruthy();
    expect(slot).toHaveStyle({ backgroundColor: '#EDE5D8' });
  });

  it('shows an olive checkmark and green-tinted background for a met optional slot', () => {
    const { getByTestId } = render(<CompositionMeter counts={{ fruit: 1 }} />);

    const slot = getByTestId('meter-slot-fruit');
    expect(slot).toHaveStyle({ backgroundColor: '#EBF5EE' });

    const check = within(slot).UNSAFE_getByType(require('lucide-react-native').Check);
    expect(check.props.color).toBe('#708238');
  });

  it('shows an X/5 counter on the spice slot when partially filled', () => {
    const { getByText, getByTestId } = render(<CompositionMeter counts={{ spice: 3 }} />);

    expect(getByText('3/5')).toBeTruthy();

    const slot = getByTestId('meter-slot-spice');
    expect(within(slot).getByText('🌶️')).toBeTruthy();
  });

  it('shows a checkmark on the spice slot once its count reaches 5', () => {
    const { getByTestId } = render(<CompositionMeter counts={{ spice: 5 }} />);

    const slot = getByTestId('meter-slot-spice');
    expect(slot).toHaveStyle({ backgroundColor: '#D2691E' });

    const check = within(slot).UNSAFE_getByType(require('lucide-react-native').Check);
    expect(check.props.color).toBe('#fff');
  });
});
