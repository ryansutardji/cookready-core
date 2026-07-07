import { test, expect, loginViaUI } from './fixtures';

const BUNDLE_NAME = 'Seasoning Staples';

test('Bundle sheet: open a bundle, add its pre-checked ingredients, and see them in the pantry list', async ({
  page,
  onboardedUser,
}) => {
  await loginViaUI(page, onboardedUser);

  await page.getByText('Bundle', { exact: true }).click();
  await page.getByText(BUNDLE_NAME, { exact: true }).click();

  await expect(page.getByTestId('bundle-sheet-add-button')).toBeVisible();
  await page.getByTestId('bundle-sheet-add-button').click();

  await expect(page.getByTestId('bundle-sheet-add-button')).not.toBeVisible();
  await expect(page.getByText('Salt', { exact: true })).toBeVisible();
});
