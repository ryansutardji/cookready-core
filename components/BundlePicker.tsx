import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bundle } from '@/lib/bundles';

type Props = {
  visible: boolean;
  bundles: Bundle[];
  loading: boolean;
  onPick: (bundle: Bundle) => void;
  onClose: () => void;
};

export function BundlePicker({ visible, bundles, loading, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const sheetY = useRef(new Animated.Value(700)).current;
  const settledY = useRef(700);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) sheetY.setValue(settledY.current + gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          Animated.timing(sheetY, {
            toValue: 700,
            duration: 220,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            settledY.current = 700;
            onClose();
          });
        } else {
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 14,
          }).start(() => {
            settledY.current = 0;
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      sheetY.setValue(700);
      settledY.current = 700;
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        settledY.current = 0;
      });
    } else {
      setSearchQuery('');
      Animated.timing(sheetY, {
        toValue: 700,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        settledY.current = 700;
      });
    }
  }, [visible]);

  const q = searchQuery.trim().toLowerCase();
  const displayed = q
    ? bundles.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.tag.toLowerCase().includes(q) ||
        b.ingredients.some(i => i.name.toLowerCase().includes(q))
      )
    : bundles;

  function renderItem({ item }: { item: Bundle }) {
    return (
      <TouchableOpacity
        style={styles.bundleCard}
        onPress={() => onPick(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardEmojiTile, { backgroundColor: item.color + '24' }]}>
          <Text style={styles.cardEmoji}>{item.icon}</Text>
        </View>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.ingredients.length} ingredients</Text>
        <View style={styles.tagPillWrap}>
          <Text style={styles.tagPill}>{item.tag}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetY }], paddingBottom: Math.max(20, insets.bottom + 12) }]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>All Bundles</Text>
                <Text style={styles.headerSubtitle}>
                  Choose a bundle to add to your pantry
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={14} color="#2C1810" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Search size={16} color="#9C7B6A" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bundles..."
                placeholderTextColor="#B8A898"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <X size={14} color="#9C7B6A" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#D2691E" />
            </View>
          ) : (
          <FlatList
            key="bundlepicker"
            data={displayed}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,24,16,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7CFC2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    color: '#2C1810',
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(44,24,16,0.7)',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  columnWrapper: {
    gap: 10,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 10,
  },
  bundleCard: {
    flex: 1,
    padding: 14,
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    gap: 8,
  },
  cardEmojiTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardName: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 14,
    color: '#2C1810',
    lineHeight: 17,
  },
  cardCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(44,24,16,0.5)',
  },
  tagPillWrap: {
    alignSelf: 'flex-start',
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPill: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    fontWeight: '600',
    color: '#D2691E',
    backgroundColor: 'rgba(210,105,30,0.10)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
});
