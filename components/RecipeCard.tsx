import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ChefHat, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Bookmark } from 'lucide-react-native';
import type { Recipe } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

type Props = {
  recipe: Recipe;
  onCooked?: () => void;
};

type CookState = 'idle' | 'cooking' | 'success' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function RecipeCard({ recipe, onCooked }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [cookState, setCookState] = useState<CookState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');

  async function handleSave() {
    if (saveState === 'saved' || saveState === 'saving') return;
    setSaveState('saving');
    setSaveError('');

    const { error } = await supabase.from('saved_recipes').insert({
      recipe_name: recipe.name,
      description: recipe.description,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
    });

    if (error) {
      setSaveState('error');
      setSaveError('Could not save recipe.');
    } else {
      setSaveState('saved');
    }
  }

  async function handleCookThis() {
    setCookState('cooking');
    setErrorMsg('');

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
      onCooked?.();
    } catch (err: any) {
      setCookState('error');
      setErrorMsg(err.message ?? 'Something went wrong.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ChefHat size={18} color="#D2691E" />
        <Text style={[styles.recipeName, { fontFamily: 'NotoSerif_700Bold' }]} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.servingsRow}>
          <Users size={12} color="#708238" />
          <Text style={[styles.servingsText, { fontFamily: 'Inter_400Regular' }]}>
            {recipe.servings}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.description, { fontFamily: 'NotoSerif_700Bold' }]}>
          {recipe.description}
        </Text>

        <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.toggleBtn}>
          <Text style={[styles.toggleText, { fontFamily: 'Inter_400Regular' }]}>
            {expanded ? 'Hide details' : 'View ingredients & steps'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <View>
            <Text style={[styles.sectionTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              Ingredients
            </Text>
            {recipe.ingredients.map((ing, i) => {
              const unit = (ing.unit ?? '').trim().toLowerCase();
              const name = (ing.name ?? '').trim().toLowerCase();
              const showUnit = unit && !name.includes(unit) && !unit.includes(name);
              const displayName = (ing.name ?? '').trim().replace(/s$/i, '');
              return (
                <View key={i} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={[styles.ingredientText, { fontFamily: 'Inter_400Regular' }]}>
                    {formatQuantity(ing.quantity)}{showUnit ? ` ${ing.unit}` : ''} {displayName}
                  </Text>
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, { fontFamily: 'NotoSerif_700Bold', marginTop: 12 }]}>
              Instructions
            </Text>
            {recipe.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={[styles.stepNumber, { fontFamily: 'Inter_400Regular' }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { fontFamily: 'Inter_400Regular' }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(cookState === 'error' || saveState === 'error') && (
          <View style={styles.errorBanner}>
            <AlertCircle size={14} color="#ef4444" />
            <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>
              {cookState === 'error' ? errorMsg : saveError}
            </Text>
          </View>
        )}

        {cookState === 'success' && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#708238" />
            <Text style={[styles.successText, { fontFamily: 'Inter_400Regular' }]}>
              Pantry updated! Enjoy your meal.
            </Text>
          </View>
        )}

        {saveState === 'saved' && (
          <View style={styles.saveBanner}>
            <Bookmark size={13} color="#708238" fill="#708238" />
            <Text style={[styles.saveBannerText, { fontFamily: 'Inter_400Regular' }]}>
              Saved to your recipes!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        {cookState === 'success' ? (
          <View style={styles.actionRowSuccess} />
        ) : (
          <TouchableOpacity
            onPress={handleCookThis}
            disabled={cookState === 'cooking'}
            style={[styles.cookBtn, { opacity: cookState === 'cooking' ? 0.7 : 1 }]}
          >
            {cookState === 'cooking' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ChefHat size={16} color="#fff" />
            )}
            <Text style={[styles.cookBtnText, { fontFamily: 'Inter_400Regular' }]}>
              {cookState === 'cooking' ? 'Updating pantry...' : 'Cook This'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
          style={[styles.saveActionBtn, saveState === 'saved' && styles.saveActionBtnSaved]}
          activeOpacity={0.75}
        >
          {saveState === 'saving' ? (
            <ActivityIndicator size="small" color="#D2691E" />
          ) : (
            <>
              <Bookmark
                size={15}
                color={saveState === 'saved' ? '#708238' : '#D2691E'}
                fill={saveState === 'saved' ? '#708238' : 'transparent'}
              />
              <Text
                style={[
                  styles.saveActionBtnText,
                  { fontFamily: 'Inter_400Regular', color: saveState === 'saved' ? '#708238' : '#D2691E' },
                ]}
              >
                {saveState === 'saved' ? 'Saved' : 'Save Recipe'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    backgroundColor: 'rgba(210,105,30,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipeName: {
    color: '#D2691E',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servingsText: {
    color: '#708238',
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  description: {
    color: 'rgba(44,24,16,0.7)',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  toggleBtn: {
    marginBottom: 8,
  },
  toggleText: {
    color: '#D2691E',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#2C1810',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D2691E',
  },
  ingredientText: {
    color: '#2C1810',
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  stepText: {
    color: '#2C1810',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'rgba(112,130,56,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successText: {
    color: '#708238',
    fontWeight: '600',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0E6D8',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionRowSuccess: {
    flex: 1,
  },
  cookBtn: {
    flex: 1,
    backgroundColor: '#D2691E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  saveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D2691E',
    backgroundColor: 'transparent',
  },
  saveActionBtnSaved: {
    borderColor: '#708238',
    backgroundColor: 'rgba(112,130,56,0.08)',
  },
  saveActionBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  saveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(112,130,56,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBannerText: {
    color: '#708238',
    fontSize: 12,
    fontWeight: '600',
  },
});
