import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, ChefHat } from 'lucide-react-native';

type MissingKey = 'protein' | 'vegetable' | 'grain' | 'spice' | 'oil';

const SLOT_LABELS: Record<string, string> = {
  protein: 'protein',
  vegetable: 'vegetables',
  grain: 'grains',
  spice: 'spices & sauces',
  oil: 'an oil or fat',
};

const BESPOKE_MESSAGES: Record<string, { headline: string; body: string; tip: string }> = {
  protein: {
    headline: "You're almost there — just missing a protein.",
    body: "Proteins are the star of any meal. Think chicken, beef, salmon, eggs, or even chickpeas. Just one source gives the AI Chef enough to build a proper dish around.",
    tip: "Try: chicken breast, ground beef, eggs, lentils, or tofu.",
  },
  vegetable: {
    headline: "A vegetable or two will round things out.",
    body: "Vegetables add colour, texture, and nutrition to every dish. Even a single type opens up a surprising number of recipe possibilities.",
    tip: "Try: onion, garlic, spinach, bell pepper, or zucchini.",
  },
  grain: {
    headline: "A grain will give your meals some real substance.",
    body: "Grains are the backbone of most satisfying meals — from pasta nights to rice bowls. Even a single staple transforms what the AI Chef can suggest.",
    tip: "Try: rice, pasta, bread, oats, or quinoa.",
  },
  spice: {
    headline: "Your pantry needs a little more seasoning.",
    body: "Spices and sauces are what separate a bland meal from a memorable one. We recommend at least 5 — a few basics go a very long way.",
    tip: "Try: salt, pepper, garlic powder, olive oil, soy sauce, and paprika.",
  },
  oil: {
    headline: "You'll need at least one cooking fat.",
    body: "Oil or butter is used in almost every recipe — for sautéing, roasting, and finishing dishes. It's one of the most essential pantry items.",
    tip: "Try: olive oil, vegetable oil, butter, or coconut oil.",
  },
};

function getCompositeMessage(keys: MissingKey[]): { headline: string; body: string; tip?: string } {
  if (keys.length === 1) {
    return BESPOKE_MESSAGES[keys[0]] ?? {
      headline: "Almost there!",
      body: "Adding a few more ingredients will unlock better recipe suggestions from your AI Chef.",
    };
  }

  const labels = keys.map((k) => SLOT_LABELS[k] ?? k);
  const listed = labels.length === 2
    ? `${labels[0]} and ${labels[1]}`
    : labels.slice(0, -1).join(', ') + ', and ' + labels[labels.length - 1];

  if (keys.length === 5) {
    return {
      headline: "Let's build a more complete pantry.",
      body: "Right now your AI Chef is working with limited options. Adding items across all categories — proteins, vegetables, grains, spices, and an oil — means you'll get recipes that are actually satisfying to cook.",
    };
  }

  return {
    headline: "You're missing a few essentials.",
    body: `Adding ${listed} will give your AI Chef a much stronger foundation to work from. Even small additions in these areas lead to noticeably better recipe suggestions.`,
  };
}

export default function MissingIngredientsScreen() {
  const router = useRouter();
  const { missing } = useLocalSearchParams<{ missing: string }>();
  const missingKeys = (missing ?? '').split(',').filter(Boolean) as MissingKey[];
  const { headline, body, tip } = getCompositeMessage(missingKeys);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <ChefHat size={32} color="#D2691E" />
        </View>

        {/* Missing slots */}
        <View style={styles.missingSlots}>
          {missingKeys.map((key) => (
            <View key={key} style={styles.missingChip}>
              <Text style={[styles.missingChipText, { fontFamily: 'Inter_400Regular' }]}>
                {SLOT_LABELS[key] ?? key}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.headline, { fontFamily: 'NotoSerif_700Bold' }]}>{headline}</Text>
        <Text style={[styles.body, { fontFamily: 'Inter_400Regular' }]}>{body}</Text>

        {tip && (
          <View style={styles.tipCard}>
            <Text style={[styles.tipLabel, { fontFamily: 'Inter_400Regular' }]}>Suggestions</Text>
            <Text style={[styles.tipText, { fontFamily: 'Inter_400Regular' }]}>{tip}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={17} color="#fff" />
          <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_400Regular' }]}>
            Add more ingredients
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(onboarding)/finish')}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryBtnText, { fontFamily: 'Inter_400Regular' }]}>
            Cook with what I have anyway
          </Text>
          <ArrowRight size={14} color="#A0856C" />
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
    paddingTop: 32,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FDF0E6',
    borderWidth: 1,
    borderColor: '#F0DCC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  missingSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  missingChip: {
    backgroundColor: '#FEF3CD',
    borderWidth: 1,
    borderColor: '#F6D860',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  missingChipText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  headline: {
    fontSize: 24,
    color: '#2C1810',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    color: '#6B5344',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#F5EFE6',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  tipLabel: {
    fontSize: 10,
    color: '#9C7B6A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#2C1810',
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#D2691E',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    color: '#A0856C',
    fontWeight: '600',
  },
});
