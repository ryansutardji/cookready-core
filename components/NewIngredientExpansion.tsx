import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Sparkles, ChevronRight, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const CATEGORIES = [
  'Protein', 'Vegetable', 'Fruit', 'Grain',
  'Oil', 'Fat', 'Dairy', 'Baking', 'Spice/Sauce', 'Pantry',
] as const;

type Category = typeof CATEGORIES[number];

const CATEGORY_UNITS: Record<Category, string[]> = {
  Protein:       ['each', 'oz', 'lb', 'g', 'kg', 'piece', 'fillet', 'breast', 'slice'],
  Vegetable:     ['each', 'oz', 'lb', 'g', 'bunch', 'head', 'stalk', 'cup', 'handful'],
  Fruit:         ['each', 'oz', 'lb', 'g', 'cup', 'handful', 'bunch', 'slice'],
  Grain:         ['cup', 'oz', 'lb', 'g', 'kg', 'tbsp', 'tsp', 'piece', 'slice'],
  Oil:           ['tbsp', 'tsp', 'cup', 'fl oz', 'ml', 'L'],
  Fat:           ['tbsp', 'tsp', 'cup', 'oz', 'lb', 'g', 'stick'],
  Dairy:         ['cup', 'fl oz', 'ml', 'oz', 'lb', 'g', 'tbsp', 'tsp', 'slice', 'each'],
  Baking:        ['cup', 'oz', 'lb', 'g', 'tbsp', 'tsp', 'each', 'pinch'],
  'Spice/Sauce': ['tsp', 'tbsp', 'cup', 'oz', 'g', 'fl oz', 'ml', 'pinch', 'dash'],
  Pantry:        ['each', 'oz', 'lb', 'g', 'cup', 'tbsp', 'tsp', 'can', 'bottle', 'bag', 'fl oz', 'ml'],
};

// Universal units don't need a custom conversion row
const UNIVERSAL_UNITS = new Set([
  'oz', 'lb', 'g', 'kg', 'cup', 'tbsp', 'tsp', 'fl oz', 'ml', 'L', 'stick', 'pinch', 'dash',
]);

type ClassifyResult = {
  category: Category;
  preferred_unit: string;
  base_unit: string;
  conversion_value: number | null;
  conversion_to_unit: string | null;
  available_units: string[];
  needs_custom_conversion: boolean;
};

