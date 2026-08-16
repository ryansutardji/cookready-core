import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Check, ChevronDown, X, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { NewIngredientExpansion } from '@/components/NewIngredientExpansion';

// ---------------------------------------------------------------------------
// Sub-component: Inline Single Ingredient Bar
// ---------------------------------------------------------------------------
type SearchIngredient = {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  preferred_unit: string;
  units: string[];
};

type Props = {
  onAdded: () => void;
  categories: string[];
  placeholder: string;
  lockedCategory?: string;
};

// Friendly lowercase labels for the "Add as new ___" row — not a plain
// .toLowerCase() since a couple of DB category values read awkwardly as-is.
const CATEGORY_LABELS: Record<string, string> = {
  Protein: 'protein',
  Vegetable: 'vegetable',
  Fruit: 'fruit',
  Grain: 'grain',
  Oil: 'oil',
  Fat: 'fat',
  Dairy: 'dairy',
  Baking: 'baking ingredient',
  'Spice/Sauce': 'spice or sauce',
  Pantry: 'pantry item',
};

export function SingleIngredientBar({ onAdded, categories, placeholder, lockedCategory }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIngredient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selected, setSelected] = useState<SearchIngredient | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewIngredient, setShowNewIngredient] = useState(false);

  const newIngredientLabel = lockedCategory
    ? (CATEGORY_LABELS[lockedCategory] ?? lockedCategory)
    : 'ingredient';

  const searchIngredients = useCallback(async (text: string) => {
    if (!text.trim()) { setResults([]); setShowDropdown(false); setNoResults(false); return; }
    const { data } = await supabase
      .from('ingredients')
      .select('id, name, category, base_unit, preferred_unit')
      .ilike('name', `%${text}%`)
      .in('category', categories)
      .order('name')
      .limit(8);

    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      const [{ data: ucData }, { data: globalUc }] = await Promise.all([
        supabase.from('unit_conversions').select('ingredient_id, input_unit').in('ingredient_id', ids),
        supabase.from('unit_conversions').select('input_unit, output_unit').is('ingredient_id', null),
      ]);
      const ucMap: Record<string, string[]> = {};
      for (const uc of ucData ?? []) {
        if (!ucMap[uc.ingredient_id]) ucMap[uc.ingredient_id] = [];
        if (uc.input_unit) ucMap[uc.ingredient_id].push(uc.input_unit);
      }
      const enriched: SearchIngredient[] = data.map((ing: any) => {
        const specific = ucMap[ing.id] ?? [];
        const compatGlobal = (globalUc ?? [])
          .filter((u: any) => u.output_unit === ing.base_unit)
          .map((u: any) => u.input_unit)
          .filter(Boolean);
        const allUnits = Array.from(new Set([ing.preferred_unit, ing.base_unit, ...specific, ...compatGlobal])).filter(Boolean);
        return { ...ing, units: allUnits };
      });
      setResults(enriched);
      setNoResults(false);
      setShowDropdown(true);
    } else {
      setResults([]);
      setNoResults(true);
      setShowDropdown(true);
    }
  }, [categories]);

  useEffect(() => {
    if (selected) return;
    const t = setTimeout(() => searchIngredients(query), 200);
    return () => clearTimeout(t);
  }, [query, selected, searchIngredients]);

  function handleSelect(ing: SearchIngredient) {
    setSelected(ing);
    setQuantity(1);
    setSelectedUnit(ing.units[0] ?? ing.preferred_unit ?? '');
    setShowDropdown(false);
    setQuery('');
  }

  function handleClear() {
    setSelected(null); setQuery(''); setResults([]); setShowDropdown(false);
    setNoResults(false);
    setQuantity(1); setSelectedUnit('');
    setShowNewIngredient(false);
  }

  async function handleSave() {
    if (!selected || quantity <= 0 || !selectedUnit || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('add_pantry_item', {
        p_ingredient_name: selected.name,
        p_quantity: quantity,
        p_unit: selectedUnit,
      });
      if (error) throw error;
      handleClear();
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNewIngredient(ingredient: {
    name: string;
    category: string;
    preferred_unit: string;
    base_unit: string;
    conversion_value: number | null;
    conversion_to_unit: string | null;
  }) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: newIng, error: ingError } = await supabase
        .from('ingredients')
        .insert({
          name: ingredient.name,
          category: ingredient.category,
          preferred_unit: ingredient.preferred_unit,
          base_unit: ingredient.base_unit,
          user_id: user?.id,
        })
        .select('id')
        .single();

      if (ingError) throw ingError;

      if (ingredient.conversion_value != null && ingredient.conversion_to_unit) {
        const toUnit = ingredient.conversion_to_unit === 'count' ? 'each' : ingredient.conversion_to_unit;
        await supabase.from('unit_conversions').insert({
          ingredient_id: newIng.id,
          input_unit: ingredient.preferred_unit,
          output_value: ingredient.conversion_value,
          output_unit: toUnit,
        });
      }

      const { error: rpcError } = await supabase.rpc('add_pantry_item', {
        p_ingredient_name: ingredient.name,
        p_quantity: 1,
        p_unit: ingredient.preferred_unit,
      });
      if (rpcError) throw rpcError;

      handleClear();
      onAdded();
    } catch (err: any) {
      console.error('Failed to save new ingredient:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={singleStyles.wrapper}>
      {!selected && !showNewIngredient ? (
        <>
          <View style={singleStyles.searchRow}>
            <TextInput
              style={[singleStyles.input, { fontFamily: 'Inter_400Regular' }]}
              placeholder={placeholder}
              placeholderTextColor="#B8A898"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
          {showDropdown && (
            <ScrollView style={singleStyles.dropdown} keyboardShouldPersistTaps="handled">
              {results.map((ing, idx) => {
                const isDivider = idx < results.length - 1 || noResults;
                return (
                  <TouchableOpacity
                    key={ing.id}
                    style={[singleStyles.dropdownItem, isDivider && singleStyles.dropdownDivider]}
                    onPress={() => handleSelect(ing)}
                    activeOpacity={0.7}
                  >
                    <View style={singleStyles.dropdownMain}>
                      <Text style={[singleStyles.dropdownName, { fontFamily: 'Inter_400Regular' }]}>{ing.name}</Text>
                      <Text style={[singleStyles.dropdownCat, { fontFamily: 'Inter_400Regular' }]}>{ing.category}</Text>
                    </View>
                    <Text style={[singleStyles.dropdownUnits, { fontFamily: 'Inter_400Regular' }]}>{ing.units.slice(0, 3).join(', ')}</Text>
                  </TouchableOpacity>
                );
              })}
              {noResults && query.trim().length > 0 && (
                <>
                  {results.length === 0 && (
                    <View style={singleStyles.noResultsRow}>
                      <Text style={[singleStyles.noResultsText, { fontFamily: 'Inter_400Regular' }]}>No matches found</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={singleStyles.addNewRow}
                    onPress={() => setShowNewIngredient(true)}
                    activeOpacity={0.7}
                  >
                    <View style={singleStyles.addNewIcon}>
                      <Sparkles size={13} color="#D2691E" strokeWidth={2} />
                    </View>
                    <View style={singleStyles.addNewTextWrap}>
                      <Text style={[singleStyles.addNewLabel, { fontFamily: 'Inter_400Regular' }]}>
                        Add "{query.trim()}" as a new {newIngredientLabel}
                      </Text>
                    </View>
                    <Text style={singleStyles.addNewChevron}>›</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}
        </>
      ) : !showNewIngredient ? (
        <View style={singleStyles.stepperRow}>
          <TouchableOpacity onPress={handleClear} style={singleStyles.clearBtn}>
            <X size={13} color="#8C6A5A" />
          </TouchableOpacity>
          <Text style={[singleStyles.selectedName, { fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{selected!.name}</Text>
          <View style={singleStyles.stepperControls}>
            <TouchableOpacity style={singleStyles.stepBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Text style={singleStyles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[singleStyles.qtyText, { fontFamily: 'Inter_400Regular' }]}>{quantity}</Text>
            <TouchableOpacity style={singleStyles.stepBtn} onPress={() => setQuantity((q) => q + 1)}>
              <Text style={singleStyles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={singleStyles.unitSelector} onPress={() => setShowUnitPicker(true)}>
            <Text style={[singleStyles.unitText, { fontFamily: 'Inter_400Regular' }]}>{selectedUnit}</Text>
            <ChevronDown size={12} color="#4A3728" />
          </TouchableOpacity>
          <TouchableOpacity testID="single-ingredient-save-button" style={[singleStyles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={15} color="#fff" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>
      ) : (
        <NewIngredientExpansion
          ingredientName={query.trim()}
          lockedCategory={lockedCategory}
          saving={saving}
          onCancel={() => setShowNewIngredient(false)}
          onSave={handleSaveNewIngredient}
        />
      )}

      <Modal visible={showUnitPicker} transparent animationType="fade" onRequestClose={() => setShowUnitPicker(false)}>
        <TouchableOpacity style={singleStyles.pickerOverlay} activeOpacity={1} onPress={() => setShowUnitPicker(false)}>
          <View style={singleStyles.pickerCard}>
            <Text style={[singleStyles.pickerTitle, { fontFamily: 'Inter_400Regular' }]}>Select Unit</Text>
            <ScrollView>
              {(selected?.units ?? []).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[singleStyles.pickerOption, u === selectedUnit && singleStyles.pickerOptionSelected]}
                  onPress={() => { setSelectedUnit(u); setShowUnitPicker(false); }}
                >
                  <Text style={[singleStyles.pickerOptionText, { fontFamily: 'Inter_400Regular' }, u === selectedUnit && singleStyles.pickerOptionTextSelected]}>{u}</Text>
                  {u === selectedUnit && <Check size={13} color="#D2691E" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const singleStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F5EFE6',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    overflow: 'visible',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 14, color: '#2C1810', paddingVertical: Platform.OS === 'android' ? 2 : 0 },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: '#E0D8CC',
    backgroundColor: '#FFFAF5',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    maxHeight: 220,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, gap: 3 },
  dropdownDivider: { borderBottomWidth: 1, borderBottomColor: '#EDE8DE' },
  dropdownMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownName: { fontSize: 14, color: '#2C1810', fontWeight: '600' },
  dropdownCat: { fontSize: 12, color: '#9C7B6A' },
  dropdownUnits: { fontSize: 12, color: '#B8A898' },
  noResultsRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noResultsText: {
    fontSize: 12,
    color: '#B8A898',
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  addNewIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDF0E4',
    borderWidth: 1,
    borderColor: '#F0D5B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewTextWrap: {
    flex: 1,
    gap: 2,
  },
  addNewLabel: {
    fontSize: 13,
    color: '#2C1810',
    fontWeight: '600',
  },
  addNewHint: {
    fontSize: 11,
    color: '#9C7B6A',
  },
  addNewChevron: {
    fontSize: 18,
    color: '#D2691E',
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: { flex: 1, fontSize: 13, color: '#2C1810', fontWeight: '600' },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7DC',
    borderRadius: 9,
    overflow: 'hidden',
  },
  stepBtn: { width: 30, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 17, color: '#D2691E', fontWeight: '600', lineHeight: 21 },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#2C1810', minWidth: 24, textAlign: 'center' },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7DC',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 3,
  },
  unitText: { fontSize: 12, color: '#2C1810', fontWeight: '600' },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  pickerCard: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  pickerTitle: { fontSize: 15, color: '#2C1810', fontWeight: '700', marginBottom: 12 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  pickerOptionSelected: { backgroundColor: '#FDF5EC', borderRadius: 8, paddingHorizontal: 8 },
  pickerOptionText: { fontSize: 14, color: '#2C1810' },
  pickerOptionTextSelected: { color: '#D2691E', fontWeight: '600' },
});
