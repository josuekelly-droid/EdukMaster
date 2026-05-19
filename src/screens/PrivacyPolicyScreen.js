import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Politique de confidentialité</Text>
      <Text style={styles.date}>Dernière mise à jour : 18 mai 2026</Text>

      <Section title="1. Introduction">
        EdukMaster s'engage à protéger la vie privée de ses utilisateurs. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles.
      </Section>

      <Section title="2. Données collectées">
        {'• Adresse email (pour l\'authentification)\n• Nom complet et classe (pour personnaliser l\'expérience)\n• Résultats d\'exercices et d\'examens (pour suivre la progression)\n• Conversations avec l\'assistant IA (pour l\'historique)\n• Identifiant de l\'appareil (pour les notifications push)'}
      </Section>

      <Section title="3. Utilisation des données">
        {'• Fournir et améliorer nos services éducatifs\n• Personnaliser le contenu selon le niveau scolaire\n• Générer des statistiques de progression\n• Envoyer des notifications liées aux défis et aux badges\n• Aucune donnée n\'est vendue à des tiers'}
      </Section>

      <Section title="4. Stockage des données">
        Vos données sont stockées de manière sécurisée sur les serveurs de Supabase, conformément aux normes de sécurité les plus strictes.
      </Section>

      <Section title="5. Droits des utilisateurs">
        {'• Droit d\'accès : vous pouvez consulter vos données dans l\'onglet Profil\n• Droit de rectification : vous pouvez modifier votre classe\n• Droit de suppression : contactez-nous pour supprimer votre compte'}
      </Section>

      <Section title="6. Cookies et tracking">
        EdukMaster n'utilise pas de cookies ni de technologies de tracking publicitaire.
      </Section>

      <Section title="7. Contact">
        Pour toute question concernant cette politique :\n📧 kelly.webnux@gmail.com
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  date: { fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E40AF', marginBottom: 8 },
  sectionText: { fontSize: 15, lineHeight: 24, color: '#475569' },
});