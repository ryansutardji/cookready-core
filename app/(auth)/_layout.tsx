import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { session, ready } = useAuth();

  if (ready && session) {
    return <Redirect href="/(tabs)/pantry" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
