import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function DefiEnCoursScreen({ route, navigation }) {
  const { defiId } = route.params;
  const [defi, setDefi] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [repondu, setRepondu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [termine, setTermine] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchDefi();
  }, []);

  async function fetchDefi() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    console.log('=== DEFI EN COURS ===');
    console.log('defiId reçu:', defiId);

    const { data, error } = await supabase.from('defis').select('*').eq('id', defiId).single();

    console.log('data:', data ? 'trouvé' : 'null');
    console.log('error:', error);
    console.log('statut:', data?.statut);
    console.log('questions:', data?.questions?.length);
    console.log('questions brutes:', JSON.stringify(data?.questions)?.substring(0, 300));

    if (data) {
      setDefi(data);
      const isCreateur = data.createur_id === user?.id;
      const dejaJoue = isCreateur ? data.score_createur > 0 : data.score_adversaire > 0;
      if (dejaJoue) {
        setTermine(true);
      }
    }
    setLoading(false);
  }

  async function repondre(choix, correct) {
    if (repondu || termine) return;
    setRepondu(true);

    const points = correct ? defi.questions[currentQuestion].points : 0;
    const newScore = score + points;
    if (correct) setScore(newScore);

    setTimeout(async () => {
      if (currentQuestion < defi.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setRepondu(false);
      } else {
        await terminerDefi(newScore);
      }
    }, 800);
  }

  async function terminerDefi(scoreFinal) {
    setTermine(true);
    const isCreateur = defi.createur_id === currentUser?.id;

    const updateData = isCreateur
      ? { score_createur: scoreFinal, temps_createur: 0 }
      : { score_adversaire: scoreFinal, temps_adversaire: 0 };

    const { error } = await supabase.from('defis').update(updateData).eq('id', defi.id);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    const { data: updatedDefi } = await supabase.from('defis').select('*').eq('id', defi.id).single();

    if (updatedDefi.score_createur > 0 && updatedDefi.score_adversaire > 0) {
      const createurGagne = updatedDefi.score_createur > updatedDefi.score_adversaire;
      const nul = updatedDefi.score_createur === updatedDefi.score_adversaire;
      const vainqueurId = nul ? null : (createurGagne ? updatedDefi.createur_id : updatedDefi.adversaire_id);

      await supabase.from('defis').update({ statut: 'termine', vainqueur_id: vainqueurId }).eq('id', defi.id);

      await mettreAJourClassement(updatedDefi.createur_id, createurGagne || nul, nul);
      await mettreAJourClassement(updatedDefi.adversaire_id, !createurGagne || nul, nul);

      Alert.alert('🏆 Défi terminé !', `Score : ${updatedDefi.score_createur} - ${updatedDefi.score_adversaire}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('⏳ En attente', 'Ton adversaire doit encore jouer.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }

  async function mettreAJourClassement(userId, gagne, nul) {
    if (!userId) return;
    const { data: classement } = await supabase.from('classement').select('*').eq('user_id', userId).single();

    let points = 0;
    if (gagne && !nul) points = 50;
    else if (nul) points = 15;
    else points = 5;

    const newPoints = (classement?.points || 0) + points;
    const newVictoires = (classement?.victoires || 0) + (gagne && !nul ? 1 : 0);
    const newDefaites = (classement?.defaites || 0) + (!gagne && !nul ? 1 : 0);
    const newNuls = (classement?.nuls || 0) + (nul ? 1 : 0);

    let rang = 'bronze';
    if (newPoints >= 3000) rang = 'legende';
    else if (newPoints >= 1500) rang = 'maitre';
    else if (newPoints >= 750) rang = 'diamant';
    else if (newPoints >= 300) rang = 'or';
    else if (newPoints >= 100) rang = 'argent';

    if (classement) {
      await supabase.from('classement').update({ points: newPoints, victoires: newVictoires, defaites: newDefaites, nuls: newNuls, rang }).eq('user_id', userId);
    } else {
      await supabase.from('classement').insert({ user_id: userId, points: newPoints, victoires: newVictoires, defaites: newDefaites, nuls: newNuls, rang });
    }
  }

  if (loading) return <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />;
  if (!defi) return <Text style={{ textAlign: 'center', marginTop: 50, color: '#64748B' }}>Défi introuvable</Text>;

  if (termine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.text}>Tu as joué ! En attente de ton adversaire.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Retour à l'Arène</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!defi.questions || defi.questions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Aucune question trouvée pour ce défi.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = defi.questions[currentQuestion];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.progress}>Question {currentQuestion + 1} / {defi.questions.length}</Text>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.type === 'qcm' && question.options && (
          <View style={styles.optionsGrid}>
            {Object.entries(question.options).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.option,
                  repondu && key === question.reponse && styles.optionCorrect,
                  repondu && key !== question.reponse && styles.optionIncorrect,
                ]}
                onPress={() => repondre(key, key === question.reponse)}
                disabled={repondu}
              >
                <Text style={styles.optionKey}>{key}</Text>
                <Text style={styles.optionText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {question.type === 'vrai_faux' && (
          <View style={styles.vfRow}>
            <TouchableOpacity style={styles.vfBtn} onPress={() => repondre('vrai', question.reponse === 'vrai')} disabled={repondu}>
              <Text style={styles.vfText}>✅ VRAI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vfBtn} onPress={() => repondre('faux', question.reponse === 'faux')} disabled={repondu}>
              <Text style={styles.vfText}>❌ FAUX</Text>
            </TouchableOpacity>
          </View>
        )}

        {repondu && <Text style={styles.correction}>Réponse : {question.reponse}</Text>}
      </View>

      <Text style={styles.score}>⭐ {score} pts</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#F8FAFC' },
  emoji: { fontSize: 64, marginBottom: 16 },
  text: { fontSize: 16, textAlign: 'center', color: '#64748B', marginBottom: 20 },
  btn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, paddingHorizontal: 30 },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  progress: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  optionsGrid: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: '#E2E8F0' },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  optionIncorrect: { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
  optionKey: { fontWeight: 'bold', color: '#2563EB', marginRight: 10, width: 25 },
  optionText: { fontSize: 14, color: '#334155', flex: 1 },
  vfRow: { flexDirection: 'row', gap: 12 },
  vfBtn: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  vfText: { fontSize: 16, fontWeight: 'bold' },
  correction: { fontSize: 13, color: '#64748B', marginTop: 12, fontStyle: 'italic' },
  score: { fontSize: 18, fontWeight: 'bold', color: '#2563EB', textAlign: 'center', marginTop: 20 },
});