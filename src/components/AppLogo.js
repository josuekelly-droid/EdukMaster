import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function AppLogo({ size = 120, showText = true }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation continue du chapeau
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse du logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* Chapeau de diplômé */}
      <Animated.View style={[styles.hatContainer, { transform: [{ rotate }] }]}>
        {/* Base du chapeau */}
        <View style={[styles.hatBase, { width: size * 0.7, height: size * 0.08 }]}>
          <View style={styles.hatLine} />
        </View>
        {/* Corps du chapeau */}
        <View style={[styles.hatBody, { width: size * 0.45, height: size * 0.45 }]}>
          <View style={styles.hatInner} />
          {/* Pompon */}
          <View style={[styles.pompon, { width: size * 0.12, height: size * 0.12, top: -size * 0.04 }]}>
            <View style={styles.pomponInner} />
          </View>
          {/* Gland */}
          <View style={[styles.gland, { width: size * 0.03, height: size * 0.2, top: size * 0.38 }]}>
            <View style={[styles.glandBall, { width: size * 0.08, height: size * 0.08, bottom: -size * 0.06 }]} />
          </View>
        </View>
      </Animated.View>

      {/* Diplôme en dessous */}
      <View style={[styles.diploma, { width: size * 0.55, height: size * 0.35, marginTop: size * 0.1 }]}>
        <View style={styles.diplomaInner}>
          <Text style={[styles.diplomaText, { fontSize: size * 0.12 }]}>E</Text>
        </View>
        {/* Ruban */}
        <View style={[styles.ribbon, { width: size * 0.15, height: size * 0.08 }]}>
          <View style={styles.ribbonLeft} />
          <View style={styles.ribbonRight} />
        </View>
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontSize: size * 0.22 }]}>EdukMaster</Text>
          <Text style={[styles.subtitle, { fontSize: size * 0.1 }]}>Apprendre, Réussir, Grandir</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hatContainer: {
    alignItems: 'center',
  },
  hatBase: {
    backgroundColor: '#1E3A5F',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  hatLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  hatBody: {
    backgroundColor: '#1E3A5F',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  hatInner: {
    width: '70%',
    height: '70%',
    backgroundColor: '#2A5298',
    borderRadius: 6,
  },
  pompon: {
    position: 'absolute',
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pomponInner: {
    width: '60%',
    height: '60%',
    backgroundColor: '#FBBF24',
    borderRadius: 50,
  },
  gland: {
    position: 'absolute',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    alignItems: 'center',
  },
  glandBall: {
    position: 'absolute',
    backgroundColor: '#F59E0B',
    borderRadius: 50,
  },
  diploma: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  diplomaInner: {
    width: '80%',
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  diplomaText: {
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  ribbon: {
    position: 'absolute',
    bottom: -5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ribbonLeft: {
    width: 8,
    height: 20,
    backgroundColor: '#DC2626',
    transform: [{ rotate: '15deg' }],
    borderRadius: 2,
  },
  ribbonRight: {
    width: 8,
    height: 20,
    backgroundColor: '#DC2626',
    transform: [{ rotate: '-15deg' }],
    borderRadius: 2,
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1E3A5F',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
});