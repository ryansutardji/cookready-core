import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Users,
  ChefHat,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  CircleX,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { SavedRecipe, SavedRecipeIngredient } from '@/lib/supabase';

type IngredientStatus = { ingredient: SavedRecipeIngredient; available: boolean };
type CookState = 'idle' | 'cooking' | 'success' | 'error';

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [ingredientStatuses, setIngredientStatuses] = useState<IngredientStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [cookState, setCookState] = useState<CookState>('idle');
  const [cookError, setCookError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const r = data as SavedRecipe;
      setRecipe(r);

      // Fetch pantry snapshot to check each ingredient
      const { data: pantryRows } = await supabase
        .from('ai_pantry_snapshot')
        .select('name, raw_weight_or_count');

      const pantryMap: Record<string, number> = {};
      for (const row of pantryRows ?? []) {
        pantryMap[row.name.toLowerCase()] = row.raw_weight_or_count ?? 0;
      }

      const statuses: IngredientStatus[] = r.ingredients.map((ing) => ({
        ingredient: ing,
        available: (pantryMap[ing.name.toLowerCase()] ?? 0) > 0,
      }));

      setIngredientStatuses(statuses);
      setLoading(false);
    }

    if (id) load();
  }, [id]);

  async function handleCookThis() {
    if (!recipe) return;
    setCookState('cooking');
    setCookError('');

    try {
      for (const ing of recipe.ingredients) {
        const { error } = await supabase.rpc('deplete_pantry_item', {
          p_ingredient_name: ing.name,
          p_quantity: ing.quantity,
          p_unit: ing.unit,
        });
        if (error) throw new Error(`Failed to deplete ${ing.name}: ${error.message}`);
      }
      setCookState('success');
    } catch (err: any) {
      setCookState('error');
      setCookError(err.message ?? 'Something went wrong.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D2691E" />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#2C1810" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <CircleX size={40} color="#E8E0D0" />
          <Text style={[styles.notFoundText, { fontFamily: 'Inter_400Regular' }]}>
            Recipe not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasMissing = ingredientStatuses.some((s) => !s.available);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#2C1810" />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontFamily: 'NotoSerif_700Bold' }]} numberOfLines={1}>
          Recipe
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardInner}>
            <ChefHat size={20} color="#D2691E" />
            <View style={styles.headerTextBlock}>
              <Text style={[styles.recipeName, { fontFamily: 'NotoSerif_700Bold' }]}>
                {recipe.recipe_name}
              </Text>
              {recipe.description ? (
                <Text style={[styles.description, { fontFamily: 'Inter_400Regular' }]}>
                  {recipe.description}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Users size={13} color="#708238" />
              <Text style={[styles.metaText, { fontFamily: 'Inter_400Regular' }]}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>
            {hasMissing && (
              <View style={styles.missingBadge}>
                <AlertCircle size={13} color="#B45309" />
                <Text style={[styles.missingText, { fontFamily: 'Inter_400Regular' }]}>
                  Some ingredients missing
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            Ingredients
          </Text>
          {ingredientStatuses.map(({ ingredient: ing, available }, i) => {
            const unit = (ing.unit ?? '').trim().toLowerCase();
            const name = (ing.name ?? '').trim().toLowerCase();
            const showUnit = unit && !name.includes(unit) && !unit.includes(name);
            return (
              <View key={i} style={styles.ingredientRow}>
                {available ? (
                  <CheckCircle size={16} color="#708238" />
                ) : (
                  <AlertCircle size={16} color="#B45309" />
                )}
                <Text
                  style={[
                    styles.ingredientText,
                    { fontFamily: 'Inter_400Regular', color: available ? '#2C1810' : '#B45309' },
                  ]}
                >
                  {formatQuantity(ing.quantity)}
                  {showUnit ? ` ${ing.unit}` : ''} {ing.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            Instructions
          </Text>
          {recipe.instructions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={[styles.stepNumber, { fontFamily: 'Inter_400Regular' }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepText, { fontFamily: 'Inter_400Regular' }]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Cook This */}
        <View style={styles.cookSection}>
          {cookState === 'error' && (
            <View style={styles.errorBanner}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>
                {cookError}
              </Text>
            </View>
          )}
          {cookState === 'success' ? (
            <View style={styles.successBanner}>
              <CheckCircle size={16} color="#708238" />
              <Text style={[styles.successText, { fontFamily: 'Inter_400Regular' }]}>
                Pantry updated! Enjoy your meal.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.cookBtn, cookState === 'cooking' && { opacity: 0.7 }]}
              onPress={handleCookThis}
              disabled={cookState === 'cooking'}
              activeOpacity={0.8}
            >
              {cookState === 'cooking' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ChefHat size={18} color="#fff" />
              )}
              <Text style={[styles.cookBtnText, { fontFamily: 'Inter_400Regular' }]}>
                {cookState === 'cooking' ? 'Updating pantry...' : 'Cook This'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EE',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    color: '#A0856C',
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#2C1810',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  headerCard: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(210,105,30,0.06)',
  },
  headerTextBlock: {
    flex: 1,
    gap: 6,
  },
  recipeName: {
    fontSize: 20,
    color: '#2C1810',
    lineHeight: 26,
  },
  description: {
    fontSize: 13,
    color: 'rgba(44,24,16,0.65)',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(112,130,56,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#708238',
    fontWeight: '600',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  missingText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#2C1810',
    marginBottom: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ingredientText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    color: '#2C1810',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  cookSection: {
    gap: 8,
  },
  cookBtn: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(112,130,56,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successText: {
    color: '#708238',
    fontWeight: '600',
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
});
