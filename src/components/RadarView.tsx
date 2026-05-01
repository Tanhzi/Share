import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface RadarViewProps {
  isScanning: boolean;
  pulseAnim: React.MutableRefObject<Animated.Value>;
  bounceAnim: React.MutableRefObject<Animated.Value>;
}

const COLORS = {
  primary: '#2563EB',
  secondary: '#10b981',
  bg: '#f8fafc',
  slate400: '#94a3b8',
};

export const RadarView: React.FC<RadarViewProps> = ({
  isScanning,
  pulseAnim,
  bounceAnim,
}) => {
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim.current, {
        toValue: 1,
        duration: 2500,
        easing: undefined,
        useNativeDriver: true,
      })
    );

    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim.current, {
          toValue: -8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim.current, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    bounceLoop.start();

    return () => {
      pulseLoop.stop();
      bounceLoop.stop();
    };
  }, [pulseAnim, bounceAnim]);

  const pulse = pulseAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.radarContainer}>
      <Animated.View
        style={[
          styles.radarCircle,
          {
            transform: [{ scale: pulse }],
            opacity: pulseAnim.current.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 0],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.radarCircle,
          {
            transform: [{ translateY: bounceAnim.current }],
          },
        ]}>
        <Text style={styles.radarText}>📡</Text>
      </Animated.View>
      {isScanning && (
        <Text style={styles.scanningText}>Scanning nearby files...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  radarCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarText: {
    fontSize: 32,
  },
  scanningText: {
    marginTop: 40,
    color: COLORS.slate400,
    fontSize: 14,
  },
});
