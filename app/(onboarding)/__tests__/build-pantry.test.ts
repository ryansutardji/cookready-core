// build-pantry.tsx (transitively, via hooks/useBundles) imports the real
// Supabase client, which throws during construction unless
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set. Those env
// vars aren't loaded in the Jest environment, so we mock the module boundary
// here — computeMeterCounts is a pure function and never touches Supabase.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn() },
  },
}));

import { computeMeterCounts } from '../build-pantry';

describe('computeMeterCounts', () => {
  it('returns all zeros for an empty pantry', () => {
    const counts = computeMeterCounts([]);

    expect(counts.protein).toBe(0);
    expect(counts.vegetable).toBe(0);
    expect(counts.grain).toBe(0);
    expect(counts.spice).toBe(0);
    expect(counts.oil).toBe(0);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('counts a single Protein item toward the protein slot', () => {
    const counts = computeMeterCounts([{ name: 'Chicken', category: 'Protein' }]);

    expect(counts.protein).toBe(1);
    expect(counts.vegetable).toBe(0);
    expect(counts.grain).toBe(0);
    expect(counts.spice).toBe(0);
    expect(counts.oil).toBe(0);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('counts a single Oil item toward the oil slot', () => {
    const counts = computeMeterCounts([{ name: 'Olive Oil', category: 'Oil' }]);

    expect(counts.oil).toBe(1);
    expect(counts.protein).toBe(0);
    expect(counts.vegetable).toBe(0);
    expect(counts.grain).toBe(0);
    expect(counts.spice).toBe(0);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('counts a single Fat item toward the oil slot, since Oil and Fat share a bucket', () => {
    const counts = computeMeterCounts([{ name: 'Butter', category: 'Fat' }]);

    expect(counts.oil).toBe(1);
    expect(counts.protein).toBe(0);
    expect(counts.vegetable).toBe(0);
    expect(counts.grain).toBe(0);
    expect(counts.spice).toBe(0);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('ignores items with an unknown category without throwing', () => {
    const pantry = [
      { name: 'Milk', category: 'Dairy' },
      { name: 'Soda', category: 'Beverage' },
    ];

    expect(() => computeMeterCounts(pantry)).not.toThrow();

    const counts = computeMeterCounts(pantry);

    expect(counts.protein).toBe(0);
    expect(counts.vegetable).toBe(0);
    expect(counts.grain).toBe(0);
    expect(counts.spice).toBe(0);
    expect(counts.oil).toBe(0);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('counts each slot independently in a mixed realistic pantry', () => {
    const pantry = [
      { name: 'Chicken', category: 'Protein' },
      { name: 'Beef', category: 'Protein' },
      { name: 'Broccoli', category: 'Vegetable' },
      { name: 'Carrot', category: 'Vegetable' },
      { name: 'Spinach', category: 'Vegetable' },
      { name: 'Rice', category: 'Grain' },
      { name: 'Salt', category: 'Spice/Sauce' },
      { name: 'Pepper', category: 'Spice/Sauce' },
      { name: 'Garlic Powder', category: 'Spice/Sauce' },
      { name: 'Soy Sauce', category: 'Spice/Sauce' },
      { name: 'Cumin', category: 'Spice/Sauce' },
      { name: 'Paprika', category: 'Spice/Sauce' },
      { name: 'Olive Oil', category: 'Oil' },
      { name: 'Random Item', category: 'Unknown' },
    ];

    const counts = computeMeterCounts(pantry);

    expect(counts.protein).toBe(2);
    expect(counts.vegetable).toBe(3);
    expect(counts.grain).toBe(1);
    expect(counts.spice).toBe(6);
    expect(counts.oil).toBe(1);
    expect(counts.fruit).toBe(0);
    expect(counts.baking).toBe(0);
  });

  it('does not cap the spice count at 5 - the raw count is returned', () => {
    const pantry = Array.from({ length: 7 }, (_, i) => ({
      name: `Spice ${i}`,
      category: 'Spice/Sauce',
    }));

    const counts = computeMeterCounts(pantry);

    expect(counts.spice).toBe(7);
  });
});
