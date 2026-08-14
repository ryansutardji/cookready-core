import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';

export function useSupabaseAutoRefresh(): void {
  useEffect(() => {
    const handleChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => subscription.remove();
  }, []);
}
