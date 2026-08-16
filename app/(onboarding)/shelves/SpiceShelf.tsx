import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ShelfHeader } from './ShelfHeader';
import { ShelfFooter } from './ShelfFooter';
import { ShelfAddPanel } from './ShelfAddPanel';
import type { MeterSlot } from './ShelfConfig';

type Props = {
  slot: MeterSlot;
  index: number;
  meterCounts: Record<string, number>;
  onAdded: () => void;
  onNext: () => void;
  onSkipSetup: () => void;
};

// Exact ingredient names + hardcoded fallback units per the seed migration's
// base_unit/preferred_unit tuples. The live lookup below (useEffect) always
// takes precedence when it resolves — these are only used as pill labels.
const SUGGESTION_PILLS: { label: string; ingredientName: string }[] = [
  { label: 'cumin', ingredientName: 'Cumin (Ground)' },
  { label: 'red pepper flakes', ingredientName: 'Crushed Red Pepper Flakes' },
  { label: 'sriracha', ingredientName: 'Sriracha' },
  { label: 'rice vinegar', ingredientName: 'Rice Vinegar' },
];

export function SpiceShelf({ slot, index, meterCounts, onAdded, onNext, onSkipSetup }: Props) {
  const count = meterCounts[slot.key] ?? 0;

  // Maps ingredient name -> preferred_unit, resolved once on mount via a
  // single lookup query. Pills no-op until this resolves.
  const [unitByName, setUnitByName] = useState<Record<string, string> | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadUnits() {
      const { data } = await supabase
        .from('ingredients')
        .select('name, preferred_unit')
        .in('name', SUGGESTION_PILLS.map((p) => p.ingredientName))
        .is('user_id', null);
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        map[row.name] = row.preferred_unit;
      }
      setUnitByName(map);
    }
    loadUnits();
    return () => { cancelled = true; };
  }, []);

  async function handlePillPress(ingredientName: string) {
    if (!unitByName || addingName) return; // no-op until lookup resolves / while another add is in flight
    const unit = unitByName[ingredientName];
    if (!unit) return;
    setAddingName(ingredientName);
    try {
      const { error } = await supabase.rpc('add_pantry_item', {
        p_ingredient_name: ingredientName,
        p_quantity: 1,
        p_unit: unit,
      });
      if (error) throw error;
      onAdded();
    } finally {
      setAddingName(null);
    }
  }

  const filledSegments = Math.min(count, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topFixed}>
        <ShelfHeader slot={slot} index={index} meterCounts={meterCounts} onSkipSetup={onSkipSetup} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.countChip}>
          <View style={styles.miniBar}>
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={[styles.miniSegment, i < filledSegments ? styles.miniSegmentFilled : styles.miniSegmentEmpty]}
              />
            ))}
          </View>
          <Text style={[styles.countText, { fontFamily: 'Inter_400Regular' }]}>{count} on the shelf</Text>
        </View>

        <ShelfAddPanel slot={slot} onAdded={onAdded} />

        <View style={styles.pillsRow}>
          {SUGGESTION_PILLS.map((pill) => (
            <TouchableOpacity
              key={pill.ingredientName}
              style={styles.pill}
              onPress={() => handlePillPress(pill.ingredientName)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, { fontFamily: 'Inter_400Regular' }]}>{pill.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spacer so content clears the fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <ShelfFooter isLast={false} onNext={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  topFixed: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
    zIndex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 16,
    gap: 12,
  },
  countChip: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDF0E6',
    borderWidth: 1,
    borderColor: '#EFD6BC',
    borderRadius: 14,
    padding: 11,
  },
  miniBar: {
    flexDirection: 'row',
    gap: 4,
  },
  miniSegment: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  miniSegmentFilled: { backgroundColor: '#D2691E' },
  miniSegmentEmpty: { backgroundColor: '#EFD6BC' },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C05621',
  },
  pillsRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A3728',
  },
  footer: {
    // SafeAreaView's edges={['top','bottom']} above already reserves the
    // real device inset (Android 3-button/gesture nav, iOS home indicator) —
    // this is just breathing room on top of that, not a guess at the inset
    // itself, so one value works for both platforms.
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#F0EAE0',
  },
});
