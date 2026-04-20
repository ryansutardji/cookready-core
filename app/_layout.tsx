import '../global.css';
import { useEffect, useState, createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync();

type AuthContextType = { session: Session | null; ready: boolean };
const AuthContext = createContext<AuthContextType>({ session: null, ready: false });
export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  useFrameworkReady();

  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [fontsLoaded, fontError] = useFonts({
    NotoSerif_700Bold,
    Inter_400Regular,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fontsReady = fontsLoaded || !!fontError;
  const authReady = session !== undefined;
  const ready = fontsReady && authReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  return (
    <AuthContext.Provider value={{ session: session ?? null, ready }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </AuthContext.Provider>
  );
}
