import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

type Props = {
  isLast: boolean;
  onNext: () => void;
};

// Single button — whether a shelf reads as "done" or "skipped" is decided by
// its actual contents (see ShelfProgressBar), not by which button someone
// tapped to leave it, so a separate "Skip shelf" action would just be a
// second way to trigger the exact same transition.
export function ShelfFooter({ isLast, onNext }: Props) {
  return (
    <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
      <Text style={[styles.nextBtnText, { fontFamily: 'Inter_400Regular' }]}>
        {isLast ? 'Last shelf' : 'Next shelf'}
      </Text>
      <ArrowRight size={15} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D2691E',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
  },
});
