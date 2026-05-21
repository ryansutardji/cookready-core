import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefHat, Leaf, Flame, ArrowRight } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Icon cluster */}
        <View style={styles.iconCluster}>
          <View style={[styles.iconBubble, styles.iconBubbleLeft]}>
            <Leaf size={20} color="#708238" />
          </View>
          <View style={[styles.iconBubble, styles.iconBubbleCenter]}>
            <ChefHat size={28} color="#D2691E" />
          </View>
          <View style={[styles.iconBubble, styles.iconBubbleRight]}>
            <Flame size={20} color="#C05621" />
          </View>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { fontFamily: 'NotoSerif_700Bold' }]}>
          Build your{'\n'}meal-ready pantry
        </Text>

        <Text style={[styles.body, { fontFamily: 'Inter_400Regular' }]}>
          Tell us what's in your kitchen and our AI Chef will turn it into real recipes — no grocery run required.
        </Text>

        {/* Steps preview */}
        <View style={styles.steps}>
          {[
            { icon: '📦', label: 'Stock your pantry with bundles or individual items' },
            { icon: '🤖', label: 'AI Chef reads your pantry and suggests meals' },
            { icon: '🍳', label: 'Cook and the app tracks what you use' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={[styles.stepLabel, { fontFamily: 'Inter_400Regular' }]}>{step.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/(onboarding)/build-pantry')}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaBtnText, { fontFamily: 'Inter_400Regular' }]}>
            Get Started
          </Text>
          <ArrowRight size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.footerHint, { fontFamily: 'Inter_400Regular' }]}>
          Takes about 2 minutes
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    justifyContent: 'center',
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  iconBubble: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  iconBubbleLeft: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginBottom: 8,
  },
  iconBubbleCenter: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FDF0E6',
    borderColor: '#E8D5C0',
  },
  iconBubbleRight: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginBottom: 8,
  },
  headline: {
    fontSize: 34,
    color: '#2C1810',
    lineHeight: 42,
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#6B5344',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 36,
  },
  steps: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F5EFE6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  stepIcon: {
    fontSize: 22,
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 10,
    alignItems: 'center',
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
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerHint: {
    fontSize: 13,
    color: '#A0856C',
  },
});
