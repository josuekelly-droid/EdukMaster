import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurer le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demander la permission et enregistrer le token
export async function registerForPushNotifications() {
  // Vérifier si on est sur un appareil physique (pas Expo Go)
  if (!Device.isDevice) {
    console.log('Notifications push : appareil physique requis');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission de notification refusée');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Token de notification obtenu');

    // Sauvegarder le token dans Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      await supabase.from('push_tokens').upsert({
        user_id: user.id,
        token: token,
        updated_at: new Date(),
      });
    }

    return token;
  } catch (error) {
    console.log('Erreur notifications push (normal dans Expo Go):', error.message);
    return null;
  }
}

// Envoyer une notification à un utilisateur spécifique
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) return;

    for (const row of tokens) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: row.token,
          sound: 'default',
          title: title,
          body: body,
          data: data,
        }),
      });
    }
  } catch (error) {
    console.log('Erreur envoi notification:', error.message);
  }
}

// Envoyer une notification de défi
export async function notifyDefiRecu(adversaireId, createurNom, codeInvitation) {
  await sendPushNotification(
    adversaireId,
    '⚔️ Nouveau défi !',
    `${createurNom} t'a défié ! Code : ${codeInvitation}`,
    { screen: 'Arene', code: codeInvitation }
  );
}

// Envoyer une notification de résultat de défi
export async function notifyDefiTermine(userId, resultat) {
  const titre = resultat === 'victoire' ? '🏆 Victoire !' : resultat === 'defaite' ? '😔 Défaite' : '🤝 Match nul';
  const message = resultat === 'victoire' ? 'Tu as gagné le défi ! +50 pts' : resultat === 'defaite' ? 'Tu as perdu le défi. +5 pts' : 'Match nul ! +15 pts';
  await sendPushNotification(userId, titre, message);
}

// Envoyer une notification de badge
export async function notifyBadgeGagne(userId, badgeNom, badgeIcone) {
  await sendPushNotification(
    userId,
    '🏆 Nouveau badge !',
    `Tu as débloqué : ${badgeIcone} ${badgeNom}`
  );
}

// Envoyer un rappel quotidien
export async function sendDailyReminder(userId) {
  await sendPushNotification(
    userId,
    '📚 EdukMaster',
    'N\'oublie pas de faire tes exercices aujourd\'hui ! Continue ta série 🔥'
  );
}