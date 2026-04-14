import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { PantryItem } from '@/lib/supabase';
import { ChatMessage } from '@/components/ChatMessage';
import type { Message } from '@/components/ChatMessage';

async function callChefFunction(
  message: string,
  history: { role: 'user' | 'model'; parts: string }[],
  pantryContext: string
) {
  const res = await fetch('/api/generate-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, pantryContext }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Chef error ${res.status}: ${errText}`);
  }
  return res.json();
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 52 + Math.max(insets.bottom, 8);

  const chatHistory = useRef<{ role: 'user' | 'model'; parts: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function loadPantry() {
        const { data } = await supabase
          .from('ai_pantry_snapshot')
          .select('name, category, human_readable_inventory');
        if (data) setPantryItems(data as PantryItem[]);
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

      const data = await callChefFunction(messageText, chatHistory.current, pantryContext);

      chatHistory.current.push({ role: 'user', parts: messageText });
      chatHistory.current.push({ role: 'model', parts: data.text ?? '' });

      const assistantMessage: Message = {
        id: uid(),
        role: 'assistant',
        text: data.text ?? '',
        recipes: data.recipes ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: uid(),
        role: 'assistant',
        text: `Sorry, I encountered an error: ${err.message ?? 'Please check your Gemini API key and try again.'}`,
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <View style={styles.badge}>
            <Sparkles size={12} color="#D2691E" />
            <Text style={[styles.badgeText, { fontFamily: 'Inter_400Regular' }]}>
              Gemini
            </Text>
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

      <View style={[styles.inputContainer, { paddingBottom: TAB_BAR_HEIGHT + 8 }]}>
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
            disabled={!input.trim() || loading}
            style={[
              styles.sendButton,
              { opacity: !input.trim() || loading ? 0.4 : 1 },
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
  badge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(210,105,30,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#D2691E',
    fontSize: 12,
    fontWeight: '600',
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
});
