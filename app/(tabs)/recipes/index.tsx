import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Archive, ChevronRight, TriangleAlert as AlertTriangle, Bookmark } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { SavedRecipe } from '@/lib/supabase';

type RecipeWithCookability = SavedRecipe & { is_able_to_cook: boolean };

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeWithCookability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function fetchRecipes(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('is_archived', showArchived)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Could not load recipes.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rows = (data ?? []) as SavedRecipe[];

    // Compute cookability for each recipe in parallel
    const withCookability = await Promise.all(
      rows.map(async (r) => {
        const { data: canCook } = await supabase.rpc('check_recipe_cookability', {
          p_recipe_id: r.id,
        });
        return { ...r, is_able_to_cook: canCook === true };
      })
    );

    setRecipes(withCookability);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [showArchived])
  );

  async function handleArchive(id: string) {
    setArchivingId(id);
    await supabase
      .from('saved_recipes')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setArchivingId(null);
  }

  async function handleUnarchive(id: string) {
    setArchivingId(id);
    await supabase
      .from('saved_recipes')
      .update({ is_archived: false, archived_at: null })
      .eq('id', id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setArchivingId(null);
  }

  function renderItem({ item }: { item: RecipeWithCookability }) {
    const isArchiving = archivingId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => router.push(`/(tabs)/recipes/${item.id}`)}
          activeOpacity={0.75}
        >
          <View style={styles.cardLeft}>
            <Text style={[styles.recipeName, { fontFamily: 'NotoSerif_700Bold' }]} numberOfLines={2}>
              {item.recipe_name}
            </Text>
            {item.description ? (
              <Text style={[styles.description, { fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {!item.is_able_to_cook && (
              <View style={styles.missingBadge}>
                <AlertTriangle size={11} color="#B45309" />
                <Text style={[styles.missingText, { fontFamily: 'Inter_400Regular' }]}>
                  Missing ingredients
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardRight}>
            <ChevronRight size={18} color="#A0856C" />
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          {!showArchived ? (
            <TouchableOpacity
              style={styles.archiveBtn}
              onPress={() => handleArchive(item.id)}
              disabled={isArchiving}
              activeOpacity={0.7}
            >
              {isArchiving ? (
                <ActivityIndicator size="small" color="#A0856C" />
              ) : (
                <>
                  <Archive size={13} color="#A0856C" />
                  <Text style={[styles.archiveBtnText, { fontFamily: 'Inter_400Regular' }]}>
                    Archive
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.archiveBtn}
              onPress={() => handleUnarchive(item.id)}
              disabled={isArchiving}
              activeOpacity={0.7}
            >
              {isArchiving ? (
                <ActivityIndicator size="small" color="#A0856C" />
              ) : (
                <>
                  <Bookmark size={13} color="#A0856C" />
                  <Text style={[styles.archiveBtnText, { fontFamily: 'Inter_400Regular' }]}>
                    Restore
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { fontFamily: 'NotoSerif_700Bold' }]}>Recipes</Text>
          <Text style={[styles.subheading, { fontFamily: 'Inter_400Regular' }]}>
            {recipes.length} {showArchived ? 'archived' : 'saved'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleArchive, showArchived && styles.toggleArchiveActive]}
          onPress={() => {
            setShowArchived((v) => !v);
          }}
          activeOpacity={0.7}
        >
          <Archive size={14} color={showArchived ? '#D2691E' : '#A0856C'} />
          <Text
            style={[
              styles.toggleArchiveText,
              { fontFamily: 'Inter_400Regular', color: showArchived ? '#D2691E' : '#A0856C' },
            ]}
          >
            {showArchived ? 'Showing archived' : 'Archived'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <AlertTriangle size={14} color="#ef4444" />
          <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D2691E" />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRecipes(true)}
              tintColor="#D2691E"
              colors={['#D2691E']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#E8E0D0" />
              <Text style={[styles.emptyTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
                {showArchived ? 'No archived recipes' : 'No saved recipes yet'}
              </Text>
              <Text style={[styles.emptyBody, { fontFamily: 'Inter_400Regular' }]}>
                {showArchived
                  ? "You haven't archived any recipes."
                  : 'Ask the AI Chef for ideas, then tap the bookmark icon to save a recipe here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  heading: {
    fontSize: 28,
    color: '#2C1810',
    fontWeight: '700',
  },
  subheading: {
    fontSize: 13,
    color: '#A0856C',
    marginTop: 2,
  },
  toggleArchive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0E6D8',
    borderWidth: 1,
    borderColor: '#E8D8C8',
  },
  toggleArchiveActive: {
    backgroundColor: 'rgba(210,105,30,0.1)',
    borderColor: 'rgba(210,105,30,0.3)',
  },
  toggleArchiveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFAF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 15,
    color: '#2C1810',
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    color: 'rgba(44,24,16,0.6)',
    lineHeight: 17,
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  missingText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0E6D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 56,
    minHeight: 28,
  },
  archiveBtnText: {
    fontSize: 12,
    color: '#A0856C',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#2C1810',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    color: '#A0856C',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
});
