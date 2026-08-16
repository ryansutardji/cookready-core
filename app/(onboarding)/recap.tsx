import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChefHat, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { computeMeterCounts, groupPantryNamesBySlot } from './build-pantry';
import { SHELVES, EXTRA_SLOTS } from './shelves/ShelfConfig';
import type { MeterSlot } from './shelves/ShelfConfig';
import { ShelfAddPanel } from './shelves/ShelfAddPanel';

type PantrySnapshot = { name: string; category: string }[];

const EMPTY_COUNTS: Record<string, number> = {
  protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0, fruit: 0, baking: 0,
};
const EMPTY_NAMES: Record<string, string[]> = {
  protein: [], vegetable: [], grain: [], spice: [], oil: [], fruit: [], baking: [],
};

export default function RecapScreen() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PantrySnapshot>([]);
  const [meterCounts, setMeterCounts] = useState<Record<string, number>>(EMPTY_COUNTS);
  const [namesBySlot, setNamesBySlot] = useState<Record<string, string[]>>(EMPTY_NAMES);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<MeterSlot | null>(null);

  async function refreshMeter() {
    const { data } = await supabase
      .from('ai_pantry_snapshot')
      .select('name, category');
    const fresh = (data ?? []) as PantrySnapshot;
    setSnapshot(fresh);
    setMeterCounts(computeMeterCounts(fresh));
    setNamesBySlot(groupPantryNamesBySlot(fresh));
    setLoading(false);
  }

  useEffect(() => {
    refreshMeter();
  }, []);

  const totalItems = snapshot.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#D2691E" />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.headline, { fontFamily: 'NotoSerif_700Bold' }]}>
              Your shelves
            </Text>
            <Text style={[styles.subhead, { fontFamily: 'Inter_400Regular' }]}>
              {`${totalItems} item${totalItems === 1 ? '' : 's'}. Enough for me to start. Anything you skipped is one tap away, forever.`}
            </Text>

            <View style={styles.rows}>
              {SHELVES.map((slot) => (
                <RecapRow
                  key={slot.key}
                  slot={slot}
                  count={meterCounts[slot.key] ?? 0}
                  names={namesBySlot[slot.key] ?? []}
                  onAddPress={() => setModalSlot(slot)}
                />
              ))}
            </View>

            <Text style={[styles.extrasLabel, { fontFamily: 'Inter_400Regular' }]}>
              Extras — whenever you feel like it
            </Text>
            <View style={styles.extrasRow}>
              {EXTRA_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot.key}
                  style={styles.extraCard}
                  activeOpacity={0.75}
                  onPress={() => setModalSlot(slot)}
                >
                  <Text style={styles.extraIcon}>{slot.icon}</Text>
                  <Text style={[styles.extraLabel, { fontFamily: 'Inter_400Regular' }]}>
                    {slot.label}
                  </Text>
                  <Text style={[styles.extraAdd, { fontFamily: 'Inter_400Regular' }]}>Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={() => router.replace('/(onboarding)/finish')}
            >
              <ChefHat size={16} color="#fff" />
              <Text style={[styles.ctaBtnText, { fontFamily: 'Inter_400Regular' }]}>
                Show me what I can cook
              </Text>
            </TouchableOpacity>
            <Text style={[styles.caption, { fontFamily: 'Inter_400Regular' }]}>
              Skipped shelves stay in your pantry tab
            </Text>
          </View>
        </>
      )}

      <Modal
        animationType="slide"
        visible={modalSlot !== null}
        onRequestClose={() => setModalSlot(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              {modalSlot?.label}
            </Text>
            <TouchableOpacity
              testID="recap-modal-close"
              style={styles.modalCloseBtn}
              activeOpacity={0.75}
              onPress={() => setModalSlot(null)}
            >
              <X size={20} color="#6B5344" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {modalSlot && <ShelfAddPanel slot={modalSlot} onAdded={refreshMeter} />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// RecapRow — met (checked, filled) vs. unmet (dashed, "skipped" + Add pill)
// ---------------------------------------------------------------------------
type RecapRowProps = {
  slot: MeterSlot;
  count: number;
  names: string[];
  onAddPress: () => void;
};

function RecapRow({ slot, count, names, onAddPress }: RecapRowProps) {
  const met = count >= slot.minCount;

  if (met) {
    return (
      <View style={styles.rowMet}>
        <View style={styles.badgeMet}>
          <Check size={11} color="#fff" />
        </View>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowLabelMet, { fontFamily: 'Inter_400Regular' }]}>
            {slot.label}
          </Text>
          <Text
            style={[styles.rowSummary, { fontFamily: 'Inter_400Regular' }]}
            numberOfLines={1}
          >
            {names.join(', ')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowUnmet}>
      <View style={styles.badgeUnmet}>
        <Text style={styles.badgeUnmetIcon}>{slot.icon}</Text>
      </View>
      <View style={styles.rowTextCol}>
        <Text style={[styles.rowLabelUnmet, { fontFamily: 'Inter_400Regular' }]}>
          {slot.label}
        </Text>
        <Text style={[styles.rowSummary, { fontFamily: 'Inter_400Regular' }]}>skipped</Text>
      </View>
      <TouchableOpacity style={styles.addPill} activeOpacity={0.75} onPress={onAddPress}>
        <Text style={[styles.addPillText, { fontFamily: 'Inter_400Regular' }]}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headline: {
    fontSize: 21,
    color: '#2C1810',
    marginBottom: 6,
  },
  subhead: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: '#6B5344',
    marginBottom: 18,
  },
  rows: { gap: 8 },
  rowMet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  rowUnmet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDCFBB',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  badgeMet: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnmet: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#EAE0D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnmetIcon: { fontSize: 11 },
  rowTextCol: { flex: 1 },
  rowLabelMet: { fontSize: 12.5, color: '#2C1810', fontWeight: '600' },
  rowLabelUnmet: { fontSize: 12.5, color: '#6B5344', fontWeight: '600' },
  rowSummary: { fontSize: 11.5, color: '#9C7B6A', marginTop: 1 },
  addPill: {
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#E0D8CC',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  addPillText: { fontSize: 11.5, color: '#D2691E', fontWeight: '600' },
  extrasLabel: {
    fontSize: 10.5,
    color: '#B8A898',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  extrasRow: { flexDirection: 'row', gap: 8 },
  extraCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDCFBB',
    borderRadius: 13,
    padding: 11,
  },
  extraIcon: { fontSize: 14 },
  extraLabel: { flex: 1, fontSize: 12, color: '#6B5344', fontWeight: '600' },
  extraAdd: { fontSize: 11.5, color: '#D2691E', fontWeight: '600' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#F0EAE0',
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: '#D2691E',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  caption: {
    fontSize: 12,
    color: '#A0856C',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: { flex: 1, backgroundColor: '#FFFAF5' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  modalTitle: { fontSize: 17, color: '#2C1810' },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 16 },
});
