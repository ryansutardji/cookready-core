import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Bundle } from '@/lib/bundles';
import { useBundles } from '@/hooks/useBundles';

// ---------------------------------------------------------------------------
// Meter definition
// ---------------------------------------------------------------------------
type MeterSlot = {
  key: string;
  label: string;
  icon: string;
  required: boolean;
  minCount: number;
  // DB category values that count toward this slot
  categories: string[];
};

const METER_SLOTS: MeterSlot[] = [
  { key: 'protein',   label: 'Protein',     icon: '🥩', required: true,  minCount: 1, categories: ['Protein'] },
  { key: 'vegetable', label: 'Veggie',      icon: '🥦', required: true,  minCount: 1, categories: ['Vegetable'] },
  { key: 'grain',     label: 'Grain',       icon: '🌾', required: true,  minCount: 1, categories: ['Grain'] },
  { key: 'spice',     label: 'Spice\n/Sauce', icon: '🌶️', required: true,  minCount: 5, categories: ['Spice/Sauce'] },
  { key: 'oil',       label: 'Oil',         icon: '🫒', required: true,  minCount: 1, categories: ['Oil', 'Fat'] },
  { key: 'fruit',     label: 'Fruit',       icon: '🍓', required: false, minCount: 1, categories: ['Fruit'] },
  { key: 'baking',    label: 'Baking',      icon: '🥣', required: false, minCount: 1, categories: ['Baking'] },
];

type PantrySnapshot = { name: string; category: string }[];

