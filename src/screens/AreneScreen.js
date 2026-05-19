import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function AreneScreen({ navigation }) {
  const [defis, setDefis] = useState([]);
  const [classement, setClassement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [codeInvitation, setCodeInvitation] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [user, setUser] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  async function fetchData() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    if (!currentUser) { setLoading(false); return; }

    const { data: mesDefis } = await supabase
      .from('defis')
      .select('*')
      .or(`createur_id.eq.${currentUser.id},adversaire_id.eq.${currentUser.id}`)
      .order('cree_le', { ascending: false })
      .limit(10);

    const { data: topClassement } = await supabase
      .from('classement')
      .select('*')
      .order('points', { ascending: false })
      .limit(20);

    const { data: monClassement } = await supabase
      .from('classement')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    const { data: toutesMatieres } = await supabase.from('matieres').select('*').order('nom');

    // Récupérer les IDs uniques des joueurs
    const userIds = new Set();
    mesDefis?.forEach(d => {
      if (d.createur_id) userIds.add(d.createur_id);
      if (d.adversaire_id) userIds.add(d.adversaire_id);
    });
    const uniqueIds = [...userIds];

    // Récupérer les profils
    let profileMap = {};
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nom_complet')
        .in('id', uniqueIds);
      
      console.log('=== PROFILES DEBUG ===');
      console.log('uniqueIds:', uniqueIds);
      console.log('profiles trouvés:', profiles?.length);
      console.log('profiles:', JSON.stringify(profiles));
      
      profiles?.forEach(p => { profileMap[p.id] = p.nom_complet; });
      console.log('profileMap:', JSON.stringify(profileMap));
    }

    // Récupérer les matières pour chaque défi
    const matiereIds = new Set();
    mesDefis?.forEach(d => { if (d.matiere_id) matiereIds.add(d.matiere_id); });
    const uniqueMatiereIds = [...matiereIds];
    
    let matiereMap = {};
    if (uniqueMatiereIds.length > 0) {
      const { data: matieresData } = await supabase
        .from('matieres')
        .select('id, nom, icone')
        .in('id', uniqueMatiereIds);
      matieresData?.forEach(m => { matiereMap[m.id] = { nom: m.nom, icone: m.icone }; });
    }

    setDefis(formatDefis(mesDefis || [], currentUser.id, profileMap, matiereMap));
    setClassement(topClassement || []);
    setMatieres(toutesMatieres || []);
    setUserRank(monClassement);
    setLoading(false);
    setRefreshing(false);
  }

  function formatDefis(defis, userId, profileMap, matiereMap) {
    return defis.map(d => ({
      ...d,
      createur_nom: profileMap[d.createur_id] || 'Inconnu',
      adversaire_nom: d.adversaire_id ? (profileMap[d.adversaire_id] || 'Inconnu') : 'En attente...',
      matiere_nom: matiereMap[d.matiere_id]?.nom || '?',
      matiere_icone: matiereMap[d.matiere_id]?.icone || '📚',
      monTour: d.statut === 'en_cours' && (
        (d.createur_id === userId && d.score_createur === 0) ||
        (d.adversaire_id === userId && d.score_adversaire === 0 && d.score_createur > 0)
      ),
    }));
  }

  async function createDefi() {
    if (!selectedMatiere) {
      Alert.alert('Erreur', 'Choisis une matière');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('classe')
      .eq('id', user.id)
      .single();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { data, error } = await supabase
      .from('defis')
      .insert({
        code_invitation: code,
        createur_id: user.id,
        matiere_id: selectedMatiere.id,
        classe: profile?.classe || '3ème',
        statut: 'en_attente',
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setShowCreate(false);
      setSelectedMatiere(null);
      Alert.alert('✅ Défi créé !', `Code : ${code}\n\nPartage ce code avec ton adversaire.`, [
        { text: 'OK', style: 'cancel' },
        { text: '📤 Partager', onPress: () => { Share.share({ message: `⚔️ Je te défie sur EdukMaster !\n\n📚 Matière : ${selectedMatiere.icone} ${selectedMatiere.nom}\n🔑 Code : ${code}\n\nRejoins-moi dans l'Arène ! 🎓` }); } },
      ]);
      fetchData();
    }
  }

  async function joinDefi() {
    if (!codeInvitation.trim()) {
      Alert.alert('Erreur', 'Entre le code d\'invitation');
      return;
    }

    const { data: defi, error } = await supabase
      .from('defis')
      .select('*')
      .eq('code_invitation', codeInvitation.trim())
      .eq('statut', 'en_attente')
      .single();

    if (error || !defi) {
      Alert.alert('Erreur', 'Code invalide ou défi déjà commencé');
      return;
    }

    if (defi.createur_id === user.id) {
      Alert.alert('Erreur', 'Tu ne peux pas rejoindre ton propre défi');
      return;
    }

    const { data: coursList } = await supabase
      .from('cours')
      .select('id')
      .eq('matiere_id', defi.matiere_id)
      .eq('classe', defi.classe || '3ème');

    if (!coursList || coursList.length === 0) {
      Alert.alert('Erreur', `Aucun cours trouvé pour cette matière en ${defi.classe || '3ème'}.`);
      return;
    }

    const coursIds = coursList.map(c => c.id);
    const { data: exercices } = await supabase
      .from('exercices')
      .select('*')
      .in('cours_id', coursIds)
      .order('ordre')
      .limit(10);

    if (!exercices || exercices.length === 0) {
      Alert.alert('Erreur', 'Aucun exercice trouvé pour cette matière.');
      return;
    }

    const questions = exercices.map(e => ({
      id: e.id,
      question: e.question,
      type: e.type,
      options: e.options,
      reponse: e.reponse_correcte,
      points: e.points,
    }));

    const { error: updateError } = await supabase
      .from('defis')
      .update({ adversaire_id: user.id, statut: 'en_cours', questions: questions })
      .eq('id', defi.id);

    if (updateError) {
      Alert.alert('Erreur', updateError.message);
      return;
    }

    setShowJoin(false);
    setCodeInvitation('');
    fetchData();
    navigation.navigate('DefiEnCours', { defiId: defi.id });
  }

  function getRangEmoji(rang) {
    const rangs = { bronze: '🥉', argent: '🥈', or: '🥇', diamant: '💎', maitre: '👑', legende: '🏆' };
    return rangs[rang] || '🥉';
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
      <Text style={styles.title}>⚔️ Arène</Text>
      {userRank && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankTitle}>Mon classement</Text>
          <View style={styles.myRankRow}>
            <Text style={styles.myRankEmoji}>{getRangEmoji(userRank.rang)}</Text>
            <View>
              <Text style={styles.myRankPoints}>{userRank.points} pts</Text>
              <Text style={styles.myRankStats}>{userRank.victoires}V - {userRank.defaites}D</Text>
            </View>
          </View>
        </View>
      )}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreate(true)}><Text style={styles.actionBtnIcon}>🎯</Text><Text style={styles.actionBtnText}>Créer un défi</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowJoin(true)}><Text style={styles.actionBtnIcon}>📝</Text><Text style={styles.actionBtnText}>Rejoindre</Text></TouchableOpacity>
      </View>
      {showCreate && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🎯 Créer un défi</Text>
          <Text style={styles.modalSubtitle}>Choisis une matière :</Text>
          <View style={styles.matiereGrid}>
            {matieres.map((mat) => (
              <TouchableOpacity key={mat.id} style={[styles.matiereBtn, selectedMatiere?.id === mat.id && styles.matiereBtnActive]} onPress={() => setSelectedMatiere(mat)}>
                <Text style={styles.matiereBtnIcon}>{mat.icone}</Text><Text style={styles.matiereBtnText}>{mat.nom}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={createDefi}><Text style={styles.confirmText}>Créer</Text></TouchableOpacity>
          </View>
        </View>
      )}
      {showJoin && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>📝 Rejoindre un défi</Text>
          <TextInput style={styles.codeInput} placeholder="Code à 6 chiffres" value={codeInvitation} onChangeText={setCodeInvitation} keyboardType="number-pad" maxLength={6} textAlign="center" />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowJoin(false)}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={joinDefi}><Text style={styles.confirmText}>Rejoindre</Text></TouchableOpacity>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>📋 Mes défis</Text>
      {defis.length === 0 ? <Text style={styles.emptyText}>Aucun défi pour le moment</Text> : defis.map((defi) => (
        <TouchableOpacity key={defi.id} style={styles.defiCard} onPress={() => { if (defi.statut === 'en_cours' && defi.monTour) { navigation.navigate('DefiEnCours', { defiId: defi.id }); } }}>
          <View style={styles.defiHeader}>
            <Text style={styles.defiMatiere}>{defi.matiere_icone} {defi.matiere_nom}</Text>
            <Text style={[styles.defiStatut, defi.statut === 'en_cours' && styles.defiEnCours]}>{defi.statut === 'en_attente' ? '⏳ En attente' : defi.statut === 'en_cours' ? '⚡ En cours' : '✅ Terminé'}</Text>
          </View>
          <Text style={styles.defiPlayers}>{defi.createur_nom} vs {defi.adversaire_nom}</Text>
          {defi.classe && <Text style={styles.defiClasse}>📚 {defi.classe}</Text>}
          {defi.statut === 'en_cours' && defi.monTour && <Text style={styles.monTour}>👉 C'est ton tour de jouer !</Text>}
          {defi.statut === 'termine' && <Text style={styles.defiResult}>{defi.vainqueur_id === user?.id ? '🏆 Victoire !' : defi.vainqueur_id ? '😔 Défaite' : '🤝 Nul'}</Text>}
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>🏆 Classement</Text>
      {classement.map((entry, index) => (
        <View key={entry.user_id} style={[styles.rankCard, entry.user_id === user?.id && styles.myRank]}>
          <Text style={styles.rankPos}>#{index + 1}</Text>
          <Text style={styles.rankEmoji}>{getRangEmoji(entry.rang)}</Text>
          <Text style={styles.rankName} numberOfLines={1}>{entry.user_id === user?.id ? 'Vous' : `Joueur ${index + 1}`}</Text>
          <Text style={styles.rankPoints}>{entry.points} pts</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
  myRankCard: { backgroundColor: '#1E40AF', borderRadius: 16, padding: 16, marginBottom: 16 },
  myRankTitle: { color: '#BFDBFE', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  myRankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myRankEmoji: { fontSize: 36 },
  myRankPoints: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  myRankStats: { color: '#93C5FD', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  actionBtnIcon: { fontSize: 32, marginBottom: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#2563EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  matiereGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  matiereBtn: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', width: '30%' },
  matiereBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  matiereBtnIcon: { fontSize: 24, marginBottom: 4 },
  matiereBtnText: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
  codeInput: { backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#2563EB', borderRadius: 12, padding: 16, fontSize: 28, fontWeight: 'bold', letterSpacing: 8, textAlign: 'center', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  confirmBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, marginTop: 8 },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  defiCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  defiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  defiMatiere: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  defiStatut: { fontSize: 11, color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defiEnCours: { color: '#16A34A', backgroundColor: '#DCFCE7' },
  defiPlayers: { fontSize: 13, color: '#64748B' },
  defiClasse: { fontSize: 11, color: '#2563EB', marginTop: 2 },
  monTour: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 4 },
  defiResult: { fontSize: 14, fontWeight: 'bold', marginTop: 4, color: '#1E293B' },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  myRank: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#2563EB' },
  rankPos: { fontSize: 14, fontWeight: 'bold', color: '#64748B', width: 30 },
  rankEmoji: { fontSize: 22, width: 35 },
  rankName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  rankPoints: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },
});