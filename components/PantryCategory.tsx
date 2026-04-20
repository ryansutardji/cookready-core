import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { PantryItem, PantryCategory as PantryCategoryType } from '@/lib/supabase';

type Props = {
  category: PantryCategoryType;
  onItemPress: (item: PantryItem) => void;
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

function formatInventory(raw: string): string {
  return raw.replace(/(\d+\.\d+)/, (_, num) => {
    const n = parseFloat(num);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  });
}

export function PantryCategory({ category, onItemPress }: Props) {
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
          <TouchableOpacity
            key={item.id}
            onPress={() => onItemPress(item)}
            activeOpacity={0.6}
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
            <View className="flex-row items-center gap-2">
              <Text
                className="text-terracotta text-sm font-semibold"
                style={{ fontFamily: 'Inter_400Regular' }}
              >
                {formatInventory(item.human_readable_inventory)}
              </Text>
              <ChevronRight size={14} color="#D2691E" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
