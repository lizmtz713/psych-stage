import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type BreathPhase = 'ready' | 'breatheIn' | 'hold1' | 'breatheOut' | 'hold2';

const PHASE_DURATION = 4000; // 4 seconds per phase
const PHASES: BreathPhase[] = ['breatheIn', 'hold1', 'breatheOut', 'hold2'];

export function BreathingScreen({ navigation }: any) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('ready');
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isRunning) return;

    let phaseIndex = 0;
    let countdownInterval: NodeJS.Timeout;

    const runPhase = () => {
      const currentPhase = PHASES[phaseIndex];
      setPhase(currentPhase);
      setCountdown(4);

      // Haptic feedback at phase start
      Vibration.vibrate(50);

      // Countdown timer
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev > 1 ? prev - 1 : 4);
      }, 1000);

      // Animate based on phase
      if (currentPhase === 'breatheIn') {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: PHASE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: PHASE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (currentPhase === 'breatheOut') {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: PHASE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: PHASE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    runPhase();

    const phaseInterval = setInterval(() => {
      clearInterval(countdownInterval);
      phaseIndex = (phaseIndex + 1) % 4;
      if (phaseIndex === 0) {
        setCycleCount(prev => prev + 1);
      }
      runPhase();
    }, PHASE_DURATION);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(countdownInterval);
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setCycleCount(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setPhase('ready');
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.3);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'ready': return 'Tap to begin';
      case 'breatheIn': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'breatheOut': return 'Breathe Out';
      case 'hold2': return 'Hold';
      default: return '';
    }
  };

  const getPhaseEmoji = () => {
    switch (phase) {
      case 'ready': return '🫁';
      case 'breatheIn': return '⬆️';
      case 'hold1': return '⏸️';
      case 'breatheOut': return '⬇️';
      case 'hold2': return '⏸️';
      default: return '🫁';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Box Breathing</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>
          {phase === 'ready' 
            ? 'A calming technique to reduce stress and anxiety' 
            : `${getPhaseEmoji()} ${getPhaseText()}`}
        </Text>

        <View style={styles.circleContainer}>
          <Animated.View 
            style={[
              styles.circle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }
            ]}
          />
          <View style={styles.countdownContainer}>
            {isRunning ? (
              <Text style={styles.countdown}>{countdown}</Text>
            ) : (
              <Text style={styles.tapText}>TAP</Text>
            )}
          </View>
        </View>

        {cycleCount > 0 && (
          <Text style={styles.cycles}>{cycleCount} cycles completed</Text>
        )}

        <TouchableOpacity
          style={isRunning ? styles.stopButton : styles.startButton}
          onPress={isRunning ? handleStop : handleStart}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Stop' : 'Start Breathing'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoStep}>1.</Text>
            <Text style={styles.infoText}>Breathe in for 4 seconds ⬆️</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoStep}>2.</Text>
            <Text style={styles.infoText}>Hold for 4 seconds ⏸️</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoStep}>3.</Text>
            <Text style={styles.infoText}>Breathe out for 4 seconds ⬇️</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoStep}>4.</Text>
            <Text style={styles.infoText}>Hold for 4 seconds ⏸️</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4338CA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  instruction: {
    fontSize: 18, color: '#C7D2FE', textAlign: 'center', marginBottom: 40,
  },
  circleContainer: {
    width: 200, height: 200, justifyContent: 'center', alignItems: 'center',
  },
  circle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#818CF8',
  },
  countdownContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  countdown: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  tapText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  cycles: { fontSize: 14, color: '#C7D2FE', marginTop: 20 },
  startButton: {
    backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 30, marginTop: 40,
  },
  stopButton: {
    backgroundColor: '#EF4444', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 30, marginTop: 40,
  },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#4338CA' },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20,
    marginTop: 40, width: '100%',
  },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoStep: { width: 24, fontSize: 14, color: '#C7D2FE', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#C7D2FE', flex: 1 },
});
