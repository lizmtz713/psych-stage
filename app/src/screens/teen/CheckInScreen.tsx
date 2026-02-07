import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MOOD_EMOJIS, MoodCheckin } from '../../types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const MOODS = [1, 2, 3, 4, 5] as const;

// Teen-friendly mood labels
const MOOD_VIBES: Record<number, { emoji: string; label: string; vibe: string }> = {
  1: { emoji: '😢', label: 'rough', vibe: 'not it rn' },
  2: { emoji: '😔', label: 'meh', vibe: 'lowkey struggling' },
  3: { emoji: '😐', label: 'mid', vibe: 'just existing' },
  4: { emoji: '🙂', label: 'good', vibe: 'we chillin' },
  5: { emoji: '😄', label: 'great', vibe: 'immaculate vibes' },
};

// Rotating quick prompts - more engaging than static "journal"
const QUICK_PROMPTS = [
  { label: "wanna vent?", placeholder: "spill the tea..." },
  { label: "one word for today?", placeholder: "type it out..." },
  { label: "what's draining your battery? 🔋", placeholder: "lowkey..." },
  { label: "who made you smile today?", placeholder: "shoutout to..." },
  { label: "what do you need rn?", placeholder: "fr i need..." },
  { label: "rate your social energy 1-10", placeholder: "mine's like..." },
  { label: "any wins today? even small ones", placeholder: "ngl i did..." },
  { label: "what's living in your head rent free?", placeholder: "can't stop thinking about..." },
  { label: "describe your day in an emoji", placeholder: "the vibe is..." },
  { label: "what would make tomorrow better?", placeholder: "honestly..." },
];

export function CheckInScreen() {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<MoodCheckin[]>([]);
  const [streak, setStreak] = useState(0);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * QUICK_PROMPTS.length));
  
  const currentPrompt = QUICK_PROMPTS[promptIndex];
  const scaleAnims = useRef(MOODS.map(() => new Animated.Value(1))).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRecentCheckins();
  }, [user]);

  const fetchRecentCheckins = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'checkins'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(7)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MoodCheckin[];
      setRecentCheckins(data);
      
      // Calculate ACTUAL streak (unique days, not total check-ins)
      const uniqueDays = new Set(
        data.map(c => format(new Date(c.createdAt), 'yyyy-MM-dd'))
      );
      setStreak(uniqueDays.size);
    } catch (error) {
      console.error('Error fetching checkins:', error);
    }
  };

  const handleMoodSelect = (m: number, index: number) => {
    setMood(m);
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnims[index], { toValue: 1.1, useNativeDriver: true, friction: 3 }),
    ]).start();
    scaleAnims.forEach((anim, i) => {
      if (i !== index) Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    });
  };

  const handleSubmit = async () => {
    if (!mood || !user) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        userId: user.id,
        ...(user.familyId && { familyId: user.familyId }),
        mood,
        note: note.trim() || null,
        createdAt: serverTimestamp(),
      });
      
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successScale, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(successOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setShowSuccess(false);
          setMood(null);
          setNote('');
          scaleAnims.forEach(a => a.setValue(1));
          fetchRecentCheckins();
        });
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess && mood) {
    return (
      <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.container}>
        <Animated.View style={[styles.successContainer, { 
          transform: [{ scale: successScale }],
          opacity: successOpacity 
        }]}>
          <Text style={styles.successEmoji}>{MOOD_VIBES[mood].emoji}</Text>
          <Text style={styles.successTitle}>bet! logged it ✓</Text>
          <Text style={styles.successSub}>{MOOD_VIBES[mood].vibe}</Text>
          {streak > 1 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {streak + 1} day streak no cap</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>hey {user?.name?.split(' ')[0]?.toLowerCase()} 👋</Text>
          <Text style={styles.title}>what's the vibe?</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {streak} day streak</Text>
            </View>
          )}
        </View>

        {/* Mood Selection */}
        <View style={styles.moodContainer}>
          {MOODS.map((m, i) => (
            <TouchableOpacity
              key={m}
              onPress={() => handleMoodSelect(m, i)}
              activeOpacity={0.7}
            >
              <Animated.View style={[
                styles.moodButton,
                mood === m && styles.moodButtonSelected,
                { transform: [{ scale: scaleAnims[i] }] }
              ]}>
                <Text style={styles.moodEmoji}>{MOOD_VIBES[m].emoji}</Text>
                <Text style={[styles.moodLabel, mood === m && styles.moodLabelSelected]}>
                  {MOOD_VIBES[m].label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {mood && (
          <View style={styles.vibeTag}>
            <Text style={styles.vibeTagText}>{MOOD_VIBES[mood].vibe}</Text>
          </View>
        )}

        {/* Note Input with Rotating Prompts */}
        <View style={styles.glassCard}>
          <View style={styles.promptHeader}>
            <Text style={styles.noteLabel}>{currentPrompt.label} (optional)</Text>
            <TouchableOpacity 
              onPress={() => setPromptIndex((promptIndex + 1) % QUICK_PROMPTS.length)}
              style={styles.shuffleButton}
            >
              <Text style={styles.shuffleText}>🔀 switch</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder={currentPrompt.placeholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            value={note}
            onChangeText={setNote}
            maxLength={300}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, !mood && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!mood || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>
            {submitting ? 'logging...' : "drop it 🎤"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.privateNote}>🔒 this stays between us. parents can't see your notes, ever.</Text>

        {/* Recent Vibes */}
        {recentCheckins.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>your week</Text>
            <View style={styles.historyRow}>
              {recentCheckins.slice(0, 7).map((c) => (
                <View key={c.id} style={styles.historyDot}>
                  <Text style={styles.historyEmoji}>{MOOD_VIBES[c.mood].emoji}</Text>
                  <Text style={styles.historyDay}>{format(new Date(c.createdAt), 'EEE').toLowerCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32, alignItems: 'center' },
  greeting: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  streakBadge: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 20,
  },
  streakBadgeText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  moodContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
  },
  moodButton: {
    width: (width - 80) / 5, alignItems: 'center', padding: 12, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  moodButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  moodEmoji: { fontSize: 36, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  moodLabelSelected: { color: '#6366F1', fontWeight: '600' },
  vibeTag: {
    alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 24,
  },
  vibeTagText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  promptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shuffleButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  shuffleText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  noteLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', flex: 1 },
  noteInput: {
    color: '#FFF', fontSize: 16, minHeight: 80, textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFF', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  submitButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.3)' },
  submitText: { fontSize: 18, fontWeight: '700', color: '#6366F1' },
  privateNote: {
    textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 16,
  },
  historySection: { marginTop: 40 },
  historyTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyDot: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10, borderRadius: 16, minWidth: 44,
  },
  historyEmoji: { fontSize: 22 },
  historyDay: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successEmoji: { fontSize: 100 },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 24 },
  successSub: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  streakPill: {
    marginTop: 32, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30,
  },
  streakText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
