import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authStorage } from './secure-store-adapter';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isLoopbackHost = (url: string) => url.includes('127.0.0.1') || url.includes('localhost');

// `127.0.0.1`/`localhost` in EXPO_PUBLIC_SUPABASE_URL only resolves to the
// local Supabase stack when the JS runs in a browser or the iOS Simulator
// (which shares the host's loopback interface). On a physical device or an
// Android emulator, that same address refers to the device itself, not the
// dev machine, and every request fails at the network layer before it ever
// reaches the server. Rewrite the host to the Metro dev server's own LAN
// address (Constants.expoConfig.hostUri) in that case, keeping the original
// port (Supabase's local API always runs on 54321 regardless of Metro's port).
function resolveSupabaseUrl(url: string): string {
  if (!url || Platform.OS === 'web' || !isLoopbackHost(url)) return url;

  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost;
  if (!hostUri) return url;

  const lanHost = hostUri.split(':')[0];
  if (!lanHost || isLoopbackHost(lanHost)) return url;

  try {
    const parsed = new URL(url);
    parsed.hostname = lanHost;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

const supabaseUrl = resolveSupabaseUrl(rawSupabaseUrl);

console.log('Targeting Supabase Project:', supabaseUrl);

const isLocalStack = isLoopbackHost(supabaseUrl);

if (!supabaseUrl || (!supabaseUrl.includes('nsunepmaywmmvvlbjwvc') && !isLocalStack)) {
  console.error('MISCONFIGURATION: Supabase URL is wrong or missing. Expected nsunepmaywmmvvlbjwvc, got:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(authStorage ? { storage: authStorage } : {}),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (input, init) =>
      fetch(input, init).catch((err) => {
        if (isLocalStack) {
          // A network-layer failure (not an auth/HTTP error from the server)
          // against a local-stack URL almost always means either `supabase start`
          // isn't running, or (on a physical device/Android emulator) the host
          // couldn't be resolved to the dev machine's LAN address.
          console.error(
            `Network request to local Supabase stack (${supabaseUrl}) failed before reaching the server. ` +
              "Check 'npx supabase status' is running, and that this device can reach the dev machine's LAN IP.",
          );
        }
        throw err;
      }),
  },
});

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
