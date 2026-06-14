import { useState, useEffect } from 'react';
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
  StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { consumePendingLockout } from '@/lib/lockout-store';

type Mode = 'login' | 'signup';

function formatLockoutMessage(lockedUntil: Date): string {
  const totalMs = lockedUntil.getTime() - Date.now();
  const totalMinutes = Math.ceil(totalMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `Your account is locked due to misuse of the AI Chef. Try again in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
  }
  if (hours > 0) {
    return `Your account is locked due to misuse of the AI Chef. Try again in ${hours} hour${hours !== 1 ? 's' : ''}.`;
  }
  return `Your account is locked due to misuse of the AI Chef. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
}

const CREAM = '#FFFAF5';
const ESPRESSO = '#2D241E';
const TERRACOTTA = '#D2691E';
const STONE = '#F5F0E8';
const BORDER = '#E0D5C5';
const PLACEHOLDER = '#B8A898';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const lockedUntil = consumePendingLockout();
    if (lockedUntil) {
      setError(formatLockoutMessage(new Date(lockedUntil)));
    }
  }, []);

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

  const isDisabled = loading || !email || !password;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.heroOverlay}>
          <Text style={[styles.heroTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            CookReady
          </Text>
          <Text style={[styles.heroSubtitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            From your pantry to the plate
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setMode(m);
                  setError('');
                }}
                style={[styles.tab, mode === m && styles.tabActive]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.tabText,
                    { fontFamily: 'Inter_400Regular' },
                    mode === m && styles.tabTextActive,
                  ]}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.heading, { fontFamily: 'NotoSerif_700Bold' }]}>
            {mode === 'login' ? 'Welcome back,' : 'Join CookReady,'}
            {'\n'}
            <Text style={styles.headingAccent}>chef.</Text>
          </Text>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: 'Inter_400Regular' }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={PLACEHOLDER}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={[styles.input, { fontFamily: 'Inter_400Regular' }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: 'Inter_400Regular' }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={[styles.input, { fontFamily: 'Inter_400Regular' }]}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isDisabled}
            style={[styles.submitButton, isDisabled && styles.submitButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.submitText, { fontFamily: 'Inter_400Regular' }]}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { fontFamily: 'Inter_400Regular' }]}>
            {mode === 'login'
              ? "Don't have an account? Switch to Create Account above."
              : 'Already have an account? Switch to Sign In above.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(45, 36, 30, 0.50)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 36,
    textAlign: 'center',
    width: '100%',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(209,197,181,0.60)',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: STONE,
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: TERRACOTTA,
    borderWidth: 1,
    borderColor: 'rgba(180, 85, 10, 0.30)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: `${ESPRESSO}99`,
    flexShrink: 1,
  },
  tabTextActive: {
    color: '#fff',
  },
  heading: {
    fontSize: 26,
    color: ESPRESSO,
    lineHeight: 34,
    marginBottom: 24,
  },
  headingAccent: {
    color: TERRACOTTA,
  },
  fieldGroup: {
    gap: 16,
  },
  field: {
    marginBottom: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: `${ESPRESSO}99`,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: STONE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: ESPRESSO,
    borderWidth: 1,
    borderColor: BORDER,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: TERRACOTTA,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 85, 10, 0.20)',
  },
  submitButtonDisabled: {
    backgroundColor: `${TERRACOTTA}99`,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    color: `${ESPRESSO}66`,
    fontSize: 12,
    marginTop: 24,
  },
});
