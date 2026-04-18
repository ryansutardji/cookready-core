import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChefHat, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import type { Recipe } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

type Props = {
  recipe: Recipe;
  onCooked?: () => void;
};

type CookState = 'idle' | 'cooking' | 'success' | 'error';

export function RecipeCard({ recipe, onCooked }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [cookState, setCookState] = useState<CookState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCookThis() {
    setCookState('cooking');
    setErrorMsg('');

    try {
      for (const ing of recipe.ingredients) {
        const { error } = await supabase.rpc('deplete_pantry_item', {
          p_ingredient_name: ing.name,
          p_quantity: ing.quantity,
          p_unit: ing.unit,
        });
        if (error) throw new Error(`Failed to deplete ${ing.name}: ${error.message}`);
      }
      setCookState('success');
      onCooked?.();
    } catch (err: any) {
      setCookState('error');
      setErrorMsg(err.message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="bg-cream rounded-2xl overflow-hidden shadow-md mb-3 border border-[#E8E0D0]">
      <View className="bg-terracotta/10 px-4 py-3 flex-row items-center gap-2">
        <ChefHat size={18} color="#D2691E" />
        <Text
          className="text-terracotta text-base font-bold flex-1"
          style={{ fontFamily: 'NotoSerif_700Bold' }}
        >
          {recipe.name}
        </Text>
        <View className="flex-row items-center gap-1">
          <Users size={12} color="#708238" />
          <Text className="text-sage text-xs" style={{ fontFamily: 'Inter_400Regular' }}>
            {recipe.servings}
          </Text>
        </View>
      </View>

      <View className="px-4 py-3">
        <Text
          className="text-espresso/70 text-sm italic mb-3"
          style={{ fontFamily: 'NotoSerif_700Bold' }}
        >
          {recipe.description}
        </Text>

        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          className="flex-row items-center mb-2"
        >
          <Text
            className="text-terracotta text-sm font-semibold"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {expanded ? 'Hide details' : 'View ingredients & steps'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <View>
            <Text
              className="text-espresso text-sm font-bold mb-1.5"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              Ingredients
            </Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} className="flex-row items-center gap-2 mb-1">
                <View className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                <Text
                  className="text-espresso text-sm"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {ing.quantity}{(() => {
                    const unit = (ing.unit ?? '').trim().toLowerCase();
                    const name = (ing.name ?? '').trim().toLowerCase();
                    if (!unit || name.includes(unit) || unit.includes(name)) return '';
                    return ` ${ing.unit}`;
                  })()} {ing.name}
                </Text>
              </View>
            ))}

            <Text
              className="text-espresso text-sm font-bold mt-3 mb-1.5"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              Instructions
            </Text>
            {recipe.instructions.map((step, i) => (
              <View key={i} className="flex-row gap-2 mb-2">
                <View className="w-5 h-5 rounded-full bg-terracotta items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">{i + 1}</Text>
                </View>
                <Text
                  className="text-espresso text-sm flex-1 leading-5"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {cookState === 'error' && (
          <View className="flex-row items-center gap-1.5 mt-2 bg-red-50 rounded-xl px-3 py-2">
            <AlertCircle size={14} color="#ef4444" />
            <Text className="text-red-600 text-xs flex-1" style={{ fontFamily: 'Inter_400Regular' }}>
              {errorMsg}
            </Text>
          </View>
        )}

        {cookState === 'success' ? (
          <View className="flex-row items-center justify-center gap-2 mt-3 bg-sage/10 rounded-xl px-4 py-3">
            <CheckCircle size={16} color="#708238" />
            <Text className="text-sage font-semibold text-sm" style={{ fontFamily: 'Inter_400Regular' }}>
              Pantry updated! Enjoy your meal.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleCookThis}
            disabled={cookState === 'cooking'}
            className="mt-3 bg-terracotta rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 shadow-sm"
            style={{ opacity: cookState === 'cooking' ? 0.7 : 1 }}
          >
            {cookState === 'cooking' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ChefHat size={16} color="#fff" />
            )}
            <Text
              className="text-white font-bold text-sm"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {cookState === 'cooking' ? 'Updating pantry...' : 'Cook This'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
