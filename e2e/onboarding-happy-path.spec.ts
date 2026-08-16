import { test, expect, loginViaUI, provisionTestUser, type TestUser } from './fixtures';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { getLocalSupabaseEnv } from './supabase-local-env';

// Walks the 5-shelf pantry setup wizard end to end: gatekeeping on the
// Protein shelf (typing a non-protein still only offers it as a new,
// forcibly-Protein-categorized ingredient), a normal search-add, moving on
// from a shelf without adding anything (there's a single "Next shelf" button
// — leaving a shelf empty is what marks it as skipped, not a separate
// button), the spice shelf's live count chip + one-tap suggestion pill, the
// last shelf's "Last shelf" label, and the recap screen (met/skipped rows,
// the Add-pill modal reusing the shelf's own add panel, and the final CTA).
test('onboarding: walk all 5 shelves (incl. gatekeeping + spice pill + an empty shelf) and reach recap', async ({
  page,
  freshUser,
}) => {
  await loginViaUI(page, freshUser);

  await page.getByText('Skip — build my pantry now').click();

  // --- Shelf 1: Protein ---
  await expect(page.getByText('Shelf 1 of 5')).toBeVisible();
  await expect(page.getByText('Any protein?')).toBeVisible();

  // Gatekeeping: a non-protein ("orange") must never appear as an
  // existing-ingredient match on this shelf. `ingredients.name` is globally
  // unique (not scoped per user), and this suite runs repeatedly against the
  // same persistent local stack, so the name itself must be unique per run —
  // otherwise the second run's insert silently collides with the first's.
  const newIngredientName = `orange-${randomUUID().slice(0, 8)}`;
  await page.getByPlaceholder('Search a protein…').fill(newIngredientName);
  await expect(page.getByText('No matches found')).toBeVisible();

  const addOrangeRow = page.getByText(`Add "${newIngredientName}" as a new protein`);
  await expect(addOrangeRow).toBeVisible();
  await addOrangeRow.click();

  // Locked-category flow: no editable category pills, just a fixed "Protein" badge.
  await expect(page.getByText('Protein', { exact: true })).toBeVisible();
  await expect(page.getByText('Vegetable', { exact: true })).not.toBeVisible();
  const addToPantryBtn = page.getByText('Add to Pantry');
  await expect(addToPantryBtn).toBeVisible();
  await addToPantryBtn.click();

  // Adding as new returns to the plain search bar for this shelf.
  await expect(page.getByPlaceholder('Search a protein…')).toBeVisible();

  await page.getByText('Next shelf').click();

  // --- Shelf 2: Veggie ---
  await expect(page.getByText('Shelf 2 of 5')).toBeVisible();
  await page.getByPlaceholder('Search a veggie…').fill('Carrot');
  await page.getByText('Carrots', { exact: true }).click();
  await page.getByTestId('single-ingredient-save-button').click();
  await expect(page.getByPlaceholder('Search a veggie…')).toHaveValue('');

  await page.getByText('Next shelf').click();

  // --- Shelf 3: Grain — left empty, then just move on ---
  await expect(page.getByText('Shelf 3 of 5')).toBeVisible();
  await page.getByText('Next shelf').click();

  // --- Shelf 4: Spice (bespoke) ---
  await expect(page.getByText('Shelf 4 of 5')).toBeVisible();
  await expect(page.getByText('The spice shelf')).toBeVisible();
  await expect(page.getByText('0 on the shelf')).toBeVisible();

  // The real, already-pure Spice/Sauce bundles surface here (no invented
  // "everyday five" card) — Seasoning Staples is guaranteed 100% pure.
  await expect(page.getByText('Seasoning Staples')).toBeVisible();

  const cuminPill = page.getByText('cumin', { exact: true });
  await expect(cuminPill).toBeVisible();
  await cuminPill.click();
  await expect(page.getByText('1 on the shelf')).toBeVisible();

  await page.getByText('Next shelf').click();

  // --- Shelf 5: Oil (last) ---
  await expect(page.getByText('Shelf 5 of 5')).toBeVisible();
  await page.getByPlaceholder('Search a oil…').fill('Extra Virgin Olive Oil');
  await page.getByText('Extra Virgin Olive Oil', { exact: true }).click();
  await page.getByTestId('single-ingredient-save-button').click();
  await expect(page.getByPlaceholder('Search a oil…')).toHaveValue('');

  // Last shelf's forward button reads "Last shelf", not "Next shelf".
  await expect(page.getByText('Last shelf')).toBeVisible();
  await page.getByText('Last shelf').click();

  // --- Recap ---
  await expect(page).toHaveURL(/recap/);
  await expect(page.getByText('Your shelves')).toBeVisible();

  // Met rows show what was added.
  await expect(page.getByText(newIngredientName, { exact: false })).toBeVisible();
  await expect(page.getByText('Carrots', { exact: false })).toBeVisible();
  await expect(page.getByText('Extra Virgin Olive Oil', { exact: false })).toBeVisible();

  // Grain was left empty and Spice only got 1 of the required 5 — both unmet.
  const grainRow = page.getByText('Grain', { exact: true }).locator('../..');
  await expect(grainRow.getByText('skipped')).toBeVisible();

  // Extras are always offered, never shown as "met".
  await expect(page.getByText('Fruit', { exact: true })).toBeVisible();
  await expect(page.getByText('Baking', { exact: true })).toBeVisible();

  // Recap's "Add" pill reuses the same shelf add panel — fill Grain's gap here.
  const grainAddPill = grainRow.getByText('Add', { exact: true });
  await grainAddPill.click();
  await page.getByPlaceholder('Search a grain…').fill('Basmati Rice');
  await page.getByText('Basmati Rice', { exact: true }).click();
  await page.getByTestId('single-ingredient-save-button').click();
  await page.getByTestId('recap-modal-close').click();

  // Grain's row should now show as met with the newly-added item.
  const updatedGrainRow = page.getByText('Grain', { exact: true }).locator('../..');
  await expect(updatedGrainRow.getByText('Basmati Rice', { exact: false })).toBeVisible();

  await expect(page.getByText('Show me what I can cook')).toBeVisible();
  await page.getByText('Show me what I can cook').click();
  await expect(page).toHaveURL(/finish/);
});

