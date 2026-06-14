import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { PantryItem } from '@/lib/supabase';
import { ChatMessage } from '@/components/ChatMessage';
import type { Message } from '@/components/ChatMessage';
import { RecipeLimitIndicator } from '@/components/RecipeLimitIndicator';

function getResetTimeString(): string {
  const now = new Date();
  // Find next midnight in America/Los_Angeles by checking hour-by-hour forward
  // More reliably: compute via known UTC offset
  // PST = UTC-8, PDT = UTC-7. Get tomorrow midnight LA in UTC:
  const laDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const [y, m, d] = laDateStr.split('-').map(Number);
  // Try both UTC-8 and UTC-7 offsets to find which produces midnight in LA
  for (const offsetHours of [8, 7]) {
    const candidate = new Date(Date.UTC(y, m - 1, d + 1, offsetHours, 0, 0));
    const check = candidate.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const [cy, cm, cd] = check.split('-').map(Number);
    if (cd === d + 1 || (d === 31 && cd === 1)) { // handles month rollover roughly
      // Verify hour is 0 in LA
      const hourInLA = parseInt(
        candidate.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false })
      );
      if (hourInLA === 0 || hourInLA === 24) {
        return candidate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
    }
  }
  // Fallback: just return "12:00 AM" (midnight PST is 12:00 AM local for PST users)
  return '12:00 AM';
}

async function callChefFunction(
  message: string,
  history: { role: 'user' | 'model'; parts: string }[],
  pantryContext: string,
  sessionId: string,
  isSafetyDeclineRepeat: boolean
) {
  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { message, history, pantryContext, sessionId, isSafetyDeclineRepeat },
  });

  if (error) {
    // Parse the structured error body before falling back to a generic message.
    try {
      const body = await (error as any).context?.json();
      if (body?.error === 'daily_limit_reached') {
        throw new Error('DAILY_LIMIT_REACHED');
      }
    } catch (parseErr: any) {
      // Re-throw if it's already our sentinel error, otherwise fall through.
      if (parseErr.message === 'DAILY_LIMIT_REACHED') throw parseErr;
    }
    throw new Error(`Chef error: ${error.message}`);
  }

  if (!data) {
    throw new Error('No response from Chef');
  }

  return data;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Hello, chef! I've checked your pantry and I'm ready to suggest delicious recipes. Just ask me what you'd like to cook, or say something like \"What can I make for dinner tonight?\"",
  recipes: [],
};

const SUGGESTIONS = [
  'What can I make for dinner?',
  'Suggest a quick breakfast',
  'Something with vegetables?',
  'Give me a comfort food recipe',
];

