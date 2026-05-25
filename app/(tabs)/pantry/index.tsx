import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import type { PantryItem, PantryCategory as PantryCategoryType } from '@/lib/supabase';
import { PantryCategory } from '@/components/PantryCategory';
import { SmartAddBar } from '@/components/SmartAddBar';

function groupByCategory(items: PantryItem[]): PantryCategoryType[] {
  const map: Record<string, PantryItem[]> = {};
  for (const item of items) {
    if (!map[item.category]) map[item.category] = [];
    map[item.category].push(item);
  }
  return Object.entries(map)
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [categories, setCategories] = useState<PantryCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState<'off' | 'pins' | 'delete'>('off');
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchPantry() {
    setError('');
    try {
      const [pantryResult, globalConvResult] = await Promise.all([
        supabase
          .from('user_pantry')
          .select(`
            id,
            current_quantity_value,
            is_permanent,
            ingredients(
              id,
              name,
              category,
              preferred_unit,
              unit_conversions(input_unit, output_value, output_unit)
            )
          `)
          .or('current_quantity_value.gt.0,is_permanent.eq.true')
          .order('id'),
        supabase
          .from('unit_conversions')
          .select('input_unit, output_value, output_unit')
          .is('ingredient_id', null),
      ]);

      if (pantryResult.error) throw pantryResult.error;
      if (globalConvResult.error) throw globalConvResult.error;

      const globalConversions: any[] = globalConvResult.data ?? [];

      const mapped: PantryItem[] = (pantryResult.data ?? []).map((row: any) => {
        const ing = row.ingredients ?? {};
        const preferredUnit: string = ing.preferred_unit ?? '';
        const baseQty: number = parseFloat(row.current_quantity_value ?? '0');

        const ingredientConversions: any[] = ing.unit_conversions ?? [];
        const conv =
          ingredientConversions.find((c: any) => c.input_unit === preferredUnit) ??
          globalConversions.find((c: any) => c.input_unit === preferredUnit);

        const displayQty = conv && conv.output_value
          ? baseQty / parseFloat(conv.output_value)
          : baseQty;

        const rounded = Number.isInteger(displayQty) ? displayQty : parseFloat(displayQty.toFixed(1));

        return {
          id: row.id,
          name: ing.name ?? '',
          category: ing.category ?? 'Other',
          quantity: rounded,
          unit: preferredUnit,
          human_readable_inventory: `${rounded} ${preferredUnit}`.trim(),
          conversionFactor: conv ? parseFloat(conv.output_value) : undefined,
          is_permanent: row.is_permanent ?? false,
        };
      });

      setCategories(groupByCategory(mapped));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load pantry.');
    } finally {
      setLoading(false);
    }
  }

  function findItemInCategories(id: string): PantryItem | null {
    for (const cat of categories) {
      const item = cat.items.find((i) => i.id === id);
      if (item) return item;
    }
    return null;
  }

  async function handleToggle(id: string) {
    if (editMode === 'pins') {
      const item = findItemInCategories(id);
      if (!item) return;
      try {
        const { error: err } = await supabase
          .from('user_pantry')
          .update({ is_permanent: !item.is_permanent })
          .eq('id', id);
        if (err) throw err;
        await fetchPantry();
      } catch (err: any) {
        setError(err.message ?? 'Failed to update item.');
      }
    } else if (editMode === 'delete') {
      setSelectedDeleteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  async function handleDeleteItems() {
    setDeleting(true);
    try {
      const { error: err } = await supabase
        .from('user_pantry')
        .delete()
        .in('id', Array.from(selectedDeleteIds));
      if (err) throw err;
      setSelectedDeleteIds(new Set());
      setShowDeleteConfirm(false);
      await fetchPantry();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete items.');
    } finally {
      setDeleting(false);
    }
  }

  function exitEditMode() {
    setEditMode('off');
    setSelectedDeleteIds(new Set());
    setShowDeleteConfirm(false);
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPantry();
    }, [])
  );

  function handleItemPress(item: PantryItem) {
    router.push({
      pathname: '/(tabs)/pantry/edit-item',
      params: {
        id: item.id,
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit,
        category: item.category,
        conversionFactor: String(item.conversionFactor ?? ''),
        is_permanent: String(item.is_permanent),
      },
    });
  }

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
  const inEditMode = editMode !== 'off';

  return (
    <View className="flex-1 bg-cream">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className={`pb-3 px-6 shadow-sm border-b border-[#E8E0D0] ${
          inEditMode ? 'bg-terracotta' : 'bg-cream'
        }`}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-2xl ${inEditMode ? 'text-white' : 'text-espresso'}`}
            style={{ fontFamily: 'NotoSerif_700Bold' }}
          >
            {inEditMode ? 'Edit Pantry' : 'My Pantry'}
          </Text>
          <TouchableOpacity
            onPress={() => (inEditMode ? exitEditMode() : setEditMode('pins'))}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text
              className={`text-base font-semibold ${inEditMode ? 'text-white' : 'text-terracotta'}`}
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {inEditMode ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {inEditMode && (
          <View className="flex-row mt-4" style={{ gap: 8 }}>
            {(['pins', 'delete'] as const).map((mode) => {
              const label = mode === 'pins' ? 'Manage Pins' : 'Delete Items';
              const active = editMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setEditMode(mode);
                    setSelectedDeleteIds(new Set());
                  }}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: active ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  <Text
                    className="text-white text-sm text-center font-semibold"
                    style={{ fontFamily: 'Inter_400Regular' }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && !inEditMode && (
          <View className="flex-row gap-4 mt-3">
            <View className="bg-terracotta/10 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
              <Text className="text-2xl">🧺</Text>
              <View>
                <Text
                  className="text-terracotta text-lg font-bold leading-tight"
                  style={{ fontFamily: 'NotoSerif_700Bold' }}
                >
                  {totalItems}
                </Text>
                <Text
                  className="text-espresso/60 text-xs"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  ingredients
                </Text>
              </View>
            </View>
            <View className="bg-sage/10 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
              <Text className="text-2xl">📂</Text>
              <View>
                <Text
                  className="text-sage text-lg font-bold leading-tight"
                  style={{ fontFamily: 'NotoSerif_700Bold' }}
                >
                  {categories.length}
                </Text>
                <Text
                  className="text-espresso/60 text-xs"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  categories
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {!inEditMode && <SmartAddBar onItemAdded={fetchPantry} />}

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#D2691E" />
          <Text
            className="text-espresso/60 text-sm"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Loading your pantry...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-3">⚠️</Text>
          <Text
            className="text-espresso text-base text-center"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchPantry}
            className="mt-4 bg-terracotta rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold" style={{ fontFamily: 'Inter_400Regular' }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : categories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🧺</Text>
          <Text
            className="text-espresso text-xl text-center"
            style={{ fontFamily: 'NotoSerif_700Bold' }}
          >
            Your pantry is empty
          </Text>
          <Text
            className="text-espresso/60 text-sm text-center mt-2"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Start adding ingredients to see them here.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: editMode === 'delete' && selectedDeleteIds.size > 0
              ? tabBarHeight + 88
              : tabBarHeight + 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((cat) => (
            <PantryCategory
              key={cat.category}
              category={cat}
              onItemPress={inEditMode ? undefined : handleItemPress}
              editMode={editMode}
              selectedIds={editMode === 'delete' ? selectedDeleteIds : new Set()}
              onToggle={handleToggle}
            />
          ))}
        </ScrollView>
      )}

      {editMode === 'delete' && selectedDeleteIds.size > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: tabBarHeight,
            left: 0,
            right: 0,
            backgroundColor: '#FFFAF5',
            borderTopWidth: 1,
            borderTopColor: '#E8E0D0',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#D2691E',
              borderRadius: 14,
              height: 52,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'NotoSerif_700Bold', fontSize: 16, color: '#fff' }}>
              Delete {selectedDeleteIds.size} {selectedDeleteIds.size === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View style={{ backgroundColor: '#FFFAF5', borderRadius: 16, padding: 24, width: '100%', gap: 8 }}>
            <Text style={{ fontFamily: 'NotoSerif_700Bold', fontSize: 18, color: '#4A3728', textAlign: 'center' }}>
              Delete {selectedDeleteIds.size} {selectedDeleteIds.size === 1 ? 'item' : 'items'}?
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9C8678', textAlign: 'center' }}>
              This can't be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#E8E0D0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: '600', color: '#4A3728' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteItems}
                disabled={deleting}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: '#D2691E',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
