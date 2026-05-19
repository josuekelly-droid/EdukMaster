import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import QuizExercice from '../components/QuizExercice';

export default function ExamenBlancScreen({ route, navigation }) {
  const { matiere, mode, difficulte, classe } = route.params;
  const [exercices, setExercices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ obtenu: 0, total: 0 });
  const [tempsRestant, setTempsRestant] = useState(mode === 'examen' ? 1800 : 0);
  const [termine, setTermine] = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const [reponses, setReponses] = useState([]);
  const [repondu, setRepondu] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExercices();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (mode === 'examen' && tempsRestant > 0 && !termine) {
      timerRef.current = setInterval(() => {
        setTempsRestant((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            terminerExamen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [mode, tempsRestant, termine]);

  async function fetchExercices() {
    let query = supabase
      .from('exercices')
      .select('*, cours!inner(*)')
      .eq('cours.matiere_id', matiere.id)
      .eq('cours.classe', classe)
      .order('ordre');

    const { data } = await query;

    if (data) {
      let selection = data;
      if (difficulte === 'difficile') {
        selection = data.filter((_, i) => i % 2 === 0 || data.length - i < 5);
      } else if (difficulte === 'expert') {
        selection = data.filter((_, i) => i % 3 === 0 || data.length - i < 3);
      }

      if (mode === 'examen') {
        selection = selection.slice(0, 20);
      }

      setExercices(selection);
      setScore({ obtenu: 0, total: selection.reduce((s, e) => s + e.points, 0) });
      setReponses(new Array(selection.length).fill(null));
      setRepondu(new Array(selection.length).fill(false));
    }
  }

  function handleReponse(index, correct, points) {
    const newReponses = [...reponses];
    newReponses[index] = { correct, points };
    setReponses(newReponses);

    const newRepondu = [...repondu];
    newRepondu[index] = true;
    setRepondu(newRepondu);

    if (correct) {
      setScore((prev) => ({ ...prev, obtenu: prev.obtenu + points }));
    }
  }

  function terminerExamen() {
    clearInterval(timerRef.current);
    setTermine(true);
    setShowRapport(true);
    enregistrerExamen();
  }

  async function enregistrerExamen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('examens_blancs').insert({
      user_id: user.id,
      matiere_id: matiere.id,
      classe: classe,
      mode: mode,
      difficulte: difficulte,
      score_total: score.obtenu,
      score_max: score.total,
      temps_realise: mode === 'examen' ? 1800 - tempsRestant : null,
    });
  }

  function formatTemps(secondes) {
    const min = Math.floor(secondes / 60);
    const sec = secondes % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  function getPourcentage() {
    if (score.total === 0) return 0;
    return Math.round((score.obtenu / score.total) * 100);
  }

  function getMention() {
    const p = getPourcentage();
    if (p >= 90) return '🌟 Excellent !';
    if (p >= 75) return '👏 Très bien !';
    if (p >= 60) return '👍 Bien';
    if (p >= 45) return '📖 Peut mieux faire';
    return '💪 Continue à travailler';
  }

  function goToQuestion(index) {
    if (index >= 0 && index < exercices.length) {
      setCurrentIndex(index);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Barre supérieure */}
        {!termine && (
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.quitButton}
              onPress={() => {
                Alert.alert(
                  'Quitter',
                  mode === 'examen'
                    ? 'Voulez-vous vraiment abandonner cet examen ?'
                    : 'Voulez-vous arrêter cet entraînement ?',
                  [
                    { text: 'Continuer', style: 'cancel' },
                    {
                      text: 'Abandonner',
                      style: 'destructive',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.quitText}>✕ Quitter</Text>
            </TouchableOpacity>

            {mode === 'examen' && (
              <View style={[styles.timer, tempsRestant < 300 && styles.timerUrgent]}>
                <Text style={[styles.timerText, tempsRestant < 300 && styles.timerTextUrgent]}>
                  ⏱️ {formatTemps(tempsRestant)}
                </Text>
              </View>
            )}

            <View style={styles.progress}>
              <Text style={styles.progressText}>
                {currentIndex + 1} / {exercices.length}
              </Text>
            </View>
          </View>
        )}

        {/* Grille des questions pour navigation rapide (mode examen) */}
        {mode === 'examen' && !termine && (
          <View style={styles.questionGrid}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {exercices.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.questionDot,
                    currentIndex === index && styles.questionDotActive,
                    repondu[index] && styles.questionDotAnswered,
                    currentIndex === index && repondu[index] && styles.questionDotActiveAnswered,
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <Text style={[
                    styles.questionDotText,
                    currentIndex === index && styles.questionDotTextActive,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Questions */}
        {!termine && exercices.length > 0 && (
          <View style={styles.questionWrapper}>
            <ScrollView
              style={styles.questionScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.questionContent}
            >
              <QuizExercice
                key={exercices[currentIndex].id}
                exercice={exercices[currentIndex]}
                onComplete={(correct, points) => handleReponse(currentIndex, correct, points)}
                showResult={true}
              />
            </ScrollView>

            {/* Boutons de navigation */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                onPress={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navBtnText}>← Précédent</Text>
              </TouchableOpacity>

              {currentIndex < exercices.length - 1 ? (
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => goToQuestion(currentIndex + 1)}
                >
                  <Text style={styles.navBtnText}>Suivant →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.terminerBtn}
                  onPress={() => {
                    if (mode === 'examen') {
                      const nonRepondues = repondu.filter(r => !r).length;
                      if (nonRepondues > 0) {
                        Alert.alert(
                          'Questions non répondues',
                          `Il vous reste ${nonRepondues} question(s) sans réponse. Voulez-vous vraiment terminer ?`,
                          [
                            { text: 'Continuer l\'examen', style: 'cancel' },
                            { text: 'Terminer', style: 'destructive', onPress: terminerExamen },
                          ]
                        );
                      } else {
                        Alert.alert(
                          'Terminer',
                          'Voulez-vous vraiment terminer cet examen ?',
                          [
                            { text: 'Continuer', style: 'cancel' },
                            { text: 'Terminer', style: 'destructive', onPress: terminerExamen },
                          ]
                        );
                      }
                    } else {
                      terminerExamen();
                    }
                  }}
                >
                  <Text style={styles.terminerBtnText}>
                    📝 {mode === 'examen' ? 'Terminer l\'examen' : 'Voir le résultat'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Modal Rapport */}
        <Modal visible={showRapport} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.rapportContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.rapportTitle}>
                  {mode === 'examen' ? "📋 Rapport d'examen" : "📊 Résultat d'entraînement"}
                </Text>

                <View style={styles.scoreCircle}>
                  <Text style={styles.scorePourcentage}>{getPourcentage()}%</Text>
                  <Text style={styles.scoreTexte}>
                    {score.obtenu} / {score.total} pts
                  </Text>
                </View>

                <Text style={styles.mention}>{getMention()}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{exercices.length}</Text>
                    <Text style={styles.statLabel}>Questions</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {reponses.filter((r) => r?.correct).length}
                    </Text>
                    <Text style={styles.statLabel}>Correctes</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {mode === 'examen' ? formatTemps(1800 - tempsRestant) : '∞'}
                    </Text>
                    <Text style={styles.statLabel}>Temps</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Détail par question</Text>
                  {reponses.map((rep, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailNum}>{i + 1}.</Text>
                      <Text
                        style={[
                          styles.detailStatus,
                          rep === null
                            ? styles.detailNonRepondu
                            : rep.correct
                            ? styles.detailCorrect
                            : styles.detailIncorrect,
                        ]}
                      >
                        {rep === null
                          ? '⏭️ Non répondue'
                          : rep.correct
                          ? '✅ Correct'
                          : '❌ Incorrect'}
                      </Text>
                      <Text style={styles.detailPoints}>
                        {rep?.correct ? `+${rep.points}` : '0'} pt
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.retourBtn}
                  onPress={() => {
                    setShowRapport(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.retourBtnText}>Retour au menu</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quitButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  quitText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
  timer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerUrgent: {
    backgroundColor: '#FEE2E2',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  timerTextUrgent: {
    color: '#DC2626',
  },
  progress: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  questionGrid: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  questionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  questionDotActive: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  questionDotAnswered: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  questionDotActiveAnswered: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  questionDotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  questionDotTextActive: {
    color: '#FFFFFF',
  },
  questionWrapper: {
    flex: 1,
  },
  questionScroll: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
    paddingBottom: 10,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  terminerBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  terminerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rapportContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    padding: 24,
  },
  rapportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EFF6FF',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#2563EB',
  },
  scorePourcentage: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  scoreTexte: {
    fontSize: 12,
    color: '#64748B',
  },
  mention: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  detailNum: {
    width: 25,
    fontSize: 13,
    color: '#94A3B8',
  },
  detailStatus: {
    flex: 1,
    fontSize: 13,
  },
  detailCorrect: {
    color: '#16A34A',
  },
  detailIncorrect: {
    color: '#DC2626',
  },
  detailNonRepondu: {
    color: '#D97706',
  },
  detailPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  retourBtn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  retourBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});