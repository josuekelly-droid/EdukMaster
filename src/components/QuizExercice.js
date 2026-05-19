import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { updateStreak, checkAndAwardBadges } from '../services/badgeService';

export default function QuizExercice({ exercice, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [reponseLibre, setReponseLibre] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  function checkQCM(choix) {
    if (submitted) return;
    const correct = choix === exercice.reponse_correcte;
    setSelected(choix);
    setIsCorrect(correct);
    setSubmitted(true);
    enregistrerResultat(correct);
  }

  function checkVraiFaux(reponse) {
    if (submitted) return;
    const correct = reponse === exercice.reponse_correcte;
    setIsCorrect(correct);
    setSubmitted(true);
    enregistrerResultat(correct);
  }

  function checkReponseLibre() {
    if (submitted || !reponseLibre.trim()) return;
    const reponseNettoyee = reponseLibre.trim().toLowerCase();
    const bonneReponse = exercice.reponse_correcte.toLowerCase();
    // Vérification souple
    const correct = reponseNettoyee.includes(bonneReponse) || bonneReponse.includes(reponseNettoyee);
    setIsCorrect(correct);
    setSubmitted(true);
    enregistrerResultat(correct);
  }

  async function enregistrerResultat(correct) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    await updateStreak();
const nouveauxBadges = await checkAndAwardBadges();
if (onBadgeEarned && nouveauxBadges?.length > 0) {
  onBadgeEarned(nouveauxBadges);
}

    const { error } = await supabase.from('resultats').insert({
      user_id: user.id,
      exercice_id: exercice.id,
      reponse_donnee: selected || reponseLibre || (exercice.type === 'vrai_faux' ? (isCorrect ? exercice.reponse_correcte : '') : ''),
      correct: correct,
      points_obtenus: correct ? exercice.points : 0,
    });

    if (onComplete) {
      onComplete(correct, exercice.points);
    }
  }

  function getOptionStyle(choix) {
    if (!submitted) return styles.optionButton;
    if (choix === exercice.reponse_correcte) return styles.optionCorrect;
    if (choix === selected && !isCorrect) return styles.optionIncorrect;
    return styles.optionButton;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.typeBadge}>
          {exercice.type === 'qcm' ? 'QCM' : exercice.type === 'vrai_faux' ? 'Vrai/Faux' : 'Réponse libre'}
        </Text>
        <Text style={styles.points}>{exercice.points} pt{exercice.points > 1 ? 's' : ''}</Text>
      </View>

      <Text style={styles.question}>{exercice.question}</Text>

      {/* QCM */}
      {exercice.type === 'qcm' && exercice.options && (
        <View style={styles.optionsGrid}>
          {Object.entries(exercice.options).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={getOptionStyle(key)}
              onPress={() => checkQCM(key)}
              disabled={submitted}
            >
              <Text style={[
                styles.optionKey,
                submitted && key === exercice.reponse_correcte && styles.optionKeyCorrect,
                submitted && key === selected && !isCorrect && styles.optionKeyIncorrect,
              ]}>
                {key}
              </Text>
              <Text style={styles.optionText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Vrai/Faux */}
      {exercice.type === 'vrai_faux' && (
        <View style={styles.vfRow}>
          <TouchableOpacity
            style={[styles.vfButton, submitted && exercice.reponse_correcte === 'vrai' && styles.optionCorrect, submitted && selected === 'vrai' && !isCorrect && styles.optionIncorrect]}
            onPress={() => { setSelected('vrai'); checkVraiFaux('vrai'); }}
            disabled={submitted}
          >
            <Text style={styles.vfText}>✅ VRAI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.vfButton, submitted && exercice.reponse_correcte === 'faux' && styles.optionCorrect, submitted && selected === 'faux' && !isCorrect && styles.optionIncorrect]}
            onPress={() => { setSelected('faux'); checkVraiFaux('faux'); }}
            disabled={submitted}
          >
            <Text style={styles.vfText}>❌ FAUX</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Réponse libre */}
      {exercice.type === 'reponse_libre' && (
        <View>
          <TextInput
            style={styles.textInput}
            placeholder="Votre réponse..."
            value={reponseLibre}
            onChangeText={setReponseLibre}
            editable={!submitted}
            multiline
          />
          {!submitted && (
            <TouchableOpacity style={styles.submitButton} onPress={checkReponseLibre}>
              <Text style={styles.submitText}>Valider</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Résultat */}
      {submitted && (
        <View style={[styles.resultat, isCorrect ? styles.resultatCorrect : styles.resultatIncorrect]}>
          <Text style={styles.resultatEmoji}>{isCorrect ? '🎉' : '😔'}</Text>
          <View>
            <Text style={styles.resultatText}>
              {isCorrect ? 'Bonne réponse !' : 'Pas tout à fait...'}
            </Text>
            <Text style={styles.resultatCorrection}>
              Réponse : {exercice.reponse_correcte}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  points: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsGrid: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  optionKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 12,
    overflow: 'hidden',
  },
  optionKeyCorrect: {
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  optionKeyIncorrect: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  vfRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vfButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  vfText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  resultatCorrect: {
    backgroundColor: '#DCFCE7',
  },
  resultatIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  resultatEmoji: {
    fontSize: 28,
  },
  resultatText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  resultatCorrection: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});