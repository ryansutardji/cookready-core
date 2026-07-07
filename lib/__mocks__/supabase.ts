// Manual mock for lib/supabase.ts.
//
// Jest placement: lib/__mocks__/supabase.ts (adjacent to lib/supabase.ts).
// When a test calls `jest.mock('@/lib/supabase')`, Jest resolves the alias to
// <rootDir>/lib/supabase and looks for the manual mock here automatically.
//
// Usage in tests:
//   import { mockQueryResult, mockAuthSignInWithPassword } from '@/lib/__mocks__/supabase';
//   // or just call jest.mock('@/lib/supabase') and import from '@/lib/supabase' —
//   // the mock's named exports will be available.
//
// Overriding the default { data: null, error: null } response for one call:
//   mockQueryResult.mockResolvedValueOnce({ data: [{ id: '1' }], error: null });
//
// Overriding an auth response for one call:
//   mockAuthSignInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: { message: 'Invalid credentials' } });

// ─── Query builder ────────────────────────────────────────────────────────────
//
// All awaited query chains resolve through `mockQueryResult`.
// Override per-test with: mockQueryResult.mockResolvedValueOnce({ data: ..., error: ... })

export const mockQueryResult = jest.fn<
  Promise<{ data: unknown; error: unknown }>,
  []
>(() => Promise.resolve({ data: null, error: null }));

// The singleton chainable query builder.
// Every method returns the builder itself so arbitrary chains like
// .from().select().eq().order() all work with a single `await` at the end.
// The builder is thenable so `await builder` resolves through mockQueryResult.
const queryBuilder = {} as {
  select: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  range: jest.Mock;
  match: jest.Mock;
  filter: jest.Mock;
  or: jest.Mock;
  then: (
    resolve: (value: { data: unknown; error: unknown }) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

const chainableMethods = [
  'select',
  'eq',
  'neq',
  'in',
  'is',
  'gt',
  'gte',
  'lt',
  'lte',
  'order',
  'limit',
  'single',
  'maybeSingle',
  'range',
  'match',
  'filter',
  'or',
] as const;

for (const method of chainableMethods) {
  // mockReturnValue stores a reference to queryBuilder. By the time any test
  // calls one of these methods, queryBuilder is fully populated (all methods
  // added), so the returned reference has everything attached.
  (queryBuilder as unknown as Record<string, jest.Mock>)[method] = jest
    .fn()
    .mockReturnValue(queryBuilder);
}

// Make the builder thenable — `await supabase.from(...).select(...)` hits this.
queryBuilder.then = (resolve, reject) => mockQueryResult().then(resolve, reject);

export const mockFrom = jest.fn().mockReturnValue(queryBuilder);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const mockAuthGetSession = jest.fn().mockResolvedValue({
  data: { session: null },
  error: null,
});

export const mockAuthGetUser = jest.fn().mockResolvedValue({
  data: { user: null },
  error: null,
});

export const mockAuthSignInWithPassword = jest.fn().mockResolvedValue({
  data: { session: null, user: null },
  error: null,
});

export const mockAuthSignUp = jest.fn().mockResolvedValue({
  data: { session: null, user: null },
  error: null,
});

export const mockAuthSignOut = jest.fn().mockResolvedValue({ error: null });

export const mockAuthOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

// ─── RPC ──────────────────────────────────────────────────────────────────────
// Covers: add_pantry_item, deplete_pantry_item, apply_abuse_lockout,
//         check_recipe_cookability, get_recipe_ingredient_statuses, delete_own_account

export const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });

// ─── Edge Functions ───────────────────────────────────────────────────────────
// Covers: functions.invoke('generate-recipe', ...)

export const mockFunctionsInvoke = jest
  .fn()
  .mockResolvedValue({ data: null, error: null });

// ─── Assembled supabase client ────────────────────────────────────────────────

export const supabase = {
  from: mockFrom,
  auth: {
    getSession: mockAuthGetSession,
    getUser: mockAuthGetUser,
    signInWithPassword: mockAuthSignInWithPassword,
    signUp: mockAuthSignUp,
    signOut: mockAuthSignOut,
    onAuthStateChange: mockAuthOnAuthStateChange,
  },
  rpc: mockRpc,
  functions: {
    invoke: mockFunctionsInvoke,
  },
};

// ─── Re-exported types (mirrors lib/supabase.ts) ─────────────────────────────

export type PantryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  human_readable_inventory: string;
  conversionFactor?: number;
  is_permanent: boolean;
};

export type PantryCategory = {
  category: string;
  items: PantryItem[];
};

export type SavedRecipeIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type SavedRecipe = {
  id: string;
  user_id: string;
  recipe_name: string;
  description: string;
  servings: number;
  ingredients: SavedRecipeIngredient[];
  instructions: string[];
  is_archived: boolean;
  created_at: string;
  archived_at: string | null;
  is_able_to_cook?: boolean;
};
