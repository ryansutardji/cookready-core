import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Bundle } from '@/lib/bundles';

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

// ---------------------------------------------------------------------------
// Sub-component: Bundle Tile (inline expandable)
// ---------------------------------------------------------------------------
export function BundleTile({
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
                testID="bundle-tile-add-button"
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
