import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Picker } from '@react-native-picker/picker';
import AppLogo from '../components/AppLogo';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [classe, setClasse] = useState('3ème');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Email et mot de passe requis');
      return;
    }
    if (isSignUp && !nomComplet) {
      Alert.alert('Erreur', 'Nom complet requis');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nom_complet: nomComplet, classe: classe },
        },
      });

      if (signUpError) {
        Alert.alert('Erreur', signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ classe: classe })
          .eq('id', data.user.id);
        if (updateError) {
          console.log('Erreur mise à jour profil:', updateError.message);
        }
      }

      navigation.navigate('VerifyEmail', { email: email });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert('Erreur', error.message);
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo centré */}
        <View style={styles.logoContainer}>
          <AppLogo size={90} showText={false} />
        </View>

        {/* Titre */}
        <Text style={styles.title}>EdukMaster</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Créez votre compte' : 'Connectez-vous'}
        </Text>

        {/* Champs */}
        {isSignUp && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#94A3B8"
              value={nomComplet}
              onChangeText={setNomComplet}
            />

            <Text style={styles.label}>Votre classe</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={classe}
                onValueChange={(itemValue) => setClasse(itemValue)}
                style={styles.picker}
                dropdownIconColor="#64748B"
              >
                <Picker.Item label="3ème" value="3ème" />
                <Picker.Item label="2nde" value="2nde" />
                <Picker.Item label="1ère" value="1ère" />
                <Picker.Item label="Terminale" value="Terminale" />
              </Picker>
            </View>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
          </Text>
        </TouchableOpacity>

        {/* Switch */}
        <TouchableOpacity 
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchContainer}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? 'Déjà un compte ? Se connecter'
              : "Pas de compte ? S'inscrire"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4FF' 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 30, 
    fontWeight: '800', 
    color: '#1E3A5F', 
    textAlign: 'center', 
    marginBottom: 6,
    letterSpacing: 1,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748B', 
    textAlign: 'center', 
    marginBottom: 28,
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: 6, 
    marginLeft: 4,
    marginTop: 4,
  },
  pickerContainer: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 14, 
    marginBottom: 14, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: { 
    height: 52,
    color: '#1E293B',
  },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 14, 
    padding: 15, 
    fontSize: 15, 
    marginBottom: 14,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  button: { 
    backgroundColor: '#2563EB', 
    padding: 17, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { 
    opacity: 0.6,
    shadowOpacity: 0,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '700' 
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  switchText: { 
    color: '#2563EB', 
    fontSize: 14, 
    fontWeight: '500',
  },
});