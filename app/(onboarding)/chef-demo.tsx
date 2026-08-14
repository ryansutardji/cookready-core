import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Check } from 'lucide-react-native';
import { ChatMessage } from '@/components/ChatMessage';
import type { Message } from '@/components/ChatMessage';
import { ChatTypingIndicator } from '@/components/ChatTypingIndicator';
import type { Recipe } from '@/lib/gemini';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type SamplePantryItem = { id: string; label: string; icon: string };

const SAMPLE_PANTRY_ITEMS: SamplePantryItem[] = [
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'rice', label: 'Rice', icon: '🍚' },
  { id: 'garlic', label: 'Garlic', icon: '🧄' },
  { id: 'olive-oil', label: 'Olive oil', icon: '🫒' },
  { id: 'salt', label: 'Salt', icon: '🧂' },
];

const DEMO_GREETING: Message = {
  id: 'demo-greeting',
  role: 'assistant',
  text: "Hello, chef! I've checked your pantry and I'm ready to suggest delicious recipes. Just ask me what you'd like to cook, or say something like \"What can I make for dinner tonight?\"",
  recipes: [],
};

const DEMO_QUESTION = 'What can I make for dinner?';

const DEMO_ANSWER_TEXT =
  "You've got eggs, rice, garlic, olive oil, and salt in your pantry — that's everything for a quick fried rice. Here's the recipe:";

const SAMPLE_RECIPE: Recipe = {
  name: 'Garlic Egg Fried Rice',
  description: 'A quick, savory fried rice built from pantry staples — ready in about 20 minutes.',
  servings: 2,
  ingredients: [
    { name: 'cooked rice', quantity: 2, unit: 'cups' },
    { name: 'eggs', quantity: 2, unit: '' },
    { name: 'garlic', quantity: 3, unit: 'cloves' },
    { name: 'olive oil', quantity: 2, unit: 'tbsp' },
    { name: 'salt', quantity: 0.5, unit: 'tsp' },
  ],
  instructions: [
    'Mince the garlic and whisk the eggs in a small bowl.',
    'Heat olive oil in a large pan or wok over medium-high heat.',
    'Add the garlic and cook about 30 seconds, until fragrant.',
    'Push the garlic aside, pour in the eggs, and scramble until just set.',
    'Add the rice, breaking up clumps, and toss everything together.',
    'Season with salt and stir-fry 2–3 minutes until heated through. Serve.',
  ],
};

const STOCK_ITEM_DELAY_MS = 350;
const STOCK_HOLD_MS = 2000;
const CHAR_DELAY_MS = 30;
const SEND_PAUSE_MS = 400;
const THINKING_MS = 4000;

type DemoStep = 'stocking' | 'typing' | 'thinking' | 'answered';

