import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/app/_layout';

export default function Index() {
  const { session, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFAF5', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D2691E" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/pantry" />;
  }

  return <Redirect href="/(auth)" />;
}
