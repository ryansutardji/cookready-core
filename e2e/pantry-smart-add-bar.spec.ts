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

test('SmartAddBar: a staple ingredient renders as a non-interactive "Always available" row that cannot be added', async ({
  page,
  onboardedUser,
}) => {
  await loginViaUI(page, onboardedUser);

  await page.getByPlaceholder('Add an ingredient to your pantry...').fill('Water');

  const waterRow = page.getByText('Water', { exact: true }).locator('..');
  await expect(waterRow.getByText('Always available')).toBeVisible();
  // Desaturated per design tokens (#7A6558), not the normal row's #2C1810.
  await expect(page.getByText('Water', { exact: true })).toHaveCSS('color', 'rgb(122, 101, 88)');
  // Normal rows show a category label alongside the name — staple rows must not.
  await expect(waterRow.getByText('Pantry', { exact: true })).toHaveCount(0);

  // Tapping the row (or the name text within it) must be a no-op: no
  // quantity/unit/pin panel opens, and nothing gets added to the pantry.
  await page.getByText('Water', { exact: true }).click();

  await expect(page.getByTestId('smart-add-save-button')).not.toBeVisible();
  await expect(page.getByText(/added\./)).not.toBeVisible();
});

test('SmartAddBar: a normal ingredient returned alongside staple rows still opens the quantity panel and saves', async ({
  page,
  onboardedUser,
}) => {
  await loginViaUI(page, onboardedUser);

  const ingredientName = 'Water Chestnuts (Canned)';

  // Same query as the staple test above — the dropdown mixes the flagged
  // "Water"/"Tap Water" rows with a normal row ("Water Chestnuts (Canned)"),
  // proving the is_always_available branch doesn't affect its non-flagged
  // siblings rendered in the very same result set.
  await page.getByPlaceholder('Add an ingredient to your pantry...').fill('Water');
  await expect(page.getByText('Always available').first()).toBeVisible();

  await page.getByText(ingredientName, { exact: true }).click();
  await expect(page.getByTestId('smart-add-save-button')).toBeVisible();
  await page.getByTestId('smart-add-save-button').click();

  // Plain substring match (not RegExp) — the ingredient name contains
  // parentheses, which would otherwise be interpreted as regex groups.
  await expect(page.getByText(`of ${ingredientName} added.`)).toBeVisible();
  await expect(page.getByText(ingredientName, { exact: true })).toBeVisible();
});
