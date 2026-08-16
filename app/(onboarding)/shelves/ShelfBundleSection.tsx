import { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useBundles } from '@/hooks/useBundles';
import { BundleTile } from './BundleTile';

type Props = {
  categories: string[];
  onAdded: () => void;
};

export function ShelfBundleSection({ categories, onAdded }: Props) {
  const { bundles, loading } = useBundles({ primaryCategory: categories });
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#D2691E" />
      </View>
    );
  }

  if (bundles.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { fontFamily: 'Inter_400Regular' }]}>Or grab a bundle</Text>
      {bundles.map((bundle) => (
        <BundleTile
          key={bundle.id}
          bundle={bundle}
          expanded={expandedBundle === bundle.id}
          onToggle={() => setExpandedBundle((prev) => (prev === bundle.id ? null : bundle.id))}
          onAdded={onAdded}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  loadingWrap: {
    marginHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#9C7B6A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
});