export default function ChefScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showAbuseModal, setShowAbuseModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 52 + Math.max(insets.bottom, 8);

  const chatHistory = useRef<{ role: 'user' | 'model'; parts: string }[]>([]);
  const offTopicCount = useRef(0);
  const safetyDeclineCount = useRef(0);
  const sessionId = useRef(uuidv4());

  useFocusEffect(
    useCallback(() => {
      async function loadPantry() {
        const { data } = await supabase
          .from('ai_pantry_snapshot')
          .select('name, category, human_readable_inventory');
        if (data) setPantryItems(data as PantryItem[]);

        // Load profile unlimited flag
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('unlimited_recipes')
            .eq('id', user.id)
            .single();
          const unlimited = profile?.unlimited_recipes === true;
          setIsUnlimited(unlimited);

          if (!unlimited) {
            const pstDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
            const { data: usage } = await supabase
              .from('daily_ai_usage')
              .select('recipe_count')
              .eq('usage_date', pstDate)
              .maybeSingle();
            setDailyRemaining(Math.max(0, 5 - (usage?.recipe_count ?? 0)));
          }
        }
      }
      loadPantry();
    }, [])
  );

  async function handleSend(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput('');

    const userMessage: Message = {
      id: uid(),
      role: 'user',
      text: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const pantryContext = pantryItems.length === 0
        ? 'The pantry is currently empty.'
        : pantryItems.map((i) => `${i.category}: ${i.name} (${i.human_readable_inventory})`).join('\n');

      const data = await callChefFunction(messageText, chatHistory.current, pantryContext, sessionId.current, safetyDeclineCount.current > 0);

      const responseText: string = data.text ?? '';
      const recipes = data.recipes ?? [];
      const offTopic: boolean = data.offTopic === true;
      const safetyDecline: string | null = data.safetyDecline ?? null;
      const deferred: boolean = data.deferred === true;

      chatHistory.current.push({ role: 'user', parts: messageText });
      chatHistory.current.push({ role: 'model', parts: responseText });

      const assistantMessage: Message = {
        id: uid(),
        role: 'assistant',
        text: responseText,
        recipes,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const lowerText = responseText.toLowerCase();
      const isOffTopic =
        offTopic ||
        lowerText.includes("only able to help with recipes") ||
        lowerText.includes("only here to help with") ||
        lowerText.includes("i can only assist with") ||
        lowerText.includes("i'm only able to") ||
        lowerText.includes("i can't help with that") ||
        lowerText.includes("outside of my expertise") ||
        lowerText.includes("i can only help with") ||
        lowerText.includes("not something i can help") ||
        lowerText.includes("only help with cooking") ||
        lowerText.includes("cooking and recipes") && lowerText.includes("only") ||
        lowerText.includes("politely decline");

      if (safetyDecline) {
        safetyDeclineCount.current += 1;
        if (safetyDeclineCount.current > 1) {
          offTopicCount.current += 1;
          if (offTopicCount.current === 3) setShowAbuseModal(true);
          else if (offTopicCount.current === 4) setShowWarningModal(true);
          else if (offTopicCount.current >= 5) setShowLogoutModal(true);
        }
      } else if (isOffTopic) {
        // Off-topic — counts toward session logout, not daily quota.
        offTopicCount.current += 1;
        if (offTopicCount.current === 3) {
          setShowAbuseModal(true);
        } else if (offTopicCount.current === 4) {
          setShowWarningModal(true);
        } else if (offTopicCount.current >= 5) {
          setShowLogoutModal(true);
        }
      } else if (deferred) {
        // User explicitly asked to hold off on a recipe — free pass, tracked server-side.
      } else {
        // Real recipe — decrement daily quota display.
        if (!isUnlimited) {
          setDailyRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);
        }
      }
    } catch (err: any) {
      const isDailyLimit = err.message === 'DAILY_LIMIT_REACHED';
      if (isDailyLimit) setDailyRemaining(0);
      const errorMessage: Message = {
        id: uid(),
        role: 'assistant',
        text: isDailyLimit
          ? "You've reached your 5 daily AI Chef requests. Your limit resets at midnight PST — come back tomorrow for more recipe ideas!"
          : `Sorry, I encountered an error: ${err.message ?? 'Please check your Gemini API key and try again.'}`,
        recipes: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  async function refreshPantry() {
    const { data } = await supabase
      .from('ai_pantry_snapshot')
      .select('name, category, human_readable_inventory');
    if (data) setPantryItems(data as PantryItem[]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      enabled={Platform.OS === 'ios'}
      keyboardVerticalOffset={TAB_BAR_HEIGHT}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🍳</Text>
          </View>
          <View>
            <Text style={[styles.title, { fontFamily: 'NotoSerif_700Bold' }]}>
              AI Chef
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { fontFamily: 'Inter_400Regular' }]}>
                {pantryItems.length} ingredients available
              </Text>
            </View>
          </View>
        </View>
      </View>

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
          <ChatMessage key={msg.id} message={msg} onPantryUpdate={refreshPantry} />
        ))}

        {loading && (
          <View style={styles.thinkingContainer}>
            <View style={styles.thinkingAvatar}>
              <View style={styles.thinkingAvatarInner}>
                <Text style={styles.thinkingAvatarText}>🍳</Text>
              </View>
            </View>
            <View style={styles.thinkingBubble}>
              <ActivityIndicator size="small" color="#D2691E" />
              <Text
                style={[styles.thinkingText, { fontFamily: 'NotoSerif_700Bold' }]}
              >
                Thinking up something delicious...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {messages.length === 1 && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContent}
          style={styles.suggestions}
        >
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleSend(s)}
              style={styles.suggestionChip}
            >
              <Text
                style={[styles.suggestionText, { fontFamily: 'Inter_400Regular' }]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={showAbuseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbuseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              A Gentle Reminder
            </Text>
            <Text style={[styles.modalBody, { fontFamily: 'Inter_400Regular' }]}>
              It looks like you've been asking me about topics outside of cooking and recipes. I'm here solely to help you discover delicious meals using your pantry ingredients. Please keep our conversation focused on food so I can be as helpful as possible.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAbuseModal(false)}
            >
              <Text style={[styles.modalButtonText, { fontFamily: 'Inter_400Regular' }]}>
                Understood
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              This Is Your Final Warning
            </Text>
            <Text style={[styles.modalBody, { fontFamily: 'Inter_400Regular' }]}>
              You've continued to ask about things I'm not here for. I truly enjoy helping you cook wonderful meals — but if this continues, I'll have no choice but to log you out. One more off-topic message and we'll have to part ways, at least for now.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={[styles.modalButtonText, { fontFamily: 'Inter_400Regular' }]}>
                I'll Stay on Topic
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              Logging You Out
            </Text>
            <Text style={[styles.modalBody, { fontFamily: 'Inter_400Regular' }]}>
              It seems our kitchen wasn't the right fit today. You've been logged out due to repeated misuse of the AI Chef. We hope to welcome you back when you're ready to cook something wonderful.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                setShowLogoutModal(false);
                try { await supabase.rpc('apply_abuse_lockout'); } catch (_) {}
                await supabase.auth.signOut();
              }}
            >
              <Text style={[styles.modalButtonText, { fontFamily: 'Inter_400Regular' }]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.inputContainer, { paddingBottom: TAB_BAR_HEIGHT + 8 }]}>
        {!isUnlimited && dailyRemaining !== null && (
          <RecipeLimitIndicator
            remaining={dailyRemaining}
            resetTime={getResetTimeString()}
          />
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your chef anything..."
            placeholderTextColor="#B8A898"
            multiline
            maxLength={500}
            style={[styles.textInput, { fontFamily: 'Inter_400Regular' }]}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || loading || (!isUnlimited && dailyRemaining === 0)}
            style={[
              styles.sendButton,
              { opacity: !input.trim() || loading || (!isUnlimited && dailyRemaining === 0) ? 0.4 : 1 },
            ]}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  header: {
    backgroundColor: '#FFFAF5',
    paddingTop: 48,
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
    backgroundColor: '#7A9E7E',
  },
  statusText: {
    color: '#7A9E7E',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
  },
  thinkingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  thinkingAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  thinkingAvatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingAvatarText: {
    color: '#fff',
    fontSize: 12,
  },
  thinkingBubble: {
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    color: 'rgba(44,24,16,0.6)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  suggestions: {
    flexGrow: 0,
    flexShrink: 0,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  suggestionChip: {
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E0D8CC',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionText: {
    color: '#2C1810',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#FFFAF5',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#2C1810',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: '#5C4033',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
