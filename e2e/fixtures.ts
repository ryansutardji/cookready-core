import { test as base, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { getLocalSupabaseEnv } from './supabase-local-env';

export type TestUser = { email: string; password: string };

const TEST_PASSWORD = 'E2eTestPass123!';

export async function provisionTestUser(opts: { onboarded: boolean }): Promise<TestUser> {
  const { apiUrl, anonKey } = getLocalSupabaseEnv();
  const email = `e2e+${randomUUID()}@example.com`;
  const client = createClient(apiUrl, anonKey);

  const { data, error } = await client.auth.signUp({ email, password: TEST_PASSWORD });
  if (error || !data.user) {
    throw new Error(`Failed to provision test user: ${error?.message ?? 'no user returned'}`);
  }

  if (opts.onboarded) {
    const { error: updateError } = await client
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', data.user.id);
    if (updateError) {
      throw new Error(`Failed to mark test user onboarded: ${updateError.message}`);
    }
  }

  await client.auth.signOut();
  return { email, password: TEST_PASSWORD };
}

export async function loginViaUI(page: Page, user: TestUser) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('your@email.com').fill(user.email);
  await page.getByPlaceholder('••••••••').fill(user.password);
  // Guard against the SSR-hydration race where the first-filled field can be
  // wiped if hydration finishes mid-fill: re-assert both values before submit.
  await expect(page.getByPlaceholder('your@email.com')).toHaveValue(user.email);
  await expect(page.getByPlaceholder('••••••••')).toHaveValue(user.password);
  await page.getByTestId('auth-submit-button').click();
  await expect(page.getByTestId('auth-submit-button')).not.toBeVisible({ timeout: 15_000 });
}

export async function waitForToast(page: Page, textOrPattern: string | RegExp) {
  await expect(page.getByText(textOrPattern)).toBeVisible();
}

export async function addIngredientViaSingleBar(page: Page, ingredientName: string) {
  await page.getByPlaceholder('Search an ingredient...').fill(ingredientName);
  await page.getByText(ingredientName, { exact: true }).click();
  await page.getByTestId('single-ingredient-save-button').click();
}

export async function addIngredientViaSmartBar(page: Page, ingredientName: string) {
  await page.getByPlaceholder('Add an ingredient to your pantry...').fill(ingredientName);
  await page.getByText(ingredientName, { exact: true }).click();
  await page.getByTestId('smart-add-save-button').click();
}

type Fixtures = {
  freshUser: TestUser;
  onboardedUser: TestUser;
};

export const test = base.extend<Fixtures>({
  freshUser: async ({}, use) => {
    const user = await provisionTestUser({ onboarded: false });
    await use(user);
  },
  onboardedUser: async ({}, use) => {
    const user = await provisionTestUser({ onboarded: true });
    await use(user);
  },
});

export { expect };