type Props = {
  ingredientName: string;
  onSave: (ingredient: {
    name: string;
    category: string;
    preferred_unit: string;
    base_unit: string;
    conversion_value: number | null;
    conversion_to_unit: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

export function NewIngredientExpansion({ ingredientName, onSave, onCancel, saving }: Props) {
  const [classifying, setClassifying] = useState(true);
  const [classifyError, setClassifyError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<Category>('Pantry');
  const [availableUnits, setAvailableUnits] = useState<string[]>(CATEGORY_UNITS['Pantry']);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<Category | null>(null);
  const [aiSuggestedUnit, setAiSuggestedUnit] = useState('');

  // Conversion state
  const [conversionValue, setConversionValue] = useState<string>('');
  const [conversionToUnit, setConversionToUnit] = useState<'g' | 'ml' | 'count'>('g');
  const [showConversionEdit, setShowConversionEdit] = useState(false);
  const [conversionConfirmed, setConversionConfirmed] = useState(false);
  const conversionAnim = useRef(new Animated.Value(0)).current;

  const needsCustomConversion = selectedUnit ? !UNIVERSAL_UNITS.has(selectedUnit) : false;

  useEffect(() => {
    classify();
  }, []);

  async function classify() {
    setClassifying(true);
    setClassifyError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/classify-ingredient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ingredient_name: ingredientName }),
      });

      const result: ClassifyResult = await res.json();

      const cat = CATEGORIES.includes(result.category as Category)
        ? (result.category as Category)
        : 'Pantry';

      setSelectedCategory(cat);
      setAiSuggestedCategory(cat);
      setAvailableUnits(result.available_units ?? CATEGORY_UNITS[cat]);

      const unit = result.preferred_unit ?? result.available_units?.[0] ?? 'each';
      setSelectedUnit(unit);
      setAiSuggestedUnit(unit);

      if (result.conversion_value != null) {
        setConversionValue(String(result.conversion_value));
      }
      if (result.conversion_to_unit) {
        setConversionToUnit(result.conversion_to_unit as 'g' | 'ml' | 'count');
      }
    } catch {
      setClassifyError('Could not reach AI. Pick category and unit manually.');
      setSelectedCategory('Pantry');
      setAvailableUnits(CATEGORY_UNITS['Pantry']);
      setSelectedUnit('each');
    } finally {
      setClassifying(false);
    }
  }

  function handleCategorySelect(cat: Category) {
    setSelectedCategory(cat);
    const units = CATEGORY_UNITS[cat];
    setAvailableUnits(units);
    // Reset unit if it's no longer valid for new category
    if (!units.includes(selectedUnit)) {
      setSelectedUnit(units[0]);
    }
    setConversionConfirmed(false);
  }

  function handleUnitSelect(unit: string) {
    setSelectedUnit(unit);
    setShowConversionEdit(false);
    setConversionConfirmed(false);
  }

  function toggleConversionEdit() {
    const next = !showConversionEdit;
    setShowConversionEdit(next);
    Animated.timing(conversionAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }

  function handleConfirmConversion() {
    setConversionConfirmed(true);
    setShowConversionEdit(false);
    Animated.timing(conversionAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  async function handleSave() {
    const cvNum = conversionValue ? parseFloat(conversionValue) : null;
    await onSave({
      name: ingredientName,
      category: selectedCategory,
      preferred_unit: selectedUnit,
      base_unit: needsCustomConversion ? (conversionToUnit === 'count' ? 'each' : conversionToUnit) : selectedUnit,
      conversion_value: needsCustomConversion && cvNum && cvNum > 0 ? cvNum : null,
      conversion_to_unit: needsCustomConversion && cvNum && cvNum > 0 ? conversionToUnit : null,
    });
  }

  const conversionSummary = () => {
    if (!conversionValue || !needsCustomConversion) return null;
    const unit = conversionToUnit === 'count' ? 'each' : conversionToUnit;
    return `1 ${selectedUnit} ≈ ${conversionValue}${unit}`;
  };

  const canSave = selectedUnit && (!needsCustomConversion || conversionConfirmed || !!conversionValue);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.ingredientName}>{ingredientName}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} hitSlop={8}>
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
      </View>

      {classifying ? (
        <View style={styles.loadingState}>
          <Sparkles size={14} color="#D2691E" strokeWidth={2} />
          <Text style={styles.loadingText}>Figuring out the best fit...</Text>
          <View style={styles.skeletonRow}>
            {[80, 100, 70, 90, 60].map((w, i) => (
              <View key={i} style={[styles.skeletonPill, { width: w }]} />
            ))}
          </View>
          <View style={styles.skeletonRow}>
            {[60, 50, 55].map((w, i) => (
              <View key={i} style={[styles.skeletonPill, { width: w }]} />
            ))}
          </View>
          <View style={[styles.skeletonBlock, { height: 52 }]} />
        </View>
      ) : (
        <>
          {classifyError ? (
            <Text style={styles.errorText}>{classifyError}</Text>
          ) : null}

          {/* Category */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            {aiSuggestedCategory ? (
              <View style={styles.aiTag}>
                <Sparkles size={10} color="#D2691E" strokeWidth={2} />
                <Text style={styles.aiTagText}>AI SUGGESTED</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.pillRow}>
            {CATEGORIES.map((cat) => {
              const active = cat === selectedCategory;
              const isAi = cat === aiSuggestedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => handleCategorySelect(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {cat}
                  </Text>
                  {active && isAi && (
                    <View style={styles.aiDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Unit */}
          <View style={[styles.sectionHeader, { marginTop: 14 }]}>
            <Text style={styles.sectionLabel}>UNIT</Text>
            {aiSuggestedUnit ? (
              <View style={styles.aiTag}>
                <Sparkles size={10} color="#D2691E" strokeWidth={2} />
                <Text style={styles.aiTagText}>AI SUGGESTED</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.pillRow}>
            {availableUnits.map((unit) => {
              const active = unit === selectedUnit;
              const isAi = unit === aiSuggestedUnit;
              return (
                <TouchableOpacity
                  key={unit}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => handleUnitSelect(unit)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {unit}
                  </Text>
                  {active && isAi && (
                    <View style={styles.aiDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Conversion row — only shown for non-universal units */}
          {needsCustomConversion && (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.conversionRow, conversionConfirmed && styles.conversionRowConfirmed]}
                onPress={toggleConversionEdit}
                activeOpacity={0.8}
              >
                <Sparkles size={13} color={conversionConfirmed ? '#4A7C59' : '#D2691E'} strokeWidth={2} />
                <Text style={[styles.conversionText, conversionConfirmed && styles.conversionTextConfirmed]}>
                  {conversionSummary()
                    ? `${conversionSummary()}${!conversionConfirmed ? ' · AI estimate · tap to edit' : ''}`
                    : `How does 1 ${selectedUnit} measure? · tap to set`}
                </Text>
                <ChevronRight
                  size={13}
                  color={conversionConfirmed ? '#4A7C59' : '#D2691E'}
                  style={{ transform: [{ rotate: showConversionEdit ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showConversionEdit && (
                <View style={styles.conversionEdit}>
                  <Text style={styles.conversionEditTitle}>
                    How much does 1 {selectedUnit} weigh or measure?
                  </Text>
                  <View style={styles.conversionInputRow}>
                    <TextInput
                      style={styles.conversionInput}
                      value={conversionValue}
                      onChangeText={setConversionValue}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#B8A898"
                      autoFocus
                    />
                    <View style={styles.conversionUnitTabs}>
                      {(['g', 'ml', 'count'] as const).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.conversionUnitTab,
                            conversionToUnit === u && styles.conversionUnitTabActive,
                          ]}
                          onPress={() => setConversionToUnit(u)}
                        >
                          <Text
                            style={[
                              styles.conversionUnitTabText,
                              conversionToUnit === u && styles.conversionUnitTabTextActive,
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.conversionHint}>
                    This helps convert recipes. AI estimated{' '}
                    {conversionValue || '—'}{conversionToUnit === 'count' ? ' each' : conversionToUnit} per {selectedUnit} — adjust if you know better.
                  </Text>
                  <TouchableOpacity
                    style={[styles.confirmBtn, !conversionValue && styles.confirmBtnDisabled]}
                    onPress={handleConfirmConversion}
                    disabled={!conversionValue}
                  >
                    <Check size={14} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.confirmBtnText}>Confirm estimate</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Add to Pantry button */}
          <TouchableOpacity
            style={[
              styles.addBtn,
              (!canSave || saving) && styles.addBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>Add to Pantry</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8D5C0',
    padding: 16,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ingredientName: {
    fontSize: 16,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
  },
  cancelBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 11,
    color: '#8C6A5A',
    lineHeight: 14,
  },
  loadingState: {
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#D2691E',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  skeletonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skeletonPill: {
    height: 30,
    borderRadius: 20,
    backgroundColor: '#EDE7DC',
    opacity: 0.6,
  },
  skeletonBlock: {
    borderRadius: 12,
    backgroundColor: '#EDE7DC',
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#C0392B',
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTagText: {
    fontSize: 10,
    color: '#D2691E',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E8DC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  pillActive: {
    backgroundColor: '#D2691E',
  },
  pillText: {
    fontSize: 13,
    color: '#6B4226',
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0D5B5',
  },
  conversionRowConfirmed: {
    backgroundColor: '#EBF5EE',
    borderColor: '#B8D9C4',
  },
  conversionText: {
    flex: 1,
    fontSize: 12,
    color: '#8C4B1E',
    fontFamily: 'Inter_400Regular',
  },
  conversionTextConfirmed: {
    color: '#2D5A3D',
  },
  conversionEdit: {
    backgroundColor: '#F7F0E8',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8D5C0',
  },
  conversionEditTitle: {
    fontSize: 13,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  conversionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  conversionInput: {
    flex: 1,
    backgroundColor: '#FFFAF5',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    fontSize: 22,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
  },
  conversionUnitTabs: {
    backgroundColor: '#EDE7DC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  conversionUnitTab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  conversionUnitTabActive: {
    backgroundColor: '#2C6B3A',
  },
  conversionUnitTabText: {
    fontSize: 13,
    color: '#6B4226',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
    textAlign: 'center',
  },
  conversionUnitTabTextActive: {
    color: '#fff',
  },
  conversionHint: {
    fontSize: 11,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6B3A',
    borderRadius: 10,
    paddingVertical: 11,
    gap: 6,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
  },
});
