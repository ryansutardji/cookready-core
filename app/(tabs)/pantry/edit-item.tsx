import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function EditItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category: string;
    conversionFactor: string;
    is_permanent: string;
  }>();

  const [quantity, setQuantity] = useState(parseFloat(params.quantity ?? '0'));
  const [inputValue, setInputValue] = useState(String(parseFloat(params.quantity ?? '0')));
  const [isPermanent, setIsPermanent] = useState(params.is_permanent === 'true');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const unit = params.unit ?? '';
  const name = params.name ?? '';

  function buildReadable(qty: number, u: string): string {
    const display = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
    return u ? `${display} ${u}` : display;
  }

  function stepQuantity(delta: number) {
    const next = Math.max(0, parseFloat(((quantity + delta) * 10).toFixed(0)) / 10);
    setQuantity(next);
    setInputValue(Number.isInteger(next) ? String(next) : next.toFixed(1));
  }

  function handleInputChange(val: string) {
    setInputValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setQuantity(parsed);
    }
  }

  function handleInputBlur() {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < 0) {
      setQuantity(0);
      setInputValue('0');
    } else {
      setQuantity(parsed);
      setInputValue(Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1));
    }
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const factor = parseFloat(params.conversionFactor ?? '0');
      const baseQuantity = factor > 0 ? quantity * factor : quantity;
      const { error: err } = await supabase
        .from('user_pantry')
        .update({
          current_quantity_value: baseQuantity,
          is_permanent: isPermanent,
          last_updated: new Date().toISOString(),
        })
        .eq('id', params.id);
      if (err) throw err;
      router.back();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      const { error: err } = await supabase
        .from('user_pantry')
        .delete()
        .eq('id', params.id);
      if (err) throw err;
      router.back();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete.');
      setDeleting(false);
    }
  }

  const stepSize = unit === 'g' || unit === 'ml' ? 50 : 0.5;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#4A3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Ingredient</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.nameCard}>
          <Text style={styles.categoryLabel}>{params.category}</Text>
          <Text style={styles.itemName}>{name}</Text>
          {unit ? <Text style={styles.unitLabel}>Unit: {unit}</Text> : null}
        </View>

        <View
          style={[
            styles.section,
            isPermanent && { opacity: 0.38, pointerEvents: 'none' as const },
          ]}
        >
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => stepQuantity(-stepSize)}
              style={[styles.stepBtn, quantity <= 0 && styles.stepBtnDisabled]}
              activeOpacity={0.7}
              disabled={quantity <= 0}
            >
              <Minus size={20} color={quantity <= 0 ? '#C5B8A8' : '#4A3728'} />
            </TouchableOpacity>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.quantityInput}
                value={inputValue}
                onChangeText={handleInputChange}
                onBlur={handleInputBlur}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              {unit ? <Text style={styles.unitInline}>{unit}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={() => stepQuantity(stepSize)}
              style={styles.stepBtn}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#4A3728" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            {[0.5, 1, 2, 5].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => {
                  setQuantity(val);
                  setInputValue(Number.isInteger(val) ? String(val) : val.toFixed(1));
                }}
                style={[styles.quickBtn, quantity === val && styles.quickBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickBtnText, quantity === val && styles.quickBtnTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsPermanent(!isPermanent)}
          style={styles.alwaysInStockRow}
          activeOpacity={0.7}
        >
          <View style={styles.alwaysInStockLeft}>
            <Text style={styles.alwaysInStockLabel}>Always in stock</Text>
            <Text style={styles.alwaysInStockHint}>Quantity won't be deducted when cooking</Text>
          </View>
          <View style={[styles.toggleSwitch, { backgroundColor: isPermanent ? '#D2691E' : '#E8E0D0' }]}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: isPermanent ? 20 : 2 }] }]} />
          </View>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          activeOpacity={0.8}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          activeOpacity={0.8}
          disabled={saving || deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#D2691E" size="small" />
          ) : (
            <View style={styles.deleteBtnInner}>
              <Trash2 size={16} color="#D2691E" />
              <Text style={styles.deleteBtnText}>Remove from Pantry</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFAF5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 18,
    color: '#4A3728',
  },
  body: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  nameCard: {
    backgroundColor: '#F0EBE1',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  categoryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9C8678',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  itemName: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 24,
    color: '#4A3728',
    marginTop: 2,
  },
  unitLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9C8678',
    marginTop: 2,
  },
  alwaysInStockRow: {
    backgroundColor: '#F7F3ED',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alwaysInStockLeft: {
    flex: 1,
    paddingRight: 12,
  },
  alwaysInStockLabel: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 15,
    color: '#4A3728',
  },
  alwaysInStockHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9C8678',
    marginTop: 4,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  section: {
    backgroundColor: '#F7F3ED',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 15,
    color: '#4A3728',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: '#F0EBE1',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0D0',
    paddingHorizontal: 14,
    height: 52,
    gap: 6,
  },
  quantityInput: {
    flex: 1,
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    color: '#4A3728',
    textAlign: 'center',
  },
  unitInline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9C8678',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnActive: {
    backgroundColor: '#D2691E',
  },
  quickBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4A3728',
    fontWeight: '600',
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  errorBox: {
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0C4A8',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#D2691E',
  },
  saveBtn: {
    backgroundColor: '#D2691E',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  deleteBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0D0',
    backgroundColor: '#FFFAF5',
  },
  deleteBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#D2691E',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
