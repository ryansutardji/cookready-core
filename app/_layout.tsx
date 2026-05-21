import '../global.css';
import { useEffect, useState } from 'react';
// IMPORTANT: Notice we are NOT importing 'router' (the static object)
import { Stack, useRouter, useRootNavigationState } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter(); // Use the hook inside the component
  const navigationState = useRootNavigationState();

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);

  const [fontsLoaded, fontError] = useFonts({
    NotoSerif_700Bold,
    Inter_400Regular,
  });

  // 1. Handle Auth Subscription
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Splash Screen
  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authReady]);

  // 3. The "Safe" Router Logic
  useEffect(() => {
    // Wait for everything to be ready
    const isNavigationReady = navigationState?.key;
    const isAppReady = authReady && (fontsLoaded || fontError);

    if (!isNavigationReady || !isAppReady) return;

    // Use a small timeout to ensure the native stack has painted
    const timeout = setTimeout(async () => {
      if (session) {
        const [profileResult, pantryResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('has_completed_onboarding')
            .eq('id', session.user.id)
            .maybeSingle(),
          supabase
            .from('user_pantry')
            .select('id', { count: 'exact', head: true })
            .gt('current_quantity_value', 0),
        ]);

        const onboardingCompleted = profileResult.data?.has_completed_onboarding === true;
        const pantryCount = pantryResult.count ?? 0;

        if (onboardingCompleted) {
          router.replace('/(tabs)/pantry');
        } else if (pantryCount > 0) {
          router.replace('/(onboarding)/build-pantry');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      } else {
        router.replace('/(auth)');
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [session, authReady, fontsLoaded, fontError, navigationState?.key]);

  // While waiting, we MUST render the Stack to provide context
  // but we overlay our loading screen.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
      
      {(!authReady || (!fontsLoaded && !fontError)) && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: '#FFFAF5', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#D2691E" />
        </View>
      )}
    </>
  );
}
