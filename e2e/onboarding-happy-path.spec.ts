import { test, expect, loginViaUI } from './fixtures';

// Required composition-meter slots: protein, vegetable, grain, spice (needs 5), oil.
// Fruit/baking are optional and intentionally left unmet.
const REQUIRED_INGREDIENTS: Array<{ name: string; slot: string }> = [
  { name: 'Chicken Breast', slot: 'protein' },
  { name: 'Carrots', slot: 'vegetable' },
  { name: 'Basmati Rice', slot: 'grain' },
  { name: 'Extra Virgin Olive Oil', slot: 'oil' },
  { name: 'A1 Steak Sauce', slot: 'spice' },
  { name: 'Achiote Paste', slot: 'spice' },
  { name: 'Ajwain (Carom Seeds)', slot: 'spice' },
  { name: 'Aleppo Pepper', slot: 'spice' },
  { name: 'Allspice (Ground)', slot: 'spice' },
];

test('onboarding: sign in, build a compliant pantry, and reach finish', async ({ page, freshUser }) => {
  await loginViaUI(page, freshUser);

  await expect(page.getByText('Get Started')).toBeVisible();
  await page.getByText('Get Started').click();

  await expect(page.getByTestId('build-pantry-continue-button')).toHaveText('Continue anyway');

  for (const { name, slot } of REQUIRED_INGREDIENTS) {
    await page.getByPlaceholder('Search an ingredient...').fill(name);
    await page.getByText(name, { exact: true }).click();
    await page.getByTestId('single-ingredient-save-button').click();
    await expect(page.getByPlaceholder('Search an ingredient...')).toHaveValue('');
  }

  const requiredSlots = ['protein', 'vegetable', 'grain', 'oil'];
  for (const slot of requiredSlots) {
    await expect(page.getByTestId(`meter-slot-${slot}`).locator('svg')).toBeVisible();
  }
  await expect(page.getByText('5/5')).toBeVisible();

  await expect(page.getByTestId('build-pantry-continue-button')).toHaveText('Continue');

  await page.getByTestId('build-pantry-continue-button').click();
  await expect(page).toHaveURL(/finish/);
});
