import { View, Text, StyleSheet } from 'react-native';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '@/lib/gemini';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recipes?: Recipe[];
};

type Props = {
  message: Message;
  onPantryUpdate?: () => void;
};

function tryParseRecipeJson(text: string): { off_topic?: boolean; recipes?: Recipe[] } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && ('recipes' in parsed || 'off_topic' in parsed)) {
      return parsed as { off_topic?: boolean; recipes?: Recipe[] };
    }
  } catch {
    // not valid JSON
  }
  return null;
}

export function ChatMessage({ message, onPantryUpdate }: Props) {
  const isUser = message.role === 'user';

  const parsedJson = !isUser ? tryParseRecipeJson(message.text) : null;
  const recipesFromJson: Recipe[] = parsedJson?.recipes ?? [];
  const allRecipes = [
    ...(recipesFromJson),
    ...(message.recipes ?? []),
  ];

  const displayText = parsedJson ? '' : message.text;

  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAssistant]}>
      {!isUser && (
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🍳</Text>
          </View>
          <Text style={[styles.avatarLabel, { fontFamily: 'Inter_400Regular' }]}>
            AI Chef
          </Text>
        </View>
      )}

      {displayText ? (
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text
            style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant, { fontFamily: 'Inter_400Regular' }]}
          >
            {displayText}
          </Text>
        </View>
      ) : null}

      {!isUser && allRecipes.length > 0 && (
        <View style={styles.recipesContainer}>
          {allRecipes.map((recipe, idx) => (
            <RecipeCard key={idx} recipe={recipe} onCooked={onPantryUpdate} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  containerAssistant: {
    alignItems: 'flex-start',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 12,
  },
  avatarLabel: {
    color: 'rgba(44,24,16,0.5)',
    fontSize: 12,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#D2691E',
    borderTopRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#F5EFE6',
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAssistant: {
    color: '#2C1810',
  },
  recipesContainer: {
    width: '100%',
    marginTop: 8,
  },
});
