import { test, expect, loginViaUI } from './fixtures';

test('SmartAddBar: search, select, save, see a toast, and see the item in the pantry list', async ({
  page,
  onboardedUser,
}) => {
  await loginViaUI(page, onboardedUser);

  const ingredientName = 'Carrots';

  await page.getByPlaceholder('Add an ingredient to your pantry...').fill('Carrot');
  await page.getByText(ingredientName, { exact: true }).click();
  await page.getByTestId('smart-add-save-button').click();

  await expect(page.getByText(new RegExp(`of ${ingredientName} added\\.`))).toBeVisible();
  await expect(page.getByText(ingredientName, { exact: true })).toBeVisible();
});
