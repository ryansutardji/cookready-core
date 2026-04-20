import '../global.css';
import { useEffect, useState } from 'react';
// 1. Added useRootNavigationState to the imports
import { Stack, useRouter, useRootNavigationState } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  
  // 2. Initialize the navigation state hook
  const navigationState = useRootNavigationState();

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    NotoSerif_700Bold,
    Inter_400Regular,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authReady]);

  // 3. UPDATED EFFECT: The actual routing logic
  useEffect(() => {
    // CRITICAL GUARD: If navigationState?.key doesn't exist, the router isn't ready.
    // If we try to replace now, Expo Go will crash.
    if (!navigationState?.key) return;

    if (!authReady || (!fontsLoaded && !fontError)) return;

    if (session) {
      router.replace('/(tabs)/pantry');
    } else {
      router.replace('/(auth)');
    }
    // Added navigationState?.key to the dependency array
  }, [session, authReady, fontsLoaded, fontError, navigationState?.key]);

  const isReady = (fontsLoaded || !!fontError) && authReady;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
      
      {/* Keeping the overlay fix Bolt provided, as it is good practice */}
      {!isReady && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFAF5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color="#D2691E" />
        </View>
      )}
    </>
  );
}
