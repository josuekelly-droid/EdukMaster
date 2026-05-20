import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Picker } from '@react-native-picker/picker';

export default function ProfilScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ exercices: 0, badges: 0, examens: 0, rang: 'bronze' });

  const [showClasseModal, setShowClasseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [classes] = useState(['3eme', '2nde', '1ere', 'Terminale']);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setSelectedClasse(data.classe || '3eme');
      }

      const { count: nbExercices } = await supabase.from('resultats').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: nbBadges } = await supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: nbExamens } = await supabase.from('examens_blancs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { data: classement } = await supabase.from('classement').select('rang').eq('user_id', user.id).single();

      setStats({
        exercices: nbExercices || 0,
        badges: nbBadges || 0,
        examens: nbExamens || 0,
        rang: classement?.rang || 'bronze',
      });
    }
    setLoading(false);
  }

  async function handleChangeClasse() {
    if (!selectedClasse) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ classe: selectedClasse }).eq('id', profile.id);
    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); }
    else {
      setProfile({ ...profile, classe: selectedClasse });
      setShowClasseModal(false);
      Alert.alert('Succes', `Classe mise a jour : ${selectedClasse}`);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Erreur', 'Tous les champs sont obligatoires.'); return; }
    if (newPassword.length < 6) { Alert.alert('Erreur', 'Minimum 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Erreur', 'Mots de passe differents.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (signInError) { setSaving(false); Alert.alert('Erreur', 'Mot de passe actuel incorrect.'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); }
    else {
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Succes', 'Mot de passe modifie.');
    }
  }

  async function handleLogout() {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Deconnecter', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  }

  function getRangEmoji(rang) {
    const rangs = { bronze: '🥉', argent: '🥈', or: '🥇', diamant: '💎', maitre: '👑', legende: '🏆' };
    return rangs[rang] || '🥉';
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER PREMIUM */}
      <View style={styles.headerPremium}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{profile?.nom_complet?.charAt(0)?.toUpperCase() || 'E'}</Text>
        </View>
        <Text style={styles.nomComplet}>{profile?.nom_complet || 'Eleve'}</Text>
        <View style={styles.classeBadgePremium}>
          <Text style={styles.classeBadgePremiumText}>{profile?.classe || '3eme'}</Text>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statValue}>{stats.exercices}</Text>
          <Text style={styles.statLabel}>Exercices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{stats.badges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{stats.examens}</Text>
          <Text style={styles.statLabel}>Examens</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>{getRangEmoji(stats.rang)}</Text>
          <Text style={styles.statValueRank}>{stats.rang}</Text>
          <Text style={styles.statLabel}>Rang</Text>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionCard} onPress={() => setShowClasseModal(true)}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.actionIconText}>🔄</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Changer de classe</Text>
            <Text style={styles.actionDesc}>Acceder aux cours de votre niveau</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setShowPasswordModal(true)}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.actionIconText}>🔒</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mot de passe</Text>
            <Text style={styles.actionDesc}>Securiser votre compte</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Badges')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.actionIconText}>🏆</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mes badges</Text>
            <Text style={styles.actionDesc}>{stats.badges} badges debloques</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <Text style={styles.actionIconText}>📜</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Confidentialite</Text>
            <Text style={styles.actionDesc}>Protection de vos donnees</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, styles.logoutCard]} onPress={handleLogout}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.actionIconText}>🚪</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: '#DC2626' }]}>Deconnexion</Text>
            <Text style={styles.actionDesc}>Quitter l application</Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#DC2626' }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL CLASSE */}
      <Modal visible={showClasseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer de classe</Text>
            <Text style={styles.modalDesc}>Les cours affiches s adapteront automatiquement.</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedClasse} onValueChange={setSelectedClasse} style={styles.picker}>
                {classes.map(c => <Picker.Item key={c} label={c} value={c} />)}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowClasseModal(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleChangeClasse} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalConfirmText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PASSWORD */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le mot de passe</Text>
            <Text style={styles.inputLabel}>Mot de passe actuel</Text>
            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} placeholder="Min. 6 caracteres" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <Text style={styles.inputLabel}>Confirmer</Text>
            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalConfirmText}>Modifier</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  headerPremium: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#8B5CF6', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 16 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  avatarLargeText: { fontSize: 40, fontWeight: 'bold', color: '#8B5CF6' },
  nomComplet: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  classeBadgePremium: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 },
  classeBadgePremiumText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  statValueRank: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', textTransform: 'capitalize' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  actionsSection: { marginHorizontal: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  actionIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionIconText: { fontSize: 20 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  actionDesc: { fontSize: 12, color: '#94A3B8' },
  actionArrow: { fontSize: 24, color: '#CBD5E1', fontWeight: '300' },
  logoutCard: { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: '#64748B', marginBottom: 20, textAlign: 'center' },
  pickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, overflow: 'hidden' },
  picker: { height: 55 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E293B' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});