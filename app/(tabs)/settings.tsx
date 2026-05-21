import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Trash2, TriangleAlert, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      await supabase.auth.signOut();
      router.replace('/(auth)');
    } catch (err: any) {
      setDeleteError(err.message ?? 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
          Settings
        </Text>
      </View>

      <View style={styles.content}>
        {/* Account section */}
        <Text style={[styles.sectionLabel, { fontFamily: 'Inter_400Regular' }]}>
          Account
        </Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, styles.rowIconNeutral]}>
              <LogOut size={18} color="#4A3728" />
            </View>
            <Text style={[styles.rowLabel, { fontFamily: 'Inter_400Regular' }]}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, styles.sectionLabelDanger, { fontFamily: 'Inter_400Regular' }]}>
          Danger zone
        </Text>

        <View style={[styles.card, styles.cardDanger]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => { setDeleteError(''); setShowDeleteModal(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, styles.rowIconDanger]}>
              <Trash2 size={18} color="#C0392B" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={[styles.rowLabel, styles.rowLabelDanger, { fontFamily: 'Inter_400Regular' }]}>
                Delete account
              </Text>
              <Text style={[styles.rowSub, { fontFamily: 'Inter_400Regular' }]}>
                Permanently removes your account and all data
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Close button */}
            {!deleting && (
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowDeleteModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#9C7B6A" />
              </TouchableOpacity>
            )}

            {/* Warning icon */}
            <View style={styles.modalIconWrap}>
              <TriangleAlert size={28} color="#C0392B" />
            </View>

            <Text style={[styles.modalTitle, { fontFamily: 'NotoSerif_700Bold' }]}>
              Delete your account?
            </Text>

            <Text style={[styles.modalBody, { fontFamily: 'Inter_400Regular' }]}>
              This will permanently delete:
            </Text>

            <View style={styles.modalList}>
              {[
                'Your pantry and all ingredients',
                'All saved recipes',
                'Your account and login',
              ].map((item, i) => (
                <View key={i} style={styles.modalListRow}>
                  <View style={styles.modalBullet} />
                  <Text style={[styles.modalListText, { fontFamily: 'Inter_400Regular' }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[styles.modalWarning, { fontFamily: 'Inter_400Regular' }]}>
              This cannot be undone.
            </Text>

            {deleteError ? (
              <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>
                {deleteError}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.deleteBtn, deleting && styles.deleteBtnLoading]}
              onPress={handleDeleteAccount}
              disabled={deleting}
              activeOpacity={0.85}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.deleteBtnText, { fontFamily: 'Inter_400Regular' }]}>
                  Yes, delete my account
                </Text>
              )}
            </TouchableOpacity>

            {!deleting && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { fontFamily: 'Inter_400Regular' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  headerTitle: {
    fontSize: 24,
    color: '#2C1810',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#9C7B6A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabelDanger: {
    color: '#C0392B',
    marginTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
  },
  cardDanger: {
    borderColor: '#F5C6C2',
    backgroundColor: '#FFF8F8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconNeutral: {
    backgroundColor: '#F0EAE0',
  },
  rowIconDanger: {
    backgroundColor: '#FDECEB',
  },
  rowTextGroup: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    color: '#2C1810',
    fontWeight: '600',
  },
  rowLabelDanger: {
    color: '#C0392B',
  },
  rowSub: {
    fontSize: 12,
    color: '#9C7B6A',
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFAF5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FDECEB',
    borderWidth: 1,
    borderColor: '#F5C6C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: '#6B5344',
    marginBottom: 10,
  },
  modalList: {
    gap: 7,
    marginBottom: 14,
    paddingLeft: 4,
  },
  modalListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C0392B',
    flexShrink: 0,
  },
  modalListText: {
    fontSize: 14,
    color: '#2C1810',
    lineHeight: 20,
  },
  modalWarning: {
    fontSize: 13,
    color: '#C0392B',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FDECEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 48,
  },
  deleteBtnLoading: {
    opacity: 0.7,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#9C7B6A',
    fontWeight: '600',
  },
});
