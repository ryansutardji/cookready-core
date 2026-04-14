import { View, Text } from 'react-native';
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

export function ChatMessage({ message, onPantryUpdate }: Props) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && (
        <View className="flex-row items-center gap-2 mb-1.5 ml-1">
          <View className="w-7 h-7 rounded-full bg-terracotta items-center justify-center">
            <Text className="text-white text-xs">🍳</Text>
          </View>
          <Text
            className="text-espresso/50 text-xs"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            AI Chef
          </Text>
        </View>
      )}

      {message.text ? (
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-terracotta rounded-tr-sm'
              : 'bg-stone rounded-tl-sm'
          }`}
        >
          <Text
            className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-espresso'}`}
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {message.text}
          </Text>
        </View>
      ) : null}

      {!isUser && message.recipes && message.recipes.length > 0 && (
        <View className="w-full mt-2">
          {message.recipes.map((recipe, idx) => (
            <RecipeCard key={idx} recipe={recipe} onCooked={onPantryUpdate} />
          ))}
        </View>
      )}
    </View>
  );
}
