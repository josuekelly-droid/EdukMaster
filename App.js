import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabase';

import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import HomeScreen from './src/screens/HomeScreen';
import CoursScreen from './src/screens/CoursScreen';
import ChapitresScreen from './src/screens/ChapitresScreen';
import LeconScreen from './src/screens/LeconScreen';
import ExercicesScreen from './src/screens/ExercicesScreen';
import ExamenBlancScreen from './src/screens/ExamenBlancScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import AreneScreen from './src/screens/AreneScreen';
import DefiEnCoursScreen from './src/screens/DefiEnCoursScreen';
import AIScreen from './src/screens/AIScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import { registerForPushNotifications } from './src/services/notificationService';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    registerForPushNotifications();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) return <SplashScreen />;

  const isEmailVerified = user?.email_confirmed_at ? true : false;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{
                title: 'Vérification',
                headerStyle: { backgroundColor: '#2563EB' },
              }}
            />
          </>
        ) : !isEmailVerified ? (
          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmailScreen}
            options={{
              title: 'Vérification',
              headerStyle: { backgroundColor: '#2563EB' },
            }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Accueil" 
              component={HomeScreen}
              options={{
                title: '🎓 EdukMaster',
                headerStyle: { backgroundColor: '#1E40AF' },
              }}
            />
            <Stack.Screen 
              name="Cours" 
              component={CoursScreen} 
              options={{ 
                title: '📚 Matières',
                headerStyle: { backgroundColor: '#2563EB' },
              }} 
            />
            <Stack.Screen 
              name="Chapitres" 
              component={ChapitresScreen} 
              options={({ route }) => ({
                title: `${route.params?.matiere?.icone || ''} ${route.params?.matiere?.nom || 'Chapitres'}`,
                headerStyle: { backgroundColor: '#2563EB' },
              })}
            />
            <Stack.Screen 
              name="Lecon" 
              component={LeconScreen} 
              options={({ route }) => ({
                title: route.params?.cours?.titre || 'Leçon',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#FFFFFF',
              })}
            />
            <Stack.Screen 
              name="Exercices" 
              component={ExercicesScreen}
              options={{
                title: '✍️ Exercices',
                headerStyle: { backgroundColor: '#16A34A' },
              }}
            />
            <Stack.Screen 
              name="ExamenBlanc" 
              component={ExamenBlancScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
            
            <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: '🏆 Badges', headerStyle: { backgroundColor: '#F59E0B' } }} />


            <Stack.Screen name="Arene" component={AreneScreen} options={{ title: '⚔️ Arène', headerStyle: { backgroundColor: '#DC2626' } }} />
<Stack.Screen name="DefiEnCours" component={DefiEnCoursScreen} options={{ title: '⚡ Défi en cours', headerStyle: { backgroundColor: '#F59E0B' }, gestureEnabled: false }} />


                 <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: '📜 Confidentialité', headerStyle: { backgroundColor: '#1E293B' } }} />


            <Stack.Screen 
              name="AssistantIA" 
              component={AIScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Profil" 
              component={ProfilScreen}
              options={{
                title: '👤 Mon Profil',
                headerStyle: { backgroundColor: '#9333EA' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}