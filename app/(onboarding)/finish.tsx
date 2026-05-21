import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, ChefHat } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function FinishScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleGenerateRecipe() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    } catch {
      // Non-blocking — proceed even if update fails
    } finally {
      setLoading(false);
      router.replace('/(tabs)/chef');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Icon cluster */}
        <View style={styles.iconWrap}>
          <View style={styles.iconInner}>
            <ChefHat size={36} color="#D2691E" />
          </View>
          <View style={styles.sparkleTopRight}>
            <Sparkles size={16} color="#C05621" />
          </View>
        </View>

        <Text style={[styles.headline, { fontFamily: 'NotoSerif_700Bold' }]}>
          Your kitchen is ready.
        </Text>

        <Text style={[styles.body, { fontFamily: 'Inter_400Regular' }]}>
          Let's see what our AI Chef can cook up with your ingredients. Tap below to generate your first recipe.
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {[
            { icon: '🥘', text: 'Recipes built from exactly what you have' },
            { icon: '📉', text: 'Pantry automatically updates when you cook' },
            { icon: '🔖', text: 'Save favourites to your recipe collection' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureText, { fontFamily: 'Inter_400Regular' }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnLoading]}
          onPress={handleGenerateRecipe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text style={[styles.ctaBtnText, { fontFamily: 'Inter_400Regular' }]}>
                Generate my first recipe
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 32,
    position: 'relative',
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FDF0E6',
    borderWidth: 1.5,
    borderColor: '#F0DCC8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: -8,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6D860',
  },
  headline: {
    fontSize: 30,
    color: '#2C1810',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    color: '#6B5344',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F5EFE6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  featureIcon: { fontSize: 20 },
  featureText: { flex: 1, fontSize: 14, color: '#2C1810', lineHeight: 20 },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: '#D2691E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaBtnLoading: { opacity: 0.7 },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
