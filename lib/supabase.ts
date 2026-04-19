import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

console.log('Targeting Supabase Project:', supabaseUrl);

if (!supabaseUrl || !supabaseUrl.includes('nsunepmaywmmvvlbjwvc')) {
  console.error('MISCONFIGURATION: Supabase URL is wrong or missing. Expected nsunepmaywmmvvlbjwvc, got:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PantryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  human_readable_inventory: string;
};

export type PantryCategory = {
  category: string;
  items: PantryItem[];
};
