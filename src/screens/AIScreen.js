import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '../services/supabase';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function AIScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA. Posez-moi n\'importe quelle question sur vos cours. 📚✨',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingHistory(false); return; }

    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      const history = data.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      setMessages((prev) => [...history, ...prev]);
    }
    setLoadingHistory(false);
  }

  function formatContent(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '▎$1')
      .replace(/\*(.*?)\*/g, '• $1')
      .replace(/^### (.*)/gm, '\n📌 $1\n')
      .replace(/^## (.*)/gm, '\n📌 $1\n')
      .replace(/^# (.*)/gm, '\n📋 $1\n')
      .replace(/\n- /g, '\n  • ')
      .replace(/\n\d+\. /g, '\n  ')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function saveMessage(role, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      role: role,
      content: content,
    });
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    saveMessage('user', userMessage);
    setLoading(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);

    try {
      const { data: configData } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'GEMINI_API_KEY')
        .single();

      const apiKey = configData?.value;

      if (!apiKey) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Clé API non configurée.' }]);
        setLoading(false);
        return;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant éducatif pour des élèves de la 3ème à la Terminale. Réponds en français, de manière claire et pédagogique. Utilise des paragraphes courts, des tirets pour les listes, et évite les astérisques ou le markdown.',
            },
            ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      const aiResponse = data?.choices?.[0]?.message?.content || 'Pas de réponse.';
      const formattedResponse = formatContent(aiResponse);

      setMessages((prev) => [...prev, { role: 'assistant', content: formattedResponse }]);
      saveMessage('assistant', formattedResponse);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur réseau : ${error.message}` }]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 Assistant IA</Text>
        <TouchableOpacity onPress={loadHistory} style={styles.backBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Input en haut */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Posez votre question..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingHistoryText}>Chargement de l'historique...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, index) => (
              <View key={index} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.bubbleRole}>{msg.role === 'user' ? '👤 Vous' : '🤖 Assistant'}</Text>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Réflexion...</Text>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E40AF' },
  header: {
    paddingTop: STATUSBAR_HEIGHT + 8, paddingBottom: 12, paddingHorizontal: 12,
    backgroundColor: '#1E40AF', flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  refreshText: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 19, fontWeight: 'bold' },
  
  // Input en haut
  inputRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6, fontSize: 14, maxHeight: 80,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937',
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  
  // Messages
  body: { flex: 1, backgroundColor: '#F1F5F9' },
  chatScroll: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 8 },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { backgroundColor: '#2563EB', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleRole: { fontSize: 10, fontWeight: '700', marginBottom: 3, color: '#9CA3AF' },
  bubbleText: { fontSize: 15, lineHeight: 22, color: '#1F2937' },
  userText: { color: '#FFFFFF' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  loadingText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingHistoryText: { marginTop: 10, color: '#6B7280', fontSize: 14 },
});