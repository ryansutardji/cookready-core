import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

// expo-secure-store has no web implementation. On web, leave `storage`
// undefined so supabase-js falls back to its default (window.localStorage
// in a real browser — this is not the RN "no window" problem).
const secureStoreAdapter: SupportedStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const authStorage: SupportedStorage | undefined =
  Platform.OS === 'web' ? undefined : secureStoreAdapter;
