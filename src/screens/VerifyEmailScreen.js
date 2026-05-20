import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function VerifyEmailScreen({ route, navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route?.params?.email || '';

  async function verifyWithCode() {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le code reçu par email.');
      return;
    }

    setLoading(true);
    
    // Vérifier le code OTP
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: code.trim(),
      type: 'signup',
    });

    if (error) {
      Alert.alert('Erreur', 'Code invalide ou expiré. Vérifiez votre email et réessayez.');
    } else {
      
      Alert.alert('✅ Succès', 'Votre compte est vérifié !', [
        
        { text: 'OK', onPress: () => navigation.navigate('Auth') }
      ]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>Vérifiez votre email</Text>
      <Text style={styles.subtitle}>
        Un code de vérification a été envoyé à{'\n'}{email || 'votre adresse email'}.
      </Text>

      <Text style={styles.label}>Code de vérification</Text>
      <TextInput
        style={styles.input}
        placeholder="12345678"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={8}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={verifyWithCode} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>✅ Vérifier mon compte</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 30 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, alignSelf: 'flex-start' },
  input: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#2563EB', borderRadius: 12, padding: 16, fontSize: 24, fontWeight: 'bold', letterSpacing: 6, color: '#1E293B', marginBottom: 20 },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});