test('onboarding: resuming with a partial pantry lands on the first unmet shelf, not Shelf 1', async ({
  page,
}) => {
  const { apiUrl, anonKey } = getLocalSupabaseEnv();
  const user: TestUser = await provisionTestUser({ onboarded: false });

  // Seed Protein + Grain directly (bypassing the wizard UI entirely), leaving
  // Vegetable/Spice/Oil unmet — Vegetable is the first unmet shelf in order.
  const client = createClient(apiUrl, anonKey);
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (signInError || !signInData.user) {
    throw new Error(`Failed to sign in test user for seeding: ${signInError?.message}`);
  }
  const { error: proteinError } = await client.rpc('add_pantry_item', {
    p_ingredient_name: 'Chicken Breast',
    p_quantity: 1,
    p_unit: 'lb',
  });
  const { error: grainError } = await client.rpc('add_pantry_item', {
    p_ingredient_name: 'Basmati Rice',
    p_quantity: 1,
    p_unit: 'bag',
  });
  if (proteinError || grainError) {
    throw new Error(`Failed to seed pantry: ${proteinError?.message ?? grainError?.message}`);
  }
  await client.auth.signOut();

  // A user who already has pantry items is routed straight past welcome.tsx
  // into the wizard (see app/_layout.tsx) — there's no "Skip — build my
  // pantry now" link to click here, unlike the brand-new-user happy path.
  await loginViaUI(page, user);

  await expect(page.getByText('Any veggies?')).toBeVisible();
  await expect(page.getByText('Any protein?')).not.toBeVisible();
});
