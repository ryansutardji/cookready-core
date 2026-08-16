import { View, StyleSheet } from 'react-native';
import { SHELVES } from './ShelfConfig';

type Props = {
  currentIndex: number;
  meterCounts: Record<string, number>;
};

// The shelf you're currently on always reads as active/filled, regardless of
// whether you've added anything there yet — you just arrived. A *past* shelf
// (i < currentIndex) is filled only if its contents actually meet its
// minimum; otherwise it renders muted ("skipped, not failed"). This is
// derived purely from pantry contents, not from which button was tapped to
// leave a shelf — there's only one way to leave a shelf (the "Next shelf"
// button), so the shelf's own state is the only source of truth for whether
// it counts as done.
export function ShelfProgressBar({ currentIndex, meterCounts }: Props) {
  return (
    <View style={styles.row}>
      {SHELVES.map((shelf, i) => {
        let color = '#EAE0D2'; // unfilled — not yet reached
        if (i === currentIndex) {
          color = '#D2691E';
        } else if (i < currentIndex) {
          const met = (meterCounts[shelf.key] ?? 0) >= shelf.minCount;
          color = met ? '#D2691E' : '#C8B8A2';
        }
        return <View key={shelf.key} style={[styles.segment, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
