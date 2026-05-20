import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Check, ChevronDown, Minus, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Bundle } from '@/lib/bundles';

type IngredientRow = {
  name: string;
  checked: boolean;
  alreadyHave: boolean;
  quantity: number;
  selectedUnit: string;
  availableUnits: string[];
};

type Props = {
  bundle: Bundle | null;
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function BundleSheet({ bundle, visible, onClose, onAdded }: Props) {
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);
  const [unitPickerRow, setUnitPickerRow] = useState<IngredientRow | null>(null);
  // Single animated value drives all sheet movement — avoids Animated.add jank
  const sheetY = useRef(new Animated.Value(700)).current;
  // Track the settled position so drag offsets are computed correctly
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
          }).start(() => { settledY.current = 0; });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && bundle) {
      sheetY.setValue(700);
      settledY.current = 700;
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => { settledY.current = 0; });
      loadIngredients(bundle);
    } else {
      Animated.timing(sheetY, {
        toValue: 700,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => { settledY.current = 700; });
    }
  }, [visible, bundle]);

  async function loadIngredients(b: Bundle) {
    setLoading(true);
    try {
      const names = b.ingredients.map((i) => i.name);

      const [ingredientResult, pantryResult] = await Promise.all([
        supabase
          .from('ingredients')
          .select('id, name, base_unit, preferred_unit')
          .in('name', names),
        supabase
          .from('user_pantry')
          .select('ingredient_id, current_quantity_value')
          .gt('current_quantity_value', 0),
      ]);

      const ingredients = ingredientResult.data ?? [];
      const pantryItems = pantryResult.data ?? [];
      const pantryIds = new Set(pantryItems.map((p: any) => p.ingredient_id));

      const ids = ingredients.map((i: any) => i.id);
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

      const ingredientMap: Record<string, any> = {};
      for (const ing of ingredients) {
        ingredientMap[ing.name] = ing;
      }

      const built: IngredientRow[] = b.ingredients.map((bundleIng) => {
        const ing = ingredientMap[bundleIng.name];
        const alreadyHave = ing ? pantryIds.has(ing.id) : false;

        let availableUnits: string[] = [bundleIng.defaultUnit];
        if (ing) {
          const specificUnits = ucMap[ing.id] ?? [];
          const compatibleGlobalUnits = (globalUc ?? [])
            .filter((u: any) => u.output_unit === ing.base_unit)
            .map((u: any) => u.input_unit)
            .filter(Boolean);
          availableUnits = Array.from(
            new Set([ing.preferred_unit, ing.base_unit, ...specificUnits, ...compatibleGlobalUnits])
          ).filter(Boolean);
        }

        const selectedUnit =
          availableUnits.includes(bundleIng.defaultUnit)
            ? bundleIng.defaultUnit
            : availableUnits[0] ?? bundleIng.defaultUnit;

        return {
          name: bundleIng.name,
          checked: !alreadyHave,
          alreadyHave,
          quantity: 1,
          selectedUnit,
          availableUnits,
        };
      });

      setRows(built);
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(idx: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, checked: !r.checked } : r))
    );
  }

  function changeQuantity(idx: number, delta: number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r
      )
    );
  }

  function openUnitPicker(idx: number) {
    setUnitPickerIndex(idx);
    setUnitPickerRow(rows[idx]);
  }

  function selectUnit(idx: number, unit: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selectedUnit: unit } : r))
    );
    setUnitPickerIndex(null);
    setUnitPickerRow(null);
  }

  function closeUnitPicker() {
    setUnitPickerIndex(null);
    setUnitPickerRow(null);
  }

  const checkedRows = rows.filter((r) => r.checked);

  async function handleAdd() {
    if (checkedRows.length === 0) return;
    setSaving(true);
    try {
      for (const row of checkedRows) {
        await supabase.rpc('add_pantry_item', {
          p_ingredient_name: row.name,
          p_quantity: row.quantity,
          p_unit: row.selectedUnit,
        });
      }
      onAdded();
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setUnitPickerIndex(null);
    sheetY.setValue(700);
    settledY.current = 700;
    onClose();
  }

  const alreadyHaveCount = rows.filter((r) => r.alreadyHave).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetY }] },
          ]}
        >
          {/* Drag zone: handle + header + pills */}
          <View {...panResponder.panHandlers}>
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            {bundle && (
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconWrap}>
                    <Text style={styles.headerIcon}>{bundle.icon}</Text>
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{bundle.name}</Text>
                    <Text style={styles.headerDesc}>{bundle.description}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={16} color="#6B5344" />
                </TouchableOpacity>
              </View>
            )}

            {/* Pills */}
            {bundle && !loading && (
              <View style={styles.pills}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{bundle.ingredients.length} ingredients</Text>
                </View>
                {alreadyHaveCount > 0 && (
                  <View style={[styles.pill, styles.pillHave]}>
                    <Text style={[styles.pillText, styles.pillHaveText]}>
                      {alreadyHaveCount} already in pantry
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Ingredient List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#D2691E" />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}

            >
              {rows.map((row, idx) => (
                <View
                  key={row.name}
                  style={[
                    styles.ingredientRow,
                    idx < rows.length - 1 && styles.ingredientDivider,
                    row.alreadyHave && styles.ingredientRowHave,
                  ]}
                >
                  {/* Checkbox — green-tinted border when already in pantry */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      row.checked && styles.checkboxChecked,
                      row.alreadyHave && !row.checked && styles.checkboxHave,
                    ]}
                    onPress={() => toggleRow(idx)}
                    activeOpacity={0.7}
                  >
                    {row.checked && <Check size={12} color="#fff" strokeWidth={3} />}
                    {row.alreadyHave && !row.checked && <View style={styles.haveDot} />}
                  </TouchableOpacity>

                  {/* Name */}
                  <Text
                    style={[styles.ingredientName, !row.checked && styles.ingredientNameUnchecked]}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>

                  {/* Stepper + Unit */}
                  <View style={styles.controls}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => changeQuantity(idx, -1)}
                      >
                        <Minus size={12} color="#D2691E" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{row.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => changeQuantity(idx, 1)}
                      >
                        <Plus size={12} color="#D2691E" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.unitBtn}
                      onPress={() => openUnitPicker(idx)}
                    >
                      <Text style={styles.unitText} numberOfLines={1}>
                        {row.selectedUnit}
                      </Text>
                      <ChevronDown size={11} color="#6B5344" />
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </ScrollView>
          )}

          {/* Unit picker modal */}
          <Modal
            visible={unitPickerIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={closeUnitPicker}
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={closeUnitPicker}
            >
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select Unit</Text>
                <ScrollView>
                  {(unitPickerRow?.availableUnits ?? []).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.pickerOption,
                        u === unitPickerRow?.selectedUnit && styles.pickerOptionSelected,
                      ]}
                      onPress={() => unitPickerIndex !== null && selectUnit(unitPickerIndex, u)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          u === unitPickerRow?.selectedUnit && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {u}
                      </Text>
                      {u === unitPickerRow?.selectedUnit && (
                        <Check size={14} color="#D2691E" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Add Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addBtn,
                (checkedRows.length === 0 || saving) && styles.addBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={checkedRows.length === 0 || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Plus size={17} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.addBtnText}>
                    Add {checkedRows.length} item{checkedRows.length !== 1 ? 's' : ''} to pantry
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8C9B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
  },
  headerDesc: {
    fontSize: 13,
    color: '#9C7B6A',
    fontFamily: 'Inter_400Regular',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  pill: {
    backgroundColor: '#F0EAE0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillHave: {
    backgroundColor: '#EBF5EE',
  },
  pillText: {
    fontSize: 12,
    color: '#6B5344',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
  pillHaveText: {
    color: '#2D5A3D',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: '#EDE8DE',
  },
  listContent: {
    paddingVertical: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  ingredientRowHave: {
    backgroundColor: '#F2FAF4',
  },
  ingredientDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D8C9B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#D2691E',
    borderColor: '#D2691E',
  },
  checkboxHave: {
    borderColor: '#4A9B6A',
    backgroundColor: '#EBF5EE',
  },
  haveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4A9B6A',
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
  },
  ingredientNameUnchecked: {
    color: '#B8A898',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAE0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    minWidth: 20,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAE0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
    maxWidth: 72,
  },
  unitText: {
    fontSize: 12,
    color: '#2C1810',
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
    flex: 1,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE8DE',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D2691E',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontWeight: '700',
  },
});
