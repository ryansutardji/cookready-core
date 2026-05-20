import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BUNDLES, type Bundle } from '@/lib/bundles';

type Props = {
  onSelectBundle: (bundle: Bundle) => void;
};

export function BundleList({ onSelectBundle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.countLabel}>{BUNDLES.length} BUNDLES</Text>
      <View style={styles.card}>
        {BUNDLES.map((bundle, idx) => (
          <TouchableOpacity
            key={bundle.id}
            style={[styles.row, idx < BUNDLES.length - 1 && styles.rowDivider]}
            onPress={() => onSelectBundle(bundle)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{bundle.icon}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{bundle.name}</Text>
              <Text style={styles.meta}>
                {bundle.ingredients.length} ingredients · {bundle.tag}
              </Text>
            </View>
            <ChevronRight size={16} color="#C4A882" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  countLabel: {
    fontSize: 11,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
  },
});
