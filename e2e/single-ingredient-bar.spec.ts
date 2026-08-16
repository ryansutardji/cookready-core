import { test, expect, loginViaUI } from './fixtures';

test('SingleIngredientBar (Protein shelf): search, select, and save', async ({
  page,
  freshUser,
}) => {
  await loginViaUI(page, freshUser);
  await page.getByText('Skip — build my pantry now').click();
  await expect(page.getByText('Any protein?')).toBeVisible();

  const ingredientName = 'Chicken Breast';

  await page.getByPlaceholder('Search a protein…').fill('Chicken Bre');
  await expect(page.getByText(ingredientName, { exact: true })).toBeVisible();

  await page.getByText(ingredientName, { exact: true }).click();
  await expect(page.getByTestId('single-ingredient-save-button')).toBeVisible();
  await page.getByTestId('single-ingredient-save-button').click();

  await expect(page.getByPlaceholder('Search a protein…')).toHaveValue('');
});

test('SingleIngredientBar (Protein shelf): category filter excludes a real, non-protein ingredient', async ({
  page,
  freshUser,
}) => {
  await loginViaUI(page, freshUser);
  await page.getByText('Skip — build my pantry now').click();
  await expect(page.getByText('Any protein?')).toBeVisible();

  // "Broccoli" genuinely exists in the DB (category Vegetable) — on the
  // Protein shelf it must never surface as an existing match.
  await page.getByPlaceholder('Search a protein…').fill('Broccoli');

  await expect(page.getByText('No matches found')).toBeVisible();
  await expect(page.getByText('Broccoli', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Add "Broccoli" as a new protein')).toBeVisible();
});
