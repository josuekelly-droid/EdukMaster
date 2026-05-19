import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppLogo from '../components/AppLogo';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <AppLogo size={140} showText={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});