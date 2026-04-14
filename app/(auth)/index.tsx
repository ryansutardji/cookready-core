import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
    } catch (err: any) {
      setError(err.message ?? 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-cream">
      <Image
        source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
        className="absolute top-0 left-0 right-0 h-72 w-full"
        resizeMode="cover"
      />

      <View className="absolute top-0 left-0 right-0 h-72 bg-espresso/50" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="h-72 items-center justify-end pb-8 px-6">
            <Text
              className="text-white text-4xl text-center"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              CookReady
            </Text>
            <Text
              className="text-white/80 text-base italic mt-1 text-center"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              From your pantry to the plate
            </Text>
          </View>

          <View className="flex-1 bg-cream rounded-t-3xl px-6 pt-8 pb-10 shadow-lg">
            <View className="flex-row bg-stone rounded-2xl p-1 mb-7">
              {(['login', 'signup'] as Mode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    mode === m ? 'bg-terracotta shadow-sm' : ''
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      mode === m ? 'text-white' : 'text-espresso/60'
                    }`}
                    style={{ fontFamily: 'Inter_400Regular' }}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              className="text-espresso text-2xl mb-6"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              {mode === 'login' ? 'Welcome back,' : 'Join CookReady,'}
              {'\n'}
              <Text className="text-terracotta">
                {mode === 'login' ? 'chef.' : 'chef.'}
              </Text>
            </Text>

            <View className="gap-4">
              <View>
                <Text
                  className="text-espresso/60 text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#B8A898"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-stone rounded-xl px-4 py-3.5 text-espresso text-base border border-[#E0D8CC]"
                  style={{ fontFamily: 'Inter_400Regular' }}
                />
              </View>

              <View>
                <Text
                  className="text-espresso/60 text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#B8A898"
                  secureTextEntry
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="bg-stone rounded-xl px-4 py-3.5 text-espresso text-base border border-[#E0D8CC]"
                  style={{ fontFamily: 'Inter_400Regular' }}
                />
              </View>
            </View>

            {error ? (
              <View className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <Text
                  className="text-red-600 text-sm"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !email || !password}
              className="mt-6 bg-terracotta rounded-xl py-4 items-center shadow-md"
              style={{ opacity: loading || !email || !password ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className="text-white font-bold text-base"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <Text
              className="text-center text-espresso/40 text-xs mt-6"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {mode === 'login'
                ? "Don't have an account? Switch to Create Account above."
                : 'Already have an account? Switch to Sign In above.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
