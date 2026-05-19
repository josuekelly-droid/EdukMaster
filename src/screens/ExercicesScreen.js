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

export default function ExercicesScreen({ navigation }) {
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [mode, setMode] = useState(null);
  const [difficulte, setDifficulte] = useState('normal');
  const [classe, setClasse] = useState('3ème');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatieres();
    fetchClasse();
  }, []);

  async function fetchClasse() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('classe')
        .eq('id', user.id)
        .single();
      if (profile?.classe) setClasse(profile.classe);
    }
  }

  async function fetchMatieres() {
    const { data } = await supabase.from('matieres').select('*').order('nom');
    if (data) setMatieres(data);
    setLoading(false);
  }

  function demarrerExamen() {
    if (!selectedMatiere) return;
    navigation.navigate('ExamenBlanc', {
      matiere: selectedMatiere,
      mode: mode,
      difficulte: difficulte,
      classe: classe,
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>✍️ Choisissez votre mode</Text>

        {/* Sélection du mode */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeCard, mode === 'entrainement' && styles.modeCardActive]}
            onPress={() => setMode('entrainement')}
          >
            <Text style={styles.modeIcon}>🎯</Text>
            <Text style={styles.modeTitle}>Entraînement</Text>
            <Text style={styles.modeDesc}>Exercices illimités, correction immédiate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, mode === 'examen' && styles.modeCardActiveExamen]}
            onPress={() => setMode('examen')}
          >
            <Text style={styles.modeIcon}>⏱️</Text>
            <Text style={styles.modeTitle}>Examen Blanc</Text>
            <Text style={styles.modeDesc}>Chronométré, conditions réelles</Text>
          </TouchableOpacity>
        </View>

        {/* Configuration du mode */}
        {mode && (
          <View style={styles.configContainer}>
            {/* Difficulté */}
            {mode === 'entrainement' && (
              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Niveau de difficulté</Text>
                <View style={styles.difficulteRow}>
                  {['normal', 'difficile', 'expert'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.difficulteBtn,
                        difficulte === d && styles.difficulteBtnActive,
                      ]}
                      onPress={() => setDifficulte(d)}
                    >
                      <Text style={[
                        styles.difficulteText,
                        difficulte === d && styles.difficulteTextActive,
                      ]}>
                        {d === 'normal' ? '📗 Normal' : d === 'difficile' ? '📙 Difficile' : '📕 Expert'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Conditions examen */}
            {mode === 'examen' && (
              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Conditions d'examen</Text>
                <View style={styles.examenInfo}>
                  <Text style={styles.infoText}>⏱️ Temps limité selon l'épreuve</Text>
                  <Text style={styles.infoText}>🚫 Pas de correction avant la fin</Text>
                  <Text style={styles.infoText}>📵 Mode plein écran conseillé</Text>
                  <Text style={styles.infoText}>📊 Rapport détaillé à la fin</Text>
                </View>
              </View>
            )}

            {/* Choix matière */}
            <View style={styles.configSection}>
              <Text style={styles.configTitle}>Choisissez une matière</Text>
              <View style={styles.matiereGrid}>
                {matieres.map((mat) => (
                  <TouchableOpacity
                    key={mat.id}
                    style={[
                      styles.matiereBtn,
                      selectedMatiere?.id === mat.id && styles.matiereBtnActive,
                    ]}
                    onPress={() => setSelectedMatiere(mat)}
                  >
                    <Text style={styles.matiereIcon}>{mat.icone}</Text>
                    <Text style={[
                      styles.matiereNom,
                      selectedMatiere?.id === mat.id && styles.matiereNomActive,
                    ]}>{mat.nom}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Espace pour le bouton fixe */}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      {/* Bouton Démarrer fixé en bas */}
      {mode && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.demarrerBtn,
              mode === 'examen' ? styles.demarrerExamen : styles.demarrerEntrainement,
              !selectedMatiere && styles.demarrerBtnDisabled,
            ]}
            onPress={demarrerExamen}
            disabled={!selectedMatiere}
          >
            <Text style={styles.demarrerText}>
              {mode === 'examen' ? "🚀 Démarrer l'examen blanc" : "🎯 Commencer l'entraînement"}
            </Text>
            {selectedMatiere && (
              <Text style={styles.demarrerSubtext}>
                {selectedMatiere.icone} {selectedMatiere.nom} - {classe}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 24,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  modeCardActiveExamen: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  modeIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  configContainer: {
    flex: 1,
  },
  configSection: {
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  difficulteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficulteBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  difficulteBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  difficulteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  difficulteTextActive: {
    color: '#16A34A',
  },
  examenInfo: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  infoText: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 6,
  },
  matiereGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matiereBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    minWidth: '30%',
  },
  matiereBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  matiereIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  matiereNom: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  matiereNomActive: {
    color: '#2563EB',
  },
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20,
  },
  demarrerBtn: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  demarrerBtnDisabled: {
    opacity: 0.4,
  },
  demarrerEntrainement: {
    backgroundColor: '#16A34A',
  },
  demarrerExamen: {
    backgroundColor: '#DC2626',
  },
  demarrerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demarrerSubtext: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
});