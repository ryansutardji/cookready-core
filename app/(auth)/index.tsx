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
} from 'react-native';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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
      setError(err.message ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2D241E', textAlign: 'center', marginBottom: 8 }}>
            CookReady
          </Text>
          
          <View style={{ backgroundColor: '#E0D8CC', flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            <TouchableOpacity 
              onPress={() => setMode('login')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'login' ? '#D2691E' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ color: mode === 'login' ? 'white' : '#2D241E' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setMode('signup')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'signup' ? '#D2691E' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ color: mode === 'signup' ? 'white' : '#2D241E' }}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0D8CC' }}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0D8CC' }}
          />

          {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: '#D2691E', padding: 18, borderRadius: 12, alignItems: 'center' }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
