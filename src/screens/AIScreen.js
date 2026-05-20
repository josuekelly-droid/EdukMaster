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
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const QUICK_ACTIONS = [
  { icon: '📝', label: 'Epreuve complete', action: 'epreuve' },
  { icon: '📖', label: 'Dissertation', action: 'dissertation' },
  { icon: '📄', label: 'Commentaire', action: 'commentaire' },
  { icon: '🌍', label: 'Histoire-Geo', action: 'histoire' },
  { icon: '🧠', label: 'Philosophie', action: 'philo' },
];

const MATIERES_EPREUVE = [
  { icon: '📐', label: 'Maths' },
  { icon: '📖', label: 'Francais' },
  { icon: '🌍', label: 'Histoire-Geo' },
  { icon: '🔬', label: 'SVT' },
  { icon: '🇬🇧', label: 'Anglais' },
];

export default function AIScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant IA premium. Posez-moi vos questions ou utilisez le menu + pour des actions rapides.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showMatieres, setShowMatieres] = useState(false);
  const [userClasse, setUserClasse] = useState('3eme');
  const scrollViewRef = useRef();

  useEffect(() => { loadHistory(); loadUserClasse(); }, []);

  async function loadUserClasse() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('classe').eq('id', user.id).single();
      if (profile?.classe) setUserClasse(profile.classe);
    }
  }

  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingHistory(false); return; }
    const { data } = await supabase.from('ai_conversations').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(50);
    if (data && data.length > 0) {
      setMessages((prev) => [...data.map(m => ({ role: m.role, content: m.content })), ...prev]);
    }
    setLoadingHistory(false);
  }

  // NOUVEAU FORMATAGE PROPRE
  function formatContent(text) {
    if (!text) return '';
    let cleaned = text
      // Supprimer les astérisques
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Supprimer les dièses
      .replace(/#{1,4}\s/g, '')
      // Supprimer les slashes
      .replace(/\\/g, '')
      .replace(/\//g, '')
      // Supprimer les backticks
      .replace(/`/g, '')
      // Remplacer les listes markdown
      .replace(/^[-*]\s/gm, '  • ')
      .replace(/^\d+\.\s/gm, '  • ')
      // Nettoyer les espaces multiples
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();

    // Ajouter des séparateurs visuels pour les sections
    cleaned = cleaned
      .replace(/SUJET\s*(\d)/gi, '\n━━━ SUJET $1 ━━━\n')
      .replace(/CORRIGE/gi, '\n━━━ CORRIGE ━━━\n')
      .replace(/EXERCICE\s*(\d)/gi, '\n▎EXERCICE $1\n')
      .replace(/PARTIE\s*(\d)/gi, '\n▎PARTIE $1\n');

    return cleaned;
  }

  async function saveMessage(role, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('ai_conversations').insert({ user_id: user.id, role, content });
  }

  async function sendMessage(messageText) {
    const userMessage = messageText || input.trim();
    if (!userMessage || loading) return;
    if (!messageText) setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    saveMessage('user', userMessage);
    setLoading(true);
    setShowMenu(false);
    setShowMatieres(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);

    try {
      const { data: configData } = await supabase.from('app_config').select('value').eq('key', 'GEMINI_API_KEY').single();
      const apiKey = configData?.value;
      if (!apiKey) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Cle API non configuree.' }]);
        setLoading(false);
        return;
      }

      const systemPrompt = `Tu es un assistant educatif pour des eleves de la 3eme a la Terminale en Afrique de l Ouest.

REGLES ABSOLUES DE FORMATAGE :
- N'utilise JAMAIS d'asterisques (* ou **)
- N'utilise JAMAIS de diese (#)
- N'utilise JAMAIS de slash (/ ou \)
- N'utilise JAMAIS de backticks ()
- N'utilise JAMAIS de markdown
- Utilise UNIQUEMENT des lettres, chiffres, tirets simples (-), et sauts de ligne
- Pour les titres, ecris en MAJUSCULES sur une ligne separee
- Pour les listes, utilise un simple tiret (-) en debut de ligne
- Separe les sections par des sauts de ligne

Exemple de format accepte :

SUJET 1

Titre du sujet

Question 1
- point a
- point b

Question 2
- element 1
- element 2

CORRIGE

Reponse 1
- explication
- explication

Reponds TOUJOURS dans ce format. JAMAIS de markdown.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          max_tokens: 800,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'system').slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      const aiResponse = data?.choices?.[0]?.message?.content || 'Pas de reponse.';
      const formattedResponse = formatContent(aiResponse);

      setMessages((prev) => [...prev, { role: 'assistant', content: formattedResponse }]);
      saveMessage('assistant', formattedResponse);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur reseau.' }]);
    }
    setLoading(false);
  }

  function handleQuickAction(item) {
    if (item.action === 'epreuve') { setShowMatieres(true); return; }
    const prompts = {
      dissertation: 'Explique la methodologie de la dissertation avec un exemple concret pour un eleve de ',
      commentaire: 'Explique la methodologie du commentaire compose avec un exemple concret pour un eleve de ',
      histoire: 'Explique la methodologie de la dissertation en Histoire-Geographie avec un exemple concret pour un eleve de ',
      philo: 'Explique la methodologie de la dissertation philosophique avec un exemple concret pour un eleve de ',
    };
    sendMessage(prompts[item.action] + userClasse);
  }

    function handleEpreuve(matiere) {
    setShowMatieres(false);
    setShowMenu(false);
    
    // Premier message : le sujet
    sendMessage(`Genere UNIQUEMENT le sujet (sans corrige) d une epreuve type BAC de ${matiere.label} avec 2 exercices pour un eleve de ${userClasse}. Sois tres concis.`);
    
    // Deuxième message après 3 secondes : le corrigé
    setTimeout(() => {
      sendMessage(`Donne maintenant le corrige complet du sujet que tu viens de generer.`);
    }, 5000);
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>✕</Text></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerTitle}>Assistant IA</Text><Text style={styles.headerSubtitle}>{userClasse}</Text></View>
        <TouchableOpacity onPress={() => { setShowMenu(!showMenu); setShowMatieres(false); }} style={[styles.backBtn, showMenu && styles.menuBtnActive]}><Text style={[styles.backBtnText, showMenu && styles.menuBtnTextActive]}>+</Text></TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Actions rapides</Text>
          <View style={styles.menuGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleQuickAction(a)}>
                <Text style={styles.menuItemIcon}>{a.icon}</Text><Text style={styles.menuItemLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {showMatieres && (
            <View style={styles.subMenu}>
              <Text style={styles.subMenuTitle}>Choisir une matiere :</Text>
              <View style={styles.menuGrid}>
                {MATIERES_EPREUVE.map((m, i) => (
                  <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleEpreuve(m)}>
                    <Text style={styles.menuItemIcon}>{m.icon}</Text><Text style={styles.menuItemLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.micBtn} onPress={() => Alert.alert('Audio', 'Disponible dans le build APK.')}><Text style={styles.micBtnText}>🎤</Text></TouchableOpacity>
        <TextInput style={styles.textInput} placeholder="Votre question..." placeholderTextColor="#94A3B8" value={input} onChangeText={setInput} multiline maxLength={500} returnKeyType="send" onSubmitEditing={() => sendMessage()} />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]} onPress={() => sendMessage()} disabled={!input.trim() || loading}><Text style={styles.sendBtnText}>↑</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loadingHistory ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>
        ) : (
          <ScrollView ref={scrollViewRef} style={styles.chatScroll} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg, index) => (
              <View key={index} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                {msg.role === 'assistant' && <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>}
                <View style={[styles.bubbleContent, msg.role === 'user' ? styles.userBubbleContent : styles.aiBubbleContent]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
                </View>
              </View>
            ))}
            {loading && <View style={styles.typingIndicator}><View style={styles.typingDot} /><View style={[styles.typingDot, styles.typingDot2]} /><View style={[styles.typingDot, styles.typingDot3]} /></View>}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E40AF' },
  header: { paddingTop: STATUSBAR_HEIGHT + 8, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: '#1E40AF', flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  menuBtnActive: { backgroundColor: '#FFFFFF' },
  menuBtnTextActive: { color: '#1E40AF', fontSize: 22, fontWeight: '800' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#93C5FD', fontSize: 11, marginTop: 1 },
  menuContainer: { backgroundColor: '#FFFFFF', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuItem: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, alignItems: 'center', width: '31%' },
  menuItemIcon: { fontSize: 24, marginBottom: 4 },
  menuItemLabel: { fontSize: 10, fontWeight: '600', color: '#1E293B', textAlign: 'center' },
  subMenu: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  subMenuTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 6 },
  micBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  micBtnText: { fontSize: 18 },
  textInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 6, fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  body: { flex: 1, backgroundColor: '#F1F5F9' },
  chatScroll: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 8 },
  bubble: { flexDirection: 'row', marginBottom: 10, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 4 },
  aiAvatarText: { fontSize: 16 },
  bubbleContent: { padding: 12, borderRadius: 16, maxWidth: '95%' },
  userBubbleContent: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  aiBubbleContent: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 15, lineHeight: 22, color: '#1F2937' },
  userText: { color: '#FFFFFF' },
  typingIndicator: { flexDirection: 'row', padding: 12, gap: 4, alignSelf: 'flex-start', marginLeft: 40 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.3 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingHistoryText: { marginTop: 10, color: '#6B7280', fontSize: 14 },
});