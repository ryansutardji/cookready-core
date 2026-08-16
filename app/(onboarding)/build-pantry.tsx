import { useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { SHELVES, ALL_SLOTS } from './shelves/ShelfConfig';
import { ShelfScreen } from './shelves/ShelfScreen';
import { SpiceShelf } from './shelves/SpiceShelf';

// ---------------------------------------------------------------------------
// Meter computation (pure — unit-tested in __tests__/build-pantry.test.ts)
// ---------------------------------------------------------------------------
type PantrySnapshot = { name: string; category: string }[];

export function computeMeterCounts(pantry: PantrySnapshot): Record<string, number> {
  const counts: Record<string, number> = {
    protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0, fruit: 0, baking: 0,
  };

  for (const item of pantry) {
    const cat = item.category;
    for (const slot of ALL_SLOTS) {
      if (slot.categories.includes(cat)) {
        counts[slot.key]++;
        break;
      }
    }
  }

  return counts;
}

export function groupPantryNamesBySlot(pantry: PantrySnapshot): Record<string, string[]> {
  const names: Record<string, string[]> = {
    protein: [], vegetable: [], grain: [], spice: [], oil: [], fruit: [], baking: [],
  };

  for (const item of pantry) {
    const cat = item.category;
    for (const slot of ALL_SLOTS) {
      if (slot.categories.includes(cat)) {
        names[slot.key].push(item.name);
        break;
      }
    }
  }

  return names;
}

// ---------------------------------------------------------------------------
// Main screen — paced 5-shelf sequence controller
// ---------------------------------------------------------------------------
export default function BuildPantryScreen() {
  const router = useRouter();
  const [meterCounts, setMeterCounts] = useState<Record<string, number>>({
    protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0, fruit: 0, baking: 0,
  });
  const [meterLoading, setMeterLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // null = resolving resume position

  async function refreshMeter() {
    const { data } = await supabase
      .from('ai_pantry_snapshot')
      .select('name, category');
    const snapshot = (data ?? []) as PantrySnapshot;
    setMeterCounts(computeMeterCounts(snapshot));
    setMeterLoading(false);
  }

  useEffect(() => {
    refreshMeter();
  }, []);

  // Resolve resume position exactly once, after the first meter load — never
  // recompute afterward, or a later refreshMeter() call (triggered by adding
  // an item) would yank the user backward.
  useEffect(() => {
    if (meterLoading || currentIndex !== null) return;
    const firstUnmet = SHELVES.findIndex((s) => (meterCounts[s.key] ?? 0) < s.minCount);
    if (firstUnmet === -1) {
      router.replace('/(onboarding)/recap');
    } else {
      setCurrentIndex(firstUnmet);
    }
  }, [meterLoading]);

  function handleNextShelf() {
    if (currentIndex === null) return;
    if (currentIndex >= SHELVES.length - 1) {
      router.replace('/(onboarding)/recap');
    } else {
      setCurrentIndex((i) => (i as number) + 1);
    }
  }

  const handleSkipSetup = () => router.replace('/(onboarding)/recap');

  if (currentIndex === null) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="small" color="#D2691E" />
      </SafeAreaView>
    );
  }

  const slot = SHELVES[currentIndex];
  const isLast = currentIndex === SHELVES.length - 1;

  if (slot.key === 'spice') {
    return (
      <SpiceShelf
        slot={slot}
        index={currentIndex}
        meterCounts={meterCounts}
        onAdded={refreshMeter}
        onNext={handleNextShelf}
        onSkipSetup={handleSkipSetup}
      />
    );
  }

  return (
    <ShelfScreen
      slot={slot}
      index={currentIndex}
      isLast={isLast}
      meterCounts={meterCounts}
      onAdded={refreshMeter}
      onNext={handleNextShelf}
      onSkipSetup={handleSkipSetup}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
