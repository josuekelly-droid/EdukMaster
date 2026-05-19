import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState({ jours: 0, record: 0 });
  const [stats, setStats] = useState({
    totalExercices: 0,
    totalCorrect: 0,
    totalPoints: 0,
    maxPoints: 0,
    examens: [],
    matieresProgression: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  async function fetchDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileData) setProfile(profileData);

    // Streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (streakData) setStreak({ jours: streakData.jours_consecutifs, record: streakData.record });

    // Résultats
    const { data: resultats } = await supabase
      .from('resultats')
      .select('*')
      .eq('user_id', user.id);

    // Examens
    const { data: examens } = await supabase
      .from('examens_blancs')
      .select('*, matieres(nom, icone)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5);

    // Matières
    const { data: matieres } = await supabase.from('matieres').select('*');
    
    let matieresProgression = [];
    if (matieres && resultats) {
      matieresProgression = await Promise.all(
        matieres.map(async (mat) => {
          const { data: exosMatiere } = await supabase
            .from('exercices')
            .select('id, points, cours!inner(matiere_id)')
            .eq('cours.matiere_id', mat.id)
            .eq('cours.classe', profileData?.classe || '3ème');

          const totalExos = exosMatiere?.length || 0;
          const exosIds = exosMatiere?.map(e => e.id) || [];
          const resultatsMatiere = resultats.filter(r => exosIds.includes(r.exercice_id) && r.correct);
          
          return {
            ...mat,
            total: totalExos,
            reussi: resultatsMatiere.length,
            pourcentage: totalExos > 0 ? Math.round((resultatsMatiere.length / totalExos) * 100) : 0,
          };
        })
      );
    }

    const totalCorrect = resultats?.filter(r => r.correct).length || 0;

    setStats({
      totalExercices: resultats?.length || 0,
      totalCorrect: totalCorrect,
      examens: examens || [],
      matieresProgression: matieresProgression,
    });

    setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchDashboard();
  }

  function getPourcentageGlobal() {
    if (stats.totalExercices === 0) return 0;
    return Math.round((stats.totalCorrect / stats.totalExercices) * 100);
  }

  function getMotivation() {
    const p = getPourcentageGlobal();
    if (p >= 80) return '🌟 Excellent ! Continue comme ça !';
    if (p >= 60) return '👏 Belle progression !';
    if (p >= 40) return '📖 Tu progresses bien !';
    if (stats.totalExercices === 0) return '🎯 Lance-toi dans tes premiers exercices !';
    return '💪 Chaque exercice te rapproche de la réussite !';
  }

  // Naviguer vers les chapitres d'une matière
  function goToMatiere(matiere) {
    navigation.navigate('Chapitres', { matiere });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
      }
    >
      {/* HEADER PREMIUM */}
      <View style={styles.headerPremium}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Bonjour {profile?.nom_complet?.split(' ')[0] || 'Élève'} 👋
            </Text>
            <Text style={styles.classeBadge}>{profile?.classe || '3ème'}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profile?.nom_complet?.charAt(0)?.toUpperCase() || 'E'}
            </Text>
          </View>
        </View>

        {/* Streak */}
        {streak.jours > 0 && (
          <View style={styles.streakRow}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{streak.jours} jour{streak.jours > 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.streakRecord}>Record : {streak.record} jours</Text>
          </View>
        )}
      </View>

      {/* Score global */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statValue}>{stats.totalExercices}</Text>
          <Text style={styles.statLabel}>Exercices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{stats.totalCorrect}</Text>
          <Text style={styles.statLabel}>Réussis</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{getPourcentageGlobal()}%</Text>
          <Text style={styles.statLabel}>Réussite</Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getPourcentageGlobal()}%` }]} />
        </View>
      </View>

      {/* Message motivation */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>{getMotivation()}</Text>
      </View>

      {/* Progression par matière - CLICKABLE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Progression par matière</Text>
        <View style={styles.matieresGrid}>
          {stats.matieresProgression.map((mat) => (
            <TouchableOpacity
              key={mat.id}
              style={styles.matiereCard}
              onPress={() => goToMatiere(mat)}
              activeOpacity={0.7}
            >
              <View style={[styles.matiereIconContainer, { backgroundColor: mat.couleur + '20' }]}>
                <Text style={styles.matiereIcon}>{mat.icone}</Text>
              </View>
              <Text style={styles.matiereNom} numberOfLines={1}>{mat.nom}</Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${mat.pourcentage}%` }]} />
              </View>
              <Text style={styles.matiereStats}>{mat.pourcentage}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Derniers examens */}
      {stats.examens.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Dernières activités</Text>
          {stats.examens.map((examen) => (
            <View key={examen.id} style={styles.examenCard}>
              <View style={styles.examenLeft}>
                <Text style={styles.examenIcon}>
                  {examen.matieres?.icone || '📚'}
                </Text>
              </View>
              <View style={styles.examenCenter}>
                <Text style={styles.examenMatiere}>{examen.matieres?.nom || 'Matière'}</Text>
                <Text style={styles.examenMode}>
                  {examen.mode === 'examen' ? '⏱️ Examen' : '🎯 Entraînement'} · {examen.classe}
                </Text>
              </View>
              <View style={styles.examenRight}>
                <Text style={styles.examenScore}>{examen.score_total}/{examen.score_max}</Text>
                <Text style={styles.examenDate}>
                  {new Date(examen.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Accès rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Accès rapides</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#2563EB' }]} onPress={() => navigation.navigate('Cours')}>
            <Text style={styles.quickCardIcon}>📚</Text>
            <Text style={styles.quickCardTitle}>Cours</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#16A34A' }]} onPress={() => navigation.navigate('Exercices')}>
            <Text style={styles.quickCardIcon}>✍️</Text>
            <Text style={styles.quickCardTitle}>Exercices</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#F59E0B' }]} onPress={() => navigation.navigate('Badges')}>
            <Text style={styles.quickCardIcon}>🏆</Text>
            <Text style={styles.quickCardTitle}>Badges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#DC2626' }]} onPress={() => navigation.navigate('Arene')}>
            <Text style={styles.quickCardIcon}>⚔️</Text>
            <Text style={styles.quickCardTitle}>Arène</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#8B5CF6' }]} onPress={() => navigation.navigate('AssistantIA')}>
            <Text style={styles.quickCardIcon}>🤖</Text>
            <Text style={styles.quickCardTitle}>Assistant IA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0891B2' }]} onPress={() => navigation.navigate('Profil')}>
            <Text style={styles.quickCardIcon}>👤</Text>
            <Text style={styles.quickCardTitle}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 16 },

  // HEADER PREMIUM
  headerPremium: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  classeBadge: { fontSize: 13, color: '#BFDBFE', fontWeight: '600', marginTop: 4 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  streakIcon: { fontSize: 18 },
  streakText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  streakRecord: { color: '#93C5FD', fontSize: 12 },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },

  // PROGRESS BAR
  progressContainer: { marginHorizontal: 20, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 3 },

  // MOTIVATION
  motivationCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  motivationText: { fontSize: 13, color: '#1E40AF', fontWeight: '500' },

  // SECTIONS
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },

  // MATIÈRES
  matieresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  matiereCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    width: '30%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  matiereIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  matiereIcon: { fontSize: 24 },
  matiereNom: { fontSize: 11, fontWeight: '600', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  miniProgressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 4 },
  miniProgressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 2 },
  matiereStats: { fontSize: 10, fontWeight: '600', color: '#64748B' },

  // EXAMENS
  examenCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  examenLeft: { marginRight: 12 },
  examenIcon: { fontSize: 28 },
  examenCenter: { flex: 1 },
  examenMatiere: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  examenMode: { fontSize: 11, color: '#64748B', marginTop: 2 },
  examenRight: { alignItems: 'flex-end' },
  examenScore: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  examenDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  // QUICK ACTIONS
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  quickCardIcon: { fontSize: 30, marginBottom: 8 },
  quickCardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});