import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function ChapitresScreen({ route, navigation }) {
  const { matiere } = route.params;
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCours();
  }, []);

  async function fetchCours() {
    // Récupérer le profil pour connaître la classe
    const { data: { user } } = await supabase.auth.getUser();
    let classe = '3ème'; // par défaut

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('classe')
        .eq('id', user.id)
        .single();
      if (profile?.classe) {
        classe = profile.classe;
      }
    }

    const { data, error } = await supabase
      .from('cours')
      .select('*')
      .eq('matiere_id', matiere.id)
      .eq('classe', classe)
      .order('ordre');

    if (!error && data) {
      setCours(data);
    }
    setLoading(false);
  }

  function handleSelectCours(coursItem) {
    navigation.navigate('Lecon', { cours: coursItem, matiere });
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
      <Text style={styles.headerTitle}>
        {matiere.icone} {matiere.nom}
      </Text>
      <Text style={styles.subtitle}>Chapitres disponibles</Text>

      <FlatList
        data={cours}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.chapterCard}
            onPress={() => handleSelectCours(item)}
          >
            <View style={styles.chapterNumber}>
              <Text style={styles.chapterNumberText}>{item.ordre || index + 1}</Text>
            </View>
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterTitle}>{item.titre}</Text>
              <Text style={styles.chapterClass}>Classe de {item.classe}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chapterNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  chapterClass: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
});