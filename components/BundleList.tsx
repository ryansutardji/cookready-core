import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import type { Bundle } from '@/lib/bundles';

type Props = {
  bundles: Bundle[];
  loading: boolean;
  onSelectBundle: (bundle: Bundle) => void;
  onBrowseAll: () => void;
};

export function BundleList({ bundles, loading, onSelectBundle, onBrowseAll }: Props) {
  if (loading) {
    return (
      <View style={[styles.card, styles.loadingWrap]}>
        <ActivityIndicator size="small" color="#D2691E" />
      </View>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Suggested</Text>
      </View>

      <View>
        {bundles.map((bundle, idx) => (
          <TouchableOpacity
            key={bundle.id}
            style={[styles.row, idx < bundles.length - 1 && styles.rowDivider]}
            onPress={() => onSelectBundle(bundle)}
            activeOpacity={0.7}
          >
            <View style={[styles.emojiTile, { backgroundColor: bundle.color + '1f' }]}>
              <Text style={styles.emojiText}>{bundle.icon}</Text>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleMeta}>
                {bundle.ingredients.length} ingredients · {bundle.tag}
              </Text>
            </View>
            <ChevronRight size={14} color="#D2691E" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.footer} onPress={onBrowseAll} activeOpacity={0.7}>
        <LayoutGrid size={13} color="#D2691E" />
        <Text style={styles.footerText}>Browse all bundles</Text>
        <ChevronRight size={13} color="#D2691E" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFAF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
    marginTop: 8,
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  headerText: {
    fontSize: 11,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  emojiTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 19,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  bundleName: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 14,
    color: '#2C1810',
    lineHeight: 17,
  },
  bundleMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(44,24,16,0.5)',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#EDE8DE',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
    fontSize: 12,
    color: '#D2691E',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