function computeMeterCounts(pantry: PantrySnapshot): Record<string, number> {
  const counts: Record<string, number> = {
    protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0, fruit: 0, baking: 0,
  };

  for (const item of pantry) {
    const cat = item.category;
    for (const slot of METER_SLOTS) {
      if (slot.categories.includes(cat)) {
        counts[slot.key]++;
        break;
      }
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Bundle ingredient row type (mirrors BundleSheet)
// ---------------------------------------------------------------------------
type IngredientRow = {
  name: string;
  checked: boolean;
  alreadyHave: boolean;
  quantity: number;
  selectedUnit: string;
  availableUnits: string[];
};

type SearchIngredient = {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  preferred_unit: string;
  units: string[];
};

// ---------------------------------------------------------------------------
// Sub-component: Composition Meter
// ---------------------------------------------------------------------------
function CompositionMeter({ counts }: { counts: Record<string, number> }) {
  return (
    <View style={meterStyles.container}>
      <Text style={[meterStyles.title, { fontFamily: 'Inter_400Regular' }]}>
        Pantry readiness
      </Text>
      <View style={meterStyles.slots}>
        {METER_SLOTS.map((slot) => {
          const count = counts[slot.key] ?? 0;
          const met = count >= slot.minCount;
          return (
            <View key={slot.key} style={meterStyles.slotWrap}>
              <View style={[
                meterStyles.slot,
                met && meterStyles.slotMet,
                !slot.required && meterStyles.slotOptional,
                !slot.required && met && meterStyles.slotOptionalMet,
              ]}>
                {met ? (
                  <Check size={12} color={slot.required ? '#fff' : '#708238'} strokeWidth={3} />
                ) : (
                  <Text style={meterStyles.slotIcon}>{slot.icon}</Text>
                )}
              </View>
              <Text
                style={[
                  meterStyles.slotLabel,
                  { fontFamily: 'Inter_400Regular' },
                  met && (slot.required ? meterStyles.slotLabelMet : meterStyles.slotLabelOptionalMet),
                ]}
              >
                {slot.label}
              </Text>
              {slot.minCount > 1 && (
                <Text style={[
                  meterStyles.slotCount,
                  { fontFamily: 'Inter_400Regular' },
                  met && meterStyles.slotCountMet,
                ]}>
                  {Math.min(count, slot.minCount)}/{slot.minCount}
                </Text>
              )}
              {!slot.required && (
                <Text style={[meterStyles.optionalBadge, { fontFamily: 'Inter_400Regular' }]}>
                  opt
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    color: '#9C7B6A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  slots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  slotWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  slot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EDE5D8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD0BE',
  },
  slotMet: {
    backgroundColor: '#D2691E',
    borderColor: '#D2691E',
  },
  slotOptional: {
    borderStyle: 'dashed',
    borderColor: '#C8B8A2',
  },
  slotOptionalMet: {
    backgroundColor: '#EBF5EE',
    borderColor: '#708238',
    borderStyle: 'solid',
  },
  slotIcon: {
    fontSize: 14,
  },
  slotLabel: {
    fontSize: 9,
    color: '#9C7B6A',
    fontWeight: '600',
    textAlign: 'center',
  },
  slotLabelMet: {
    color: '#D2691E',
  },
  slotLabelOptionalMet: {
    color: '#708238',
  },
  slotCount: {
    fontSize: 9,
    color: '#B8A898',
    fontFamily: 'Inter_400Regular',
  },
  slotCountMet: {
    color: '#D2691E',
  },
  optionalBadge: {
    fontSize: 8,
    color: '#B8A898',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

// ---------------------------------------------------------------------------
// Sub-component: Bundle Tile (inline expandable)
// ---------------------------------------------------------------------------
function BundleTile({
  bundle,
  expanded,
  onToggle,
  onAdded,
}: {
  bundle: Bundle;
  expanded: boolean;
  onToggle: () => void;
  onAdded: () => void;
}) {
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (expanded && rows.length === 0) {
      loadRows();
    }
  }, [expanded]);

  async function loadRows() {
    setLoading(true);
    try {
      const ingredientIds = bundle.ingredients.map((i) => i.ingredientId);
      const [ingredientResult, pantryResult] = await Promise.all([
        supabase.from('ingredients').select('id, name, base_unit, preferred_unit').in('id', ingredientIds),
        supabase.from('user_pantry').select('ingredient_id, current_quantity_value').gt('current_quantity_value', 0),
      ]);

      const ingredients = ingredientResult.data ?? [];
      const pantryIds = new Set((pantryResult.data ?? []).map((p: any) => p.ingredient_id));
      const ids = ingredients.map((i: any) => i.id);

      const [{ data: ucData }, { data: globalUc }] = await Promise.all([
        supabase.from('unit_conversions').select('ingredient_id, input_unit').in('ingredient_id', ids),
        supabase.from('unit_conversions').select('input_unit, output_unit').is('ingredient_id', null),
      ]);

      const ucMap: Record<string, string[]> = {};
      for (const uc of ucData ?? []) {
        if (!ucMap[uc.ingredient_id]) ucMap[uc.ingredient_id] = [];
        if (uc.input_unit) ucMap[uc.ingredient_id].push(uc.input_unit);
      }

      // Keyed by ingredient uuid for O(1) lookup
      const ingMap: Record<string, any> = {};
      for (const ing of ingredients) ingMap[ing.id] = ing;

      const built: IngredientRow[] = bundle.ingredients.map((bundleIng) => {
        const ing = ingMap[bundleIng.ingredientId];
        const alreadyHave = ing ? pantryIds.has(ing.id) : false;
        let availableUnits: string[] = [bundleIng.defaultUnit];
        if (ing) {
          const specific = ucMap[ing.id] ?? [];
          const compatGlobal = (globalUc ?? [])
            .filter((u: any) => u.output_unit === ing.base_unit)
            .map((u: any) => u.input_unit)
            .filter(Boolean);
          availableUnits = Array.from(new Set([ing.preferred_unit, ing.base_unit, ...specific, ...compatGlobal])).filter(Boolean);
        }
        const selectedUnit = availableUnits.includes(bundleIng.defaultUnit) ? bundleIng.defaultUnit : availableUnits[0] ?? bundleIng.defaultUnit;
        return { name: bundleIng.name, checked: !alreadyHave, alreadyHave, quantity: 1, selectedUnit, availableUnits };
      });

      setRows(built);
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(idx: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, checked: !r.checked } : r)));
  }

  function changeQty(idx: number, delta: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r)));
  }

  function selectUnit(idx: number, unit: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selectedUnit: unit } : r)));
    setUnitPickerIndex(null);
  }

  const checkedRows = rows.filter((r) => r.checked);

  async function handleAdd() {
    if (checkedRows.length === 0 || saving) return;
    setSaving(true);
    try {
      for (const row of checkedRows) {
        const { error } = await supabase.rpc('add_pantry_item', {
          p_ingredient_name: row.name,
          p_quantity: row.quantity,
          p_unit: row.selectedUnit,
        });
        if (error) throw error;
      }
      onAdded();
      onToggle(); // collapse after adding
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={tileStyles.card}>
      <TouchableOpacity style={tileStyles.header} onPress={onToggle} activeOpacity={0.75}>
        <View style={tileStyles.headerIconWrap}>
          <Text style={tileStyles.headerIcon}>{bundle.icon}</Text>
        </View>
        <View style={tileStyles.headerText}>
          <Text style={[tileStyles.headerTitle, { fontFamily: 'Inter_400Regular' }]}>{bundle.name}</Text>
          <Text style={[tileStyles.headerDesc, { fontFamily: 'Inter_400Regular' }]}>{bundle.description}</Text>
        </View>
        <View style={tileStyles.chevron}>
          {expanded
            ? <ChevronUp size={16} color="#9C7B6A" />
            : <ChevronDown size={16} color="#9C7B6A" />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={tileStyles.body}>
          {loading ? (
            <View style={tileStyles.loadingWrap}>
              <ActivityIndicator size="small" color="#D2691E" />
            </View>
          ) : (
            <>
              {rows.map((row, idx) => (
                <View
                  key={row.name}
                  style={[
                    tileStyles.row,
                    idx < rows.length - 1 && tileStyles.rowDivider,
                    row.alreadyHave && tileStyles.rowHave,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      tileStyles.checkbox,
                      row.checked && tileStyles.checkboxChecked,
                      row.alreadyHave && !row.checked && tileStyles.checkboxHave,
                    ]}
                    onPress={() => toggleRow(idx)}
                    activeOpacity={0.7}
                  >
                    {row.checked && <Check size={11} color="#fff" strokeWidth={3} />}
                    {row.alreadyHave && !row.checked && <View style={tileStyles.haveDot} />}
                  </TouchableOpacity>
                  <Text style={[tileStyles.rowName, { fontFamily: 'Inter_400Regular' }, !row.checked && tileStyles.rowNameDim]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <View style={tileStyles.controls}>
                    <View style={tileStyles.stepper}>
                      <TouchableOpacity style={tileStyles.stepBtn} onPress={() => changeQty(idx, -1)}>
                        <Minus size={11} color="#D2691E" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={[tileStyles.stepQty, { fontFamily: 'Inter_400Regular' }]}>{row.quantity}</Text>
                      <TouchableOpacity style={tileStyles.stepBtn} onPress={() => changeQty(idx, 1)}>
                        <Plus size={11} color="#D2691E" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={tileStyles.unitBtn} onPress={() => setUnitPickerIndex(idx)}>
                      <Text style={[tileStyles.unitText, { fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{row.selectedUnit}</Text>
                      <ChevronDown size={10} color="#6B5344" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[tileStyles.addBtn, (checkedRows.length === 0 || saving) && tileStyles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={checkedRows.length === 0 || saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Plus size={15} color="#fff" strokeWidth={2.5} />
                    <Text style={[tileStyles.addBtnText, { fontFamily: 'Inter_400Regular' }]}>
                      Add {checkedRows.length} item{checkedRows.length !== 1 ? 's' : ''} to pantry
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Unit picker modal */}
      <Modal visible={unitPickerIndex !== null} transparent animationType="fade" onRequestClose={() => setUnitPickerIndex(null)}>
        <TouchableOpacity style={tileStyles.pickerOverlay} activeOpacity={1} onPress={() => setUnitPickerIndex(null)}>
          <View style={tileStyles.pickerCard}>
            <Text style={[tileStyles.pickerTitle, { fontFamily: 'Inter_400Regular' }]}>Select Unit</Text>
            <ScrollView>
              {(unitPickerIndex !== null ? rows[unitPickerIndex]?.availableUnits ?? [] : []).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[tileStyles.pickerOption, u === (unitPickerIndex !== null ? rows[unitPickerIndex]?.selectedUnit : '') && tileStyles.pickerOptionSelected]}
                  onPress={() => unitPickerIndex !== null && selectUnit(unitPickerIndex, u)}
                >
                  <Text style={[tileStyles.pickerOptionText, { fontFamily: 'Inter_400Regular' }, u === (unitPickerIndex !== null ? rows[unitPickerIndex]?.selectedUnit : '') && tileStyles.pickerOptionTextSelected]}>
                    {u}
                  </Text>
                  {u === (unitPickerIndex !== null ? rows[unitPickerIndex]?.selectedUnit : '') && <Check size={13} color="#D2691E" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerIcon: { fontSize: 20 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 14, color: '#2C1810', fontWeight: '700' },
  headerDesc: { fontSize: 12, color: '#9C7B6A', marginTop: 2 },
  chevron: { flexShrink: 0 },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#F0EAE0',
  },
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  rowHave: { backgroundColor: '#F2FAF4' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D8C9B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#D2691E', borderColor: '#D2691E' },
  checkboxHave: { borderColor: '#4A9B6A', backgroundColor: '#EBF5EE' },
  haveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A9B6A' },
  rowName: { flex: 1, fontSize: 13, color: '#2C1810', fontWeight: '500' },
  rowNameDim: { color: '#B8A898' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAE0',
    borderRadius: 7,
    overflow: 'hidden',
  },
  stepBtn: { width: 26, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepQty: { fontSize: 12, fontWeight: '700', color: '#2C1810', minWidth: 18, textAlign: 'center' },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAE0',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 6,
    gap: 3,
    maxWidth: 68,
  },
  unitText: { fontSize: 11, color: '#2C1810', fontWeight: '600', flex: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D2691E',
    margin: 14,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 6,
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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

// ---------------------------------------------------------------------------
// Sub-component: Inline Single Ingredient Bar
// ---------------------------------------------------------------------------
function SingleIngredientBar({ onAdded }: { onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIngredient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<SearchIngredient | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchIngredients = useCallback(async (text: string) => {
    if (!text.trim()) { setResults([]); setShowDropdown(false); return; }
    const { data } = await supabase
      .from('ingredients')
      .select('id, name, category, base_unit, preferred_unit')
      .ilike('name', `%${text}%`)
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
      setShowDropdown(true);
    } else {
      setResults([]); setShowDropdown(false);
    }
  }, []);

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
    setQuantity(1); setSelectedUnit('');
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

  return (
    <View style={singleStyles.wrapper}>
      {!selected ? (
        <>
          <View style={singleStyles.searchRow}>
            <TextInput
              style={[singleStyles.input, { fontFamily: 'Inter_400Regular' }]}
              placeholder="Search an ingredient..."
              placeholderTextColor="#B8A898"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
          {showDropdown && results.length > 0 && (
            <ScrollView style={singleStyles.dropdown} keyboardShouldPersistTaps="handled">
              {results.map((ing, idx) => (
                <TouchableOpacity
                  key={ing.id}
                  style={[singleStyles.dropdownItem, idx < results.length - 1 && singleStyles.dropdownDivider]}
                  onPress={() => handleSelect(ing)}
                  activeOpacity={0.7}
                >
                  <View style={singleStyles.dropdownMain}>
                    <Text style={[singleStyles.dropdownName, { fontFamily: 'Inter_400Regular' }]}>{ing.name}</Text>
                    <Text style={[singleStyles.dropdownCat, { fontFamily: 'Inter_400Regular' }]}>{ing.category}</Text>
                  </View>
                  <Text style={[singleStyles.dropdownUnits, { fontFamily: 'Inter_400Regular' }]}>{ing.units.slice(0, 3).join(', ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={singleStyles.stepperRow}>
          <TouchableOpacity onPress={handleClear} style={singleStyles.clearBtn}>
            <X size={13} color="#8C6A5A" />
          </TouchableOpacity>
          <Text style={[singleStyles.selectedName, { fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{selected.name}</Text>
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
          <TouchableOpacity style={[singleStyles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={15} color="#fff" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>
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

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function BuildPantryScreen() {
  const router = useRouter();
  const { bundles, loading: bundlesLoading } = useBundles();
  const [meterCounts, setMeterCounts] = useState<Record<string, number>>({
    protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0, fruit: 0, baking: 0,
  });
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [meterLoading, setMeterLoading] = useState(true);

  async function refreshMeter() {
    const { data } = await supabase
      .from('ai_pantry_snapshot')
      .select('name, category');
    const snapshot = (data ?? []) as PantrySnapshot;
    setMeterCounts(computeMeterCounts(snapshot));
    setMeterLoading(false);
  }

  useEffect(() => {
    refreshMeter();
  }, []);

  function handleAdded() {
    refreshMeter();
  }

  function handleToggleBundle(id: string) {
    setExpandedBundle((prev) => (prev === id ? null : id));
  }

  function handleContinue() {
    const missingKeys = METER_SLOTS
      .filter((s) => s.required && (meterCounts[s.key] ?? 0) < s.minCount)
      .map((s) => s.key);

    if (missingKeys.length === 0) {
      router.push('/(onboarding)/finish');
    } else {
      router.push({
        pathname: '/(onboarding)/missing-ingredients',
        params: { missing: missingKeys.join(',') },
      });
    }
  }

  const requiredMet = METER_SLOTS
    .filter((s) => s.required)
    .every((s) => (meterCounts[s.key] ?? 0) >= s.minCount);

  return (
    <SafeAreaView style={screenStyles.container} edges={['top']}>
      {/* Fixed top: step indicator + meter */}
      <View style={screenStyles.topFixed}>
        <View style={screenStyles.stepRow}>
          <View style={screenStyles.stepDot} />
          <View style={[screenStyles.stepLine, screenStyles.stepLineActive]} />
          <View style={[screenStyles.stepDot, screenStyles.stepDotActive]} />
          <View style={screenStyles.stepLine} />
          <View style={screenStyles.stepDot} />
          <View style={screenStyles.stepLine} />
          <View style={screenStyles.stepDot} />
        </View>

        <View style={screenStyles.topHeader}>
          <Text style={[screenStyles.topTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
            Stock your pantry
          </Text>
          <Text style={[screenStyles.topSubtitle, { fontFamily: 'Inter_400Regular' }]}>
            Add ingredients using bundles below or search individually
          </Text>
        </View>

        {meterLoading ? (
          <View style={screenStyles.meterLoading}>
            <ActivityIndicator size="small" color="#D2691E" />
          </View>
        ) : (
          <CompositionMeter counts={meterCounts} />
        )}

        <SingleIngredientBar onAdded={handleAdded} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[screenStyles.sectionLabel, { fontFamily: 'Inter_400Regular' }]}>
          Starter bundles
        </Text>
        {bundlesLoading ? (
          <View style={screenStyles.bundlesLoading}>
            <ActivityIndicator size="small" color="#D2691E" />
          </View>
        ) : (
          bundles.map((bundle) => (
            <BundleTile
              key={bundle.id}
              bundle={bundle}
              expanded={expandedBundle === bundle.id}
              onToggle={() => handleToggleBundle(bundle.id)}
              onAdded={handleAdded}
            />
          ))
        )}

        {/* Spacer so content clears the fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed footer */}
      <View style={screenStyles.footer}>
        <TouchableOpacity
          style={[screenStyles.continueBtn, requiredMet && screenStyles.continueBtnReady]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={[screenStyles.continueBtnText, { fontFamily: 'Inter_400Regular' }]}>
            {requiredMet ? 'Continue' : 'Continue anyway'}
          </Text>
          <ArrowRight size={17} color="#fff" />
        </TouchableOpacity>
        {!requiredMet && (
          <Text style={[screenStyles.continueBtnHint, { fontFamily: 'Inter_400Regular' }]}>
            Fill required slots for the best recipe results
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  topFixed: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
    zIndex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0D5C5',
  },
  stepDotActive: {
    backgroundColor: '#D2691E',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0D5C5',
  },
  stepLineActive: {
    backgroundColor: '#D2691E',
  },
  topHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  topTitle: {
    fontSize: 22,
    color: '#2C1810',
    marginBottom: 4,
  },
  topSubtitle: {
    fontSize: 13,
    color: '#6B5344',
    lineHeight: 19,
  },
  meterLoading: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bundlesLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#9C7B6A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#F0EAE0',
    gap: 6,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#A0856C',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnReady: {
    backgroundColor: '#D2691E',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  continueBtnHint: {
    fontSize: 12,
    color: '#A0856C',
    textAlign: 'center',
  },
});
