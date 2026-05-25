import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Pin } from 'lucide-react-native';
import type { PantryItem, PantryCategory as PantryCategoryType } from '@/lib/supabase';

type Props = {
  category: PantryCategoryType;
  onItemPress?: (item: PantryItem) => void;
  editMode: 'off' | 'pins' | 'delete';
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

const CATEGORY_ICONS: Record<string, string> = {
  Protein: '🥩',
  Vegetable: '🥦',
  Fruit: '🍎',
  Grain: '🌾',
  Oil: '🫒',
  Fat: '🧈',
  Dairy: '🧀',
  Baking: '🍞',
  'Spice/Sauce': '🌶️',
  Pantry: '🫙',
};

function formatInventory(raw: string): string {
  return raw.replace(/(\d+\.\d+)/, (_, num) => {
    const n = parseFloat(num);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  });
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderColor: checked ? '#D2691E' : '#C5B8A8',
        borderRadius: 4,
        backgroundColor: checked ? '#D2691E' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
    </View>
  );
}

export function PantryCategory({ category, onItemPress, editMode, selectedIds, onToggle }: Props) {
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
        {category.items.map((item, idx) => {
          const inEditMode = editMode !== 'off';
          const isChecked = editMode === 'pins' ? item.is_permanent : selectedIds.has(item.id);
          const isLast = idx === category.items.length - 1;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                if (inEditMode) {
                  onToggle(item.id);
                } else {
                  onItemPress?.(item);
                }
              }}
              activeOpacity={0.6}
              className={`flex-row justify-between items-center py-2.5 ${
                !isLast ? 'border-b border-[#EDE8DE]' : ''
              }`}
            >
              <View className="flex-row items-center gap-3 flex-1">
                {inEditMode && <Checkbox checked={isChecked} />}
                <Text
                  className="text-espresso text-sm flex-1"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {item.name}
                </Text>
              </View>

              {!inEditMode && (
                <View className="flex-row items-center gap-2">
                  {item.is_permanent ? (
                    <Pin size={16} color="#D2691E" fill="#D2691E" />
                  ) : (
                    <>
                      <Text
                        className="text-terracotta text-sm font-semibold"
                        style={{ fontFamily: 'Inter_400Regular' }}
                      >
                        {formatInventory(item.human_readable_inventory)}
                      </Text>
                      <ChevronRight size={14} color="#D2691E" />
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
