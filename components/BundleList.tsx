import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BUNDLES, type Bundle } from '@/lib/bundles';

type Props = {
  query: string;
  onSelectBundle: (bundle: Bundle) => void;
  onBrowseAll: () => void;
};

export function BundleList({ query, onSelectBundle, onBrowseAll }: Props) {
  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);
  // Measured from the first rendered row — avoids hardcoding a dp constant that
  // may not match the actual font/layout metrics on the device.
  const [rowH, setRowH] = useState(0);

  const q = query.trim().toLowerCase();
  const filtered = BUNDLES.filter(
    (b) =>
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.tag.toLowerCase().includes(q) ||
      b.ingredients.some((i) => i.name.toLowerCase().includes(q))
  );

  const clipH = rowH > 0 ? rowH * 4.5 : undefined; // 4.5 rows — clips halfway into the 5th row's name text regardless of font height
  const overflowing = filtered.length > 4;

  function handleScroll(e: any) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setAtTop(contentOffset.y < 4);
    setAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 4);
  }

  const countLabel =
    filtered.length === 1
      ? `1 bundle${q ? ' found' : ''}`
      : `${filtered.length} bundles${q ? ' found' : ''}`;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{countLabel}</Text>
      </View>

      {filtered.length > 0 ? (
        <View style={{ position: 'relative' }}>
          <ScrollView
            style={overflowing && clipH != null ? { height: clipH } : undefined}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((bundle, idx) => (
              <TouchableOpacity
                key={bundle.id}
                style={[styles.row, idx < filtered.length - 1 && styles.rowDivider]}
                onPress={() => onSelectBundle(bundle)}
                onLayout={
                  idx === 0 && rowH === 0
                    ? (e) => setRowH(e.nativeEvent.layout.height)
                    : undefined
                }
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
          </ScrollView>

          {overflowing && !atBottom && !atTop && (
            <LinearGradient
              colors={['rgba(255,250,245,0)', '#FFFAF5']}
              pointerEvents="none"
              style={styles.fadeOverlay}
            />
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No bundles match “{query}”.</Text>
        </View>
      )}

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
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
  },
  emptyState: {
    paddingVertical: 26,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(44,24,16,0.5)',
    textAlign: 'center',
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
});
