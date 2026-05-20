import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '../services/supabase';

export default function BadgesScreen() {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: allBadges } = await supabase.from('badges').select('*').order('condition_valeur');
    const { data: mine } = await supabase.from('user_badges').select('badge_id').eq('user_id', user?.id);

    setBadges(allBadges || []);
    setUserBadges(mine?.map(b => b.badge_id) || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Calculer le nombre de badges débloqués
  const unlockedCount = userBadges.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Mes badges</Text>
          <Text style={styles.subtitle}>{unlockedCount} / {badges.length} débloqués</Text>
          {/* Barre de progression */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(unlockedCount / badges.length) * 100}%` }]} />
          </View>
        </View>

        
        <View style={styles.grid}>
          {badges.map((badge) => {
            const unlocked = userBadges.includes(badge.id);
            return (
              <View key={badge.id} style={[styles.card, !unlocked && styles.cardLocked]}>
                <View style={[styles.iconContainer, unlocked && styles.iconContainerUnlocked]}>
                  <Text style={styles.icon}>{unlocked ? badge.icone : '🔒'}</Text>
                </View>
                <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
                  {badge.nom}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>{badge.description}</Text>
                {unlocked && <Text style={styles.unlockedBadge}>✅ Débloqué</Text>}
              </View>
            );
          })}
        </View>

        
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { paddingTop: 8, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, minHeight: 150,
  },
  cardLocked: { opacity: 0.5, backgroundColor: '#F1F5F9' },
  iconContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  iconContainerUnlocked: { backgroundColor: '#FEF3C7' },
  icon: { fontSize: 28 },
  name: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  nameLocked: { color: '#94A3B8' },
  desc: { fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 14, marginBottom: 6 },
  unlockedBadge: { fontSize: 10, color: '#16A34A', fontWeight: '600', marginTop: 2 },
  bottomSpace: { height: 30 },
});