export default function ChefDemoScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [demoStep, setDemoStep] = useState<DemoStep>('stocking');
  const [stockedCount, setStockedCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedRef = useRef(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const itemAnims = useRef(SAMPLE_PANTRY_ITEMS.map(() => new Animated.Value(0))).current;

  function schedule(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay);
    timers.current.push(id);
    return id;
  }

  function startStocking() {
    function reveal(i: number) {
      setStockedCount(i);
      Animated.timing(itemAnims[i - 1], {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      if (i < SAMPLE_PANTRY_ITEMS.length) {
        schedule(() => reveal(i + 1), STOCK_ITEM_DELAY_MS);
      } else {
        schedule(finishStocking, STOCK_HOLD_MS);
      }
    }
    schedule(() => reveal(1), STOCK_ITEM_DELAY_MS);
  }

  function finishStocking() {
    setMessages([DEMO_GREETING]);
    setDemoStep('typing');
    startTyping();
  }

  function startTyping() {
    let i = 0;
    function tick() {
      i += 1;
      setInput(DEMO_QUESTION.slice(0, i));
      if (i < DEMO_QUESTION.length) {
        schedule(tick, CHAR_DELAY_MS);
      } else {
        schedule(sendScriptedMessage, SEND_PAUSE_MS);
      }
    }
    schedule(tick, CHAR_DELAY_MS);
  }

  function sendScriptedMessage() {
    setInput('');
    const userMessage: Message = { id: uid(), role: 'user', text: DEMO_QUESTION };
    setMessages((prev) => [...prev, userMessage]);
    setDemoStep('thinking');
    schedule(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    schedule(revealAnswer, THINKING_MS);
  }

  function revealAnswer() {
    const answerMessage: Message = {
      id: uid(),
      role: 'assistant',
      text: DEMO_ANSWER_TEXT,
      recipes: [SAMPLE_RECIPE],
    };
    setMessages((prev) => [...prev, answerMessage]);
    setDemoStep('answered');
    schedule(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleSkip() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setInput('');
    setStockedCount(SAMPLE_PANTRY_ITEMS.length);
    itemAnims.forEach((anim) => anim.setValue(1));
    const userMessage: Message = { id: uid(), role: 'user', text: DEMO_QUESTION };
    const answerMessage: Message = {
      id: uid(),
      role: 'assistant',
      text: DEMO_ANSWER_TEXT,
      recipes: [SAMPLE_RECIPE],
    };
    setMessages([
      DEMO_GREETING,
      userMessage,
      answerMessage,
    ]);
    setDemoStep('answered');
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startStocking();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🍳</Text>
          </View>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.title, { fontFamily: 'NotoSerif_700Bold' }]}>
              AI Chef
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { fontFamily: 'Inter_400Regular' }]}>
                Demo
              </Text>
            </View>
          </View>
          {demoStep !== 'answered' && (
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Skip demo"
            >
              <Text style={[styles.skipText, { fontFamily: 'Inter_400Regular' }]}>
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {demoStep === 'stocking' ? (
        <View style={styles.stockingContainer}>
          <Text style={[styles.stockingTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            Adding to your sample pantry...
          </Text>
          <View style={styles.stockingList}>
            {SAMPLE_PANTRY_ITEMS.map((item, idx) => {
              const revealed = idx < stockedCount;
              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.stockingRow,
                    {
                      opacity: itemAnims[idx],
                      transform: [
                        {
                          translateY: itemAnims[idx].interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.stockingIcon}>{item.icon}</Text>
                  <Text style={[styles.stockingLabel, { fontFamily: 'Inter_400Regular' }]}>
                    {item.label}
                  </Text>
                  {revealed && <Check size={16} color="#708238" />}
                </Animated.View>
              );
            })}
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} hideCookButton />
          ))}

          {demoStep === 'thinking' && <ChatTypingIndicator />}
        </ScrollView>
      )}

      {demoStep === 'answered' ? (
        <View style={[styles.ctaFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(onboarding)/build-pantry')}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaBtnText, { fontFamily: 'Inter_400Regular' }]}>
              Build your pantry
            </Text>
          </TouchableOpacity>
          <Text style={[styles.ctaHint, { fontFamily: 'Inter_400Regular' }]}>
            Add what's actually in your kitchen.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, 8) + (Platform.OS === 'ios' ? 0 : 8) },
          ]}
        >
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              editable={false}
              placeholder="Ask your chef anything..."
              placeholderTextColor="#B8A898"
              multiline
              style={[styles.textInput, { fontFamily: 'Inter_400Regular' }]}
            />
            <TouchableOpacity
              disabled
              style={[styles.sendButton, { opacity: 0.4 }]}
            >
              <Send size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  header: {
    backgroundColor: '#FFFAF5',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  title: {
    color: '#2C1810',
    fontSize: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C08A2E',
  },
  statusText: {
    color: '#C08A2E',
    fontSize: 12,
  },
  skipText: {
    color: '#D2691E',
    fontSize: 14,
    fontWeight: '600',
  },
  stockingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stockingTitle: {
    fontSize: 16,
    color: '#2C1810',
    marginBottom: 20,
    textAlign: 'center',
  },
  stockingList: {
    width: '100%',
    gap: 10,
  },
  stockingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5EFE6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  stockingIcon: {
    fontSize: 20,
  },
  stockingLabel: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0D8CC',
  },
  textInput: {
    flex: 1,
    color: '#2C1810',
    fontSize: 14,
    paddingVertical: 8,
    maxHeight: 96,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ctaFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
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
  ctaHint: {
    fontSize: 13,
    color: '#A0856C',
  },
});
