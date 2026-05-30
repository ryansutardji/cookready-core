import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Mic, Plus, Check, ChevronDown, X, Package, Sparkles, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { BundleList } from '@/components/BundleList';
import { BundleSheet } from '@/components/BundleSheet';
import { BundlePicker } from '@/components/BundlePicker';
import { NewIngredientExpansion } from '@/components/NewIngredientExpansion';
import type { Bundle } from '@/lib/bundles';

type Ingredient = {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  preferred_unit: string;
  units: string[];
};

type Props = {
  onItemAdded: () => void;
};

type ToastInfo = {
  message: string;
  ingredientName: string;
  quantity: number;
  unit: string;
} | null;

type Mode = 'single' | 'bundle';

export function SmartAddBar({ onItemAdded }: Props) {
  const [mode, setMode] = useState<Mode>('single');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastInfo>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [showAll, setShowAll] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchIngredients = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setShowDropdown(false);
      setNoResults(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    let q = supabase
      .from('ingredients')
      .select('id, name, category, base_unit, preferred_unit, user_id')
      .ilike('name', `%${text}%`)
      .order('name')
      .limit(8);

    if (userId) {
      q = q.or(`user_id.is.null,user_id.eq.${userId}`);
    } else {
      q = q.is('user_id', null);
    }

    const { data } = await q;

    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      const { data: ucData } = await supabase
        .from('unit_conversions')
        .select('ingredient_id, input_unit')
        .in('ingredient_id', ids);

      const { data: globalUc } = await supabase
        .from('unit_conversions')
        .select('input_unit, output_unit')
        .is('ingredient_id', null);

      const ucMap: Record<string, string[]> = {};
      for (const uc of ucData ?? []) {
        if (!ucMap[uc.ingredient_id]) ucMap[uc.ingredient_id] = [];
        if (uc.input_unit) ucMap[uc.ingredient_id].push(uc.input_unit);
      }

      const enriched: Ingredient[] = data.map((ing: any) => {
        const specificUnits = ucMap[ing.id] ?? [];
        const compatibleGlobalUnits = (globalUc ?? [])
          .filter((u: any) => u.output_unit === ing.base_unit)
          .map((u: any) => u.input_unit)
          .filter(Boolean);
        const allUnits = Array.from(
          new Set([ing.preferred_unit, ing.base_unit, ...specificUnits, ...compatibleGlobalUnits])
        ).filter(Boolean);
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
  }, []);

  useEffect(() => {
    if (selected) return;
    if (mode !== 'single') return;
    const timer = setTimeout(() => searchIngredients(query), 200);
    return () => clearTimeout(timer);
  }, [query, selected, mode, searchIngredients]);

  function handleSelect(ing: Ingredient) {
    setSelected(ing);
    setQuantity(1);
    setSelectedUnit(ing.units[0] ?? ing.preferred_unit ?? '');
    setShowDropdown(false);
    setQuery('');
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setNoResults(false);
    setQuantity(1);
    setSelectedUnit('');
    setShowNewIngredient(false);
    setNewIngredientName('');
  }

  function handleAddAsNew() {
    setShowNewIngredient(true);
    setNewIngredientName(query.trim());
    setShowDropdown(false);
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

      await supabase.rpc('add_pantry_item', {
        p_ingredient_name: ingredient.name,
        p_quantity: 1,
        p_unit: ingredient.preferred_unit,
      });

      handleClear();
      onItemAdded();
      showToast({
        message: `${ingredient.name} added to your pantry.`,
        ingredientName: ingredient.name,
        quantity: 1,
        unit: ingredient.preferred_unit,
      });
    } catch (err: any) {
      console.error('Failed to save new ingredient:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!selected || quantity <= 0 || !selectedUnit) return;
    setSaving(true);
    try {
      await supabase.rpc('add_pantry_item', {
        p_ingredient_name: selected.name,
        p_quantity: quantity,
        p_unit: selectedUnit,
      });

      const toastData: ToastInfo = {
        message: `${quantity} ${selectedUnit}${quantity !== 1 ? 's' : ''} of ${selected.name} added.`,
        ingredientName: selected.name,
        quantity,
        unit: selectedUnit,
      };

      handleClear();
      onItemAdded();
      showToast(toastData);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  function showToast(info: ToastInfo) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(info);
    setToastVisible(true);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => dismissToast(), 5000);
  }

  function dismissToast() {
    Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToastVisible(false);
      setToast(null);
    });
  }

  async function handleUndo() {
    if (!toast) return;
    await supabase.rpc('deplete_pantry_item', {
      p_ingredient_name: toast.ingredientName,
      p_quantity: toast.quantity,
      p_unit: toast.unit,
    });
    dismissToast();
    onItemAdded();
  }

  function handleSelectBundle(bundle: Bundle) {
    setSelectedBundle(bundle);
    setSheetVisible(true);
  }

  function handleSheetClose() {
    setSheetVisible(false);
  }

  function handleBundleAdded() {
    onItemAdded();
    setMode('single');
    setQuery('');
    showToast({
      message: 'Bundle items added to your pantry.',
      ingredientName: '',
      quantity: 0,
      unit: '',
    });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setQuery('');
    handleClear();
  }

  const allUnits = selected?.units ?? [];

  return (
    <View style={styles.wrapper}>
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Check size={14} color="#4A7C59" strokeWidth={2.5} />
          <Text style={styles.toastText}>{toast?.message}</Text>
          {toast?.ingredientName ? (
            <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
              <Text style={styles.undoText}>Undo</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={dismissToast} style={styles.toastClose}>
            <X size={12} color="#4A7C59" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={[styles.container, showNewIngredient && styles.containerNewIngredient]}>
        {/* Segmented toggle lives inside the container */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'single' && styles.toggleBtnActive]}
            onPress={() => switchMode('single')}
            activeOpacity={0.8}
          >
            <Plus size={14} color={mode === 'single' ? '#D2691E' : '#9C7B6A'} strokeWidth={2.5} />
            <Text style={[styles.toggleText, mode === 'single' && styles.toggleTextActive]}>
              Single ingredient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'bundle' && styles.toggleBtnActive]}
            onPress={() => switchMode('bundle')}
            activeOpacity={0.8}
          >
            <Package size={14} color={mode === 'bundle' ? '#D2691E' : '#9C7B6A'} strokeWidth={2} />
            <Text style={[styles.toggleText, mode === 'bundle' && styles.toggleTextActive]}>
              Bundle
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'bundle' ? (
          <View style={styles.searchRow}>
            <Search size={16} color="#9C7B6A" />
            <TextInput
              style={styles.input}
              placeholder="Search bundles..."
              placeholderTextColor="#B8A898"
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 ? (
              <TouchableOpacity style={styles.clearBtnBundle} onPress={() => setQuery('')} activeOpacity={0.7}>
                <X size={13} color="#9C7B6A" />
              </TouchableOpacity>
            ) : (
              <View style={styles.micBtn}>
                <Mic size={16} color="#D2691E" />
              </View>
            )}
          </View>
        ) : !selected && !showNewIngredient ? (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                placeholder="Add an ingredient to your pantry..."
                placeholderTextColor="#B8A898"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.micBtn}>
                <Mic size={18} color="#D2691E" />
              </TouchableOpacity>
            </View>

            {showDropdown && (
              <View style={styles.dropdown}>
                {results.map((ing, idx) => (
                  <TouchableOpacity
                    key={ing.id}
                    style={[
                      styles.dropdownItem,
                      (idx < results.length - 1 || noResults) && styles.dropdownDivider,
                    ]}
                    onPress={() => handleSelect(ing)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownMain}>
                      <Text style={styles.dropdownName}>{ing.name}</Text>
                      <Text style={styles.dropdownCategory}>{ing.category}</Text>
                    </View>
                    <Text style={styles.dropdownUnits}>{ing.units.join(', ')}</Text>
                  </TouchableOpacity>
                ))}
                {noResults && query.trim().length > 0 && (
                  <>
                    {results.length === 0 && (
                      <View style={styles.noResultsRow}>
                        <Text style={styles.noResultsText}>No matches found</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.addNewRow}
                      onPress={handleAddAsNew}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addNewIcon}>
                        <Sparkles size={13} color="#D2691E" strokeWidth={2} />
                      </View>
                      <View style={styles.addNewTextWrap}>
                        <Text style={styles.addNewLabel}>
                          Add "{query.trim()}" as a new ingredient
                        </Text>
                        <Text style={styles.addNewHint}>AI will suggest category &amp; unit</Text>
                      </View>
                      <Text style={styles.addNewChevron}>›</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        ) : !showNewIngredient ? (
          <View style={styles.stepperRow}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <X size={14} color="#8C6A5A" />
            </TouchableOpacity>

            <Text style={styles.ingredientName}>{selected!.name}</Text>

            <View style={styles.stepperControls}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(true)}
            >
              <Text style={styles.unitText}>{selectedUnit}</Text>
              <ChevronDown size={13} color="#4A3728" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Check size={16} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {showNewIngredient && (
        <NewIngredientExpansion
          ingredientName={newIngredientName}
          onSave={handleSaveNewIngredient}
          onCancel={handleClear}
          saving={saving}
        />
      )}

      {mode === 'bundle' && (
        <BundleList
          query={query}
          onSelectBundle={handleSelectBundle}
          onBrowseAll={() => setShowAll(true)}
        />
      )}

      <Modal
        visible={showUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitPicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            <ScrollView>
              {allUnits.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pickerOption, u === selectedUnit && styles.pickerOptionSelected]}
                  onPress={() => { setSelectedUnit(u); setShowUnitPicker(false); }}
                >
                  <Text
                    style={[styles.pickerOptionText, u === selectedUnit && styles.pickerOptionTextSelected]}
                  >
                    {u}
                  </Text>
                  {u === selectedUnit && <Check size={14} color="#D2691E" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BundleSheet
        bundle={selectedBundle}
        visible={sheetVisible}
        onClose={handleSheetClose}
        onAdded={handleBundleAdded}
      />

      <BundlePicker
        visible={showAll}
        onPick={(b) => { setShowAll(false); handleSelectBundle(b); }}
        onClose={() => setShowAll(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5EE',
    borderWidth: 1,
    borderColor: '#B8D9C4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  toastText: {
    flex: 1,
    color: '#2D5A3D',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  undoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  undoText: {
    color: '#D2691E',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
  toastClose: {
    padding: 2,
  },
  container: {
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    overflow: 'visible',
  },
  containerNewIngredient: {
    borderColor: '#D2691E',
    borderWidth: 1.5,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#EDE7DC',
    borderRadius: 14,
    padding: 3,
    margin: 4,
    gap: 2,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFAF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#2C1810',
  },
  noResultsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noResultsText: {
    fontSize: 12,
    color: '#B8A898',
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  addNewHint: {
    fontSize: 11,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
  },
  addNewChevron: {
    fontSize: 18,
    color: '#D2691E',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnBundle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: '#E0D8CC',
    backgroundColor: '#FFFAF5',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 3,
  },
  dropdownDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  dropdownMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownName: {
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  dropdownCategory: {
    fontSize: 12,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
  },
  dropdownUnits: {
    fontSize: 12,
    color: '#B8A898',
    fontFamily: 'Inter_400Regular',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7DC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    color: '#D2691E',
    fontWeight: '600',
    lineHeight: 22,
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C1810',
    minWidth: 28,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7DC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  unitText: {
    fontSize: 13,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  pickerTitle: {
    fontSize: 15,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8DE',
  },
  pickerOptionSelected: {
    backgroundColor: '#FDF5EC',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
  },
  pickerOptionTextSelected: {
    color: '#D2691E',
    fontWeight: '600',
  },
});
