import { test, expect, loginViaUI } from './fixtures';

test('SingleIngredientBar: search, select, save, and see the composition meter update', async ({
  page,
  freshUser,
}) => {
  await loginViaUI(page, freshUser);
  await page.getByText('Get Started').click();

  const ingredientName = 'Chicken Breast';

  // Unmet slot renders its emoji icon (a Text node), not the Check svg.
  await expect(page.getByTestId('meter-slot-protein').locator('svg')).toHaveCount(0);

  await page.getByPlaceholder('Search an ingredient...').fill('Chicken Bre');
  await expect(page.getByText(ingredientName, { exact: true })).toBeVisible();

  await page.getByText(ingredientName, { exact: true }).click();
  await expect(page.getByTestId('single-ingredient-save-button')).toBeVisible();

  await page.getByTestId('single-ingredient-save-button').click();

  await expect(page.getByPlaceholder('Search an ingredient...')).toHaveValue('');
  await expect(page.getByTestId('meter-slot-protein').locator('svg')).toBeVisible();
});
