import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShelfProgressBar } from './ShelfProgressBar';
import type { MeterSlot } from './ShelfConfig';

type Props = {
  slot: MeterSlot;
  index: number;
  meterCounts: Record<string, number>;
  onSkipSetup: () => void;
};

export function ShelfHeader({ slot, index, meterCounts, onSkipSetup }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={[styles.stepLabel, { fontFamily: 'Inter_400Regular' }]}>
          Shelf {index + 1} of 5
        </Text>
        <TouchableOpacity onPress={onSkipSetup} activeOpacity={0.7}>
          <Text style={[styles.skipSetup, { fontFamily: 'Inter_400Regular' }]}>Skip setup</Text>
        </TouchableOpacity>
      </View>

      <ShelfProgressBar currentIndex={index} meterCounts={meterCounts} />

      <View style={styles.headingRow}>
        <Text style={styles.headingIcon}>{slot.icon}</Text>
        <Text style={[styles.headingText, { fontFamily: 'NotoSerif_700Bold' }]}>{slot.question}</Text>
      </View>

      <Text style={[styles.subhead, { fontFamily: 'Inter_400Regular' }]}>{slot.subhead}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B5344',
  },
  skipSetup: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D2691E',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  headingIcon: {
    fontSize: 20,
  },
  headingText: {
    fontSize: 21,
    color: '#2C1810',
    flexShrink: 1,
  },
  subhead: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: '#6B5344',
  },
});
