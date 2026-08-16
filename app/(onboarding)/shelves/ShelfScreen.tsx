import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShelfHeader } from './ShelfHeader';
import { ShelfFooter } from './ShelfFooter';
import { ShelfAddPanel } from './ShelfAddPanel';
import type { MeterSlot } from './ShelfConfig';

type Props = {
  slot: MeterSlot;
  index: number;
  isLast: boolean;
  meterCounts: Record<string, number>;
  onAdded: () => void;
  onNext: () => void;
  onSkipSetup: () => void;
};

// Generic shelf screen used for Protein / Veggie / Grain / Oil. Spice has its
// own bespoke screen (SpiceShelf) since it needs a live count chip and
// suggestion pills.
export function ShelfScreen({ slot, index, isLast, meterCounts, onAdded, onNext, onSkipSetup }: Props) {
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
        <ShelfAddPanel slot={slot} onAdded={onAdded} />

        <View style={styles.reassurance}>
          <Text style={[styles.reassuranceText, { fontFamily: 'Inter_400Regular' }]}>
            Five shelves, ten seconds each. Skip any of them — I'll work with what you leave me.
          </Text>
        </View>

        {/* Spacer so content clears the fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <ShelfFooter isLast={isLast} onNext={onNext} />
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
  reassurance: {
    marginHorizontal: 16,
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDCFBB',
    borderRadius: 14,
    padding: 12,
  },
  reassuranceText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#8A705C',
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
