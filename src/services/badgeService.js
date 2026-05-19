import { supabase } from './supabase';

// Vérifier et attribuer les badges
export async function checkAndAwardBadges() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Récupérer les stats de l'utilisateur
  const { data: resultats } = await supabase.from('resultats').select('*').eq('user_id', user.id);
  const { data: examens } = await supabase.from('examens_blancs').select('*').eq('user_id', user.id);
  const { data: badgesGagnes } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
  const { data: tousBadges } = await supabase.from('badges').select('*');
  const { data: streak } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();
  const { data: iaMessages } = await supabase.from('ai_conversations').select('id').eq('user_id', user.id).eq('role', 'user');
  const { data: matieres } = await supabase.from('matieres').select('*');

  const badgesDejaGagnes = badgesGagnes?.map(b => b.badge_id) || [];
  const totalExercices = resultats?.length || 0;
  const totalCorrect = resultats?.filter(r => r.correct).length || 0;
  const totalExamens = examens?.length || 0;
  const meilleurScore = examens?.length > 0 ? Math.max(...examens.map(e => Math.round((e.score_total / e.score_max) * 100))) : 0;
  const joursStreak = streak?.jours_consecutifs || 0;
  const questionsIA = iaMessages?.length || 0;

  // Calculer le nombre de matières avec au moins un exercice réussi
  let matieresActives = 0;
  if (matieres) {
    for (const mat of matieres) {
      const { data: exosMatiere } = await supabase
        .from('exercices')
        .select('id, cours!inner(matiere_id)')
        .eq('cours.matiere_id', mat.id);
      const exosIds = exosMatiere?.map(e => e.id) || [];
      const reussi = resultats?.filter(r => exosIds.includes(r.exercice_id) && r.correct).length || 0;
      if (reussi > 0) matieresActives++;
    }
  }

  const stats = {
    total_exercices: totalExercices,
    streak_jours: joursStreak,
    total_examens: totalExamens,
    score_examen: meilleurScore,
    questions_ia: questionsIA,
    matiere_maths: 0,
    matiere_francais: 0,
    toutes_matieres: matieresActives,
  };

  // Calculer les pourcentages par matière
  if (matieres) {
    for (const mat of matieres) {
      const { data: exosMatiere } = await supabase
        .from('exercices')
        .select('id, cours!inner(matiere_id)')
        .eq('cours.matiere_id', mat.id);
      const exosIds = exosMatiere?.map(e => e.id) || [];
      const totalMatiere = exosMatiere?.length || 0;
      const reussiMatiere = resultats?.filter(r => exosIds.includes(r.exercice_id) && r.correct).length || 0;
      const pourcentage = totalMatiere > 0 ? Math.round((reussiMatiere / totalMatiere) * 100) : 0;
      if (mat.nom === 'Mathématiques') stats.matiere_maths = pourcentage;
      if (mat.nom === 'Français') stats.matiere_francais = pourcentage;
    }
  }

  // Vérifier chaque badge
  const nouveauxBadges = [];
  for (const badge of tousBadges || []) {
    if (badgesDejaGagnes.includes(badge.id)) continue;

    const valeur = stats[badge.condition_type] || 0;
    if (valeur >= badge.condition_valeur) {
      nouveauxBadges.push(badge);
      await supabase.from('user_badges').insert({
        user_id: user.id,
        badge_id: badge.id,
      });
    }
  }

  return nouveauxBadges;
}

// Mettre à jour le streak
export async function updateStreak() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const aujourdHui = new Date().toISOString().split('T')[0];
  const { data: streak } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();

  if (!streak) {
    await supabase.from('streaks').insert({
      user_id: user.id,
      derniere_activite: aujourdHui,
      jours_consecutifs: 1,
      record: 1,
    });
    return;
  }

  const derniere = new Date(streak.derniere_activite);
  const aujourdHuiDate = new Date(aujourdHui);
  const diff = Math.floor((aujourdHuiDate - derniere) / (1000 * 60 * 60 * 24));

  if (diff === 0) return; // Déjà fait aujourd'hui

  if (diff === 1) {
    const nouveauxJours = streak.jours_consecutifs + 1;
    await supabase.from('streaks').update({
      derniere_activite: aujourdHui,
      jours_consecutifs: nouveauxJours,
      record: Math.max(nouveauxJours, streak.record || 0),
    }).eq('user_id', user.id);
  } else {
    await supabase.from('streaks').update({
      derniere_activite: aujourdHui,
      jours_consecutifs: 1,
    }).eq('user_id', user.id);
  }
}