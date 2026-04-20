import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LogOut, RefreshCw } from 'lucide-react-native';
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
  const [categories, setCategories] = useState<PantryCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  async function fetchPantry() {
    setError('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const { data, error: err } = await supabase
        .from('user_pantry')
        .select(`
          id,
          current_quantity_value,
          ingredients(
            id,
            name,
            category,
            preferred_unit,
            unit_conversions(input_unit, output_value, output_unit)
          )
        `)
        .order('id');

      if (err) throw err;

      const mapped: PantryItem[] = (data ?? []).map((row: any) => {
        const ing = row.ingredients ?? {};
        const preferredUnit: string = ing.preferred_unit ?? '';
        const baseQty: number = parseFloat(row.current_quantity_value ?? '0');

        const conversions: any[] = ing.unit_conversions ?? [];
        const conv = conversions.find((c: any) => c.input_unit === preferredUnit);
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
        };
      });

      setCategories(groupByCategory(mapped));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load pantry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPantry();
    }, [])
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPantry();
  }

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
      },
    });
  }

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <View className="flex-1 bg-cream">
      <View className="bg-cream pt-10 pb-3 px-6 shadow-sm border-b border-[#E8E0D0]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              className="text-espresso text-2xl"
              style={{ fontFamily: 'NotoSerif_700Bold' }}
            >
              My Pantry
            </Text>
            {userEmail ? (
              <Text
                className="text-espresso/50 text-xs mt-0.5"
                style={{ fontFamily: 'Inter_400Regular' }}
              >
                {userEmail}
              </Text>
            ) : null}
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleRefresh}
              className="w-9 h-9 rounded-full bg-stone items-center justify-center"
            >
              <RefreshCw size={16} color="#4A3728" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSignOut}
              className="w-9 h-9 rounded-full bg-stone items-center justify-center"
            >
              <LogOut size={16} color="#4A3728" />
            </TouchableOpacity>
          </View>
        </View>

        {!loading && (
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

      <SmartAddBar onItemAdded={fetchPantry} />

      {loading && !refreshing ? (
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
            onPress={handleRefresh}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D2691E"
            />
          }
        >
          {categories.map((cat) => (
            <PantryCategory key={cat.category} category={cat} onItemPress={handleItemPress} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
