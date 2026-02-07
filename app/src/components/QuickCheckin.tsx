import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// One-tap "I'm okay" for when teens don't want full check-in
// Parents see activity, teen doesn't have to explain
export function QuickCheckin({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handleQuickCheckin = async () => {
    if (!user) return;
    
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      await addDoc(collection(db, 'checkins'), {
        userId: user.id,
        familyId: user.familyId,
        mood: 3, // neutral - just acknowledging they're okay
        note: null,
        isQuickCheckin: true,
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (sent) {
    return (
      <View style={styles.sentContainer}>
        <Text style={styles.sentEmoji}>✓</Text>
        <Text style={styles.sentText}>sent! your parents know you're okay</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.container} onPress={handleQuickCheckin} activeOpacity={0.8}>
        <Text style={styles.emoji}>👋</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>just checking in</Text>
          <Text style={styles.subtitle}>one tap to let parents know you're okay</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emoji: { fontSize: 32, marginRight: 14 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 16,
  },
  sentEmoji: { fontSize: 24, marginRight: 12, color: '#FFF' },
  sentText: { fontSize: 15, color: '#FFF', fontWeight: '500' },
});
