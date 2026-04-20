import { View, Text } from 'react-native';
import type { PantryCategory as PantryCategoryType } from '@/lib/supabase';

type Props = {
  category: PantryCategoryType;
};

const CATEGORY_ICONS: Record<string, string> = {
  Produce: '🥦',
  Dairy: '🧀',
  Meat: '🥩',
  Seafood: '🐟',
  Grains: '🌾',
  Pantry: '🫙',
  Spices: '🌶️',
  Beverages: '🫖',
  Frozen: '❄️',
  Bakery: '🍞',
  Condiments: '🫒',
  Snacks: '🥨',
  Other: '📦',
};

export function PantryCategory({ category }: Props) {
  const icon = CATEGORY_ICONS[category.category] ?? '📦';

  return (
    <View className="mb-4 rounded-2xl bg-stone overflow-hidden shadow-sm">
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-[#E8E0D0]">
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text
          className="text-espresso font-bold text-base"
          style={{ fontFamily: 'NotoSerif_700Bold' }}
        >
          {category.category}
        </Text>
        <View className="ml-auto bg-terracotta/10 rounded-full px-2 py-0.5">
          <Text className="text-terracotta text-xs font-semibold">
            {category.items.length}
          </Text>
        </View>
      </View>

      <View className="px-4 py-2">
        {category.items.map((item, idx) => (
          <View
            key={item.name}
            className={`flex-row justify-between items-center py-2.5 ${
              idx < category.items.length - 1 ? 'border-b border-[#EDE8DE]' : ''
            }`}
          >
            <Text
              className="text-espresso text-sm flex-1"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {item.name}
            </Text>
            <Text
              className="text-terracotta text-sm font-semibold ml-4"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {item.human_readable_inventory}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
