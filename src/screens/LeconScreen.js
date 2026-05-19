import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import QuizExercice from '../components/QuizExercice';

export default function LeconScreen({ route, navigation }) {
  const { cours, matiere } = route.params;
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExercices, setShowExercices] = useState(false);
  const [score, setScore] = useState({ obtenu: 0, total: 0 });
  const [tousFinis, setTousFinis] = useState(false);

  useEffect(() => {
    fetchExercices();
  }, []);

  async function fetchExercices() {
    const { data, error } = await supabase
      .from('exercices')
      .select('*')
      .eq('cours_id', cours.id)
      .order('ordre');

    if (!error && data) {
      setExercices(data);
      setScore({ obtenu: 0, total: data.reduce((sum, ex) => sum + ex.points, 0) });
    }
    setLoading(false);
  }

  function handleComplete(correct, points) {
    if (correct) {
      setScore(prev => ({
        ...prev,
        obtenu: prev.obtenu + points,
      }));
    }
  }

  function formatContenu(contenu) {
    // Sépare les sections par ##
    return contenu.split('##').filter(Boolean).map((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();
      return { title, body, index };
    });
  }

  const sections = formatContenu(cours.contenu);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.matiereBadge}>
          {matiere.icone} {matiere.nom}
        </Text>
        <Text style={styles.classeBadge}>{cours.classe}</Text>
      </View>

      <Text style={styles.titre}>{cours.titre}</Text>
      <Text style={styles.numeroChapitre}>Chapitre {cours.ordre}</Text>

      {/* Contenu du cours - formaté */}
      <View style={styles.coursCard}>
        {sections.map((section) => (
          <View key={section.index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>

      {/* Bouton Exercices */}
      <TouchableOpacity
        style={[styles.exerciceToggle, showExercices && styles.exerciceToggleActive]}
        onPress={() => setShowExercices(!showExercices)}
      >
        <Text style={[styles.exerciceToggleText, showExercices && styles.exerciceToggleTextActive]}>
          {showExercices ? '📖 Cacher les exercices' : `✍️ Faire les exercices (${exercices.length})`}
        </Text>
      </TouchableOpacity>

      {/* Barre de progression */}
      {showExercices && score.total > 0 && (
        <View style={styles.progression}>
          <View style={styles.progressionBar}>
            <View style={[styles.progressionFill, { width: `${(score.obtenu / score.total) * 100}%` }]} />
          </View>
          <Text style={styles.progressionText}>
            Score : {score.obtenu} / {score.total} pts
          </Text>
        </View>
      )}

      {/* Exercices interactifs */}
      {showExercices && (
        <View style={styles.exercicesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
          ) : (
            <>
              {exercices.map((exo, index) => (
                <View key={exo.id}>
                  <Text style={styles.exoNumero}>Question {index + 1}</Text>
                  <QuizExercice exercice={exo} onComplete={handleComplete} />
                </View>
              ))}
            </>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  matiereBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  classeBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  titre: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 2,
  },
  numeroChapitre: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  coursCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginLeft: 18,
  },
  exerciceToggle: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  exerciceToggleActive: {
    backgroundColor: '#F0FDF4',
  },
  exerciceToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  exerciceToggleTextActive: {
    color: '#15803D',
  },
  progression: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  progressionBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressionFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  progressionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  exercicesContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  exoNumero: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 20,
    marginBottom: 8,
  },
});