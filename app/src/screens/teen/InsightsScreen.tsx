import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MoodCheckin } from '../../types';
import { format, subDays, getDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Psychology-backed insights for teens
const MOOD_EXPLAINERS: Record<number, { title: string; why: string; tip: string }> = {
  1: {
    title: "when everything feels heavy",
    why: "your brain is trying to protect you by slowing things down. it's not weakness — it's your nervous system saying 'i need a break.'",
    tip: "be gentle with yourself rn. even small things count — drinking water, getting outside for 5 min, texting someone you trust."
  },
  2: {
    title: "the 'meh' zone",
    why: "feeling blah is often your brain running low on dopamine (the motivation chemical). it's super common, especially with stress or bad sleep.",
    tip: "try one tiny thing that usually makes you feel good — even if you don't feel like it. movement, music, or talking to someone can help restart your brain."
  },
  3: {
    title: "neutral isn't bad",
    why: "not every day needs to be amazing. being 'okay' is actually your baseline — it means your nervous system is regulated.",
    tip: "this is a good time to build habits. your brain is calm enough to learn new things."
  },
  4: {
    title: "good vibes, real ones",
    why: "when you feel good, your brain releases serotonin and dopamine. these help you think clearer, connect better, and handle stress.",
    tip: "notice what got you here. was it sleep? people? activities? knowing your patterns helps you recreate good days."
  },
  5: {
    title: "riding high",
    why: "your brain is flooded with feel-good chemicals rn. enjoy it! but also know that feelings always shift — that's normal and healthy.",
    tip: "great time to do something meaningful, connect with people, or tackle something you've been avoiding."
  }
};

// Quick emotion cards for InsightsScreen - tap for full guide
const EMOTION_VOCABULARY = [
  { id: "anxiety", feeling: "anxious", emoji: "😰", signs: "racing thoughts, tight chest, can't sit still" },
  { id: "sadness", feeling: "sad", emoji: "😢", signs: "heavy, tired, want to cry or hide" },
  { id: "anger", feeling: "angry", emoji: "😤", signs: "hot, tense, want to snap" },
  { id: "fear", feeling: "scared", emoji: "😨", signs: "heart racing, want to run or freeze" },
  { id: "joy", feeling: "happy", emoji: "😄", signs: "light, energized, connected" },
  { id: "shame", feeling: "ashamed", emoji: "😞", signs: "want to hide, feeling 'not good enough'" },
  { id: "overwhelmed", feeling: "overwhelmed", emoji: "🤯", signs: "can't think, too much at once" },
  { id: "lonely", feeling: "lonely", emoji: "🥺", signs: "disconnected, unseen, empty" },
  { id: "jealous", feeling: "jealous", emoji: "😒", signs: "comparing, wanting what others have" },
  { id: "embarrassed", feeling: "embarrassed", emoji: "😳", signs: "face hot, want to disappear" },
  { id: "frustrated", feeling: "frustrated", emoji: "😤", signs: "stuck, things not working" },
];

const DAY_PATTERNS: Record<number, string> = {
  0: "Sundays can feel heavy — the 'Sunday scaries' are real. Your brain is anticipating the week ahead.",
  1: "Mondays are rough for most people. Your brain is adjusting from weekend mode.",
  2: "Tuesday is statistically one of the lowest mood days. You're not alone.",
  3: "Midweek slump is real. Your brain might need a reset — even 10 min outside helps.",
  4: "Thursday energy usually picks up — the weekend is in sight.",
  5: "Friday vibes hit different. Your brain knows rest is coming.",
  6: "Saturdays are usually highest mood. Let yourself actually enjoy it without guilt.",
};

// Real statistics to normalize teen experiences
const NORMALIZATION_STATS = [
  { stat: "1 in 5", context: "teens experience a mental health condition each year. you're not alone." },
  { stat: "70%", context: "of teens say anxiety and depression are major problems among their peers." },
  { stat: "50%", context: "of mental health conditions begin by age 14. early awareness = early support." },
  { stat: "80%", context: "of teens who get help see improvement. reaching out works." },
  { stat: "63%", context: "of teens report feeling 'overwhelming anxiety' at some point." },
];

export function InsightsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [avgMood, setAvgMood] = useState(3);
  const [moodByDay, setMoodByDay] = useState<Record<number, number>>({});
  const [lowestDay, setLowestDay] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [expandedEmotion, setExpandedEmotion] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'checkins'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MoodCheckin[];
      
      setCheckins(data);
      setStreak(data.length);

      // Calculate average
      if (data.length > 0) {
        const avg = data.reduce((sum, c) => sum + c.mood, 0) / data.length;
        setAvgMood(Math.round(avg));
      }

      // Calculate mood by day of week
      const dayMoods: Record<number, number[]> = {};
      data.forEach(c => {
        const day = getDay(new Date(c.createdAt));
        if (!dayMoods[day]) dayMoods[day] = [];
        dayMoods[day].push(c.mood);
      });

      const avgByDay: Record<number, number> = {};
      let lowest = null;
      let lowestAvg = 6;
      Object.entries(dayMoods).forEach(([day, moods]) => {
        const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
        avgByDay[parseInt(day)] = avg;
        if (avg < lowestAvg) {
          lowestAvg = avg;
          lowest = parseInt(day);
        }
      });
      setMoodByDay(avgByDay);
      setLowestDay(lowest);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const currentExplainer = MOOD_EXPLAINERS[avgMood];
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <Text style={styles.header}>your patterns 🧠</Text>
        <Text style={styles.subheader}>what your vibes are telling you</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Mood Insight */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>based on your recent check-ins</Text>
          <Text style={styles.cardTitle}>{currentExplainer.title}</Text>
          <Text style={styles.cardBody}>{currentExplainer.why}</Text>
          <View style={styles.tipBox}>
            <Text style={styles.tipLabel}>💡 try this</Text>
            <Text style={styles.tipText}>{currentExplainer.tip}</Text>
          </View>
        </View>

        {/* Day Pattern */}
        {lowestDay !== null && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>pattern spotted</Text>
            <Text style={styles.cardTitle}>your {dayNames[lowestDay]}s tend to be harder</Text>
            <Text style={styles.cardBody}>{DAY_PATTERNS[lowestDay]}</Text>
            <View style={styles.dayChart}>
              {dayNames.map((day, i) => (
                <View key={i} style={styles.dayBar}>
                  <View style={[
                    styles.dayFill, 
                    { height: `${(moodByDay[i] || 3) * 20}%` },
                    i === lowestDay && styles.dayFillLow
                  ]} />
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emotion Vocabulary - Inside Out Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>feeling something but can't name it?</Text>
          <Text style={styles.sectionSub}>tap any emotion to learn about it</Text>
          
          {EMOTION_VOCABULARY.map((emotion, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.emotionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EmotionDetail' as never, { emotionId: emotion.id } as never)}
            >
              <View style={styles.emotionHeader}>
                <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                <View style={styles.emotionInfo}>
                  <Text style={styles.emotionName}>{emotion.feeling}</Text>
                  <Text style={styles.emotionSigns}>{emotion.signs}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* You're Not Alone */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>you're not alone</Text>
          <Text style={styles.cardTitle}>real talk about teen mental health</Text>
          {NORMALIZATION_STATS.slice(0, 3).map((item, i) => (
            <View key={i} style={styles.statRow}>
              <Text style={styles.statBig}>{item.stat}</Text>
              <Text style={styles.statContext}>{item.context}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Skills')}
          >
            <Text style={styles.linkIcon}>🧘</Text>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>coping skills</Text>
              <Text style={styles.linkDesc}>2-min exercises that help</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('SafetyPlan')}
          >
            <Text style={styles.linkIcon}>🛡️</Text>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>my safety plan</Text>
              <Text style={styles.linkDesc}>for when things get hard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Brain Facts */}
        <View style={styles.brainCard}>
          <Text style={styles.brainEmoji}>🧠</Text>
          <Text style={styles.brainTitle}>did you know?</Text>
          <Text style={styles.brainFact}>
            your teenage brain is literally under construction. the part that handles emotions (amygdala) is fully developed, but the part that handles logic (prefrontal cortex) won't finish until your mid-20s. 
            {'\n\n'}
            that's why feelings hit SO hard right now — it's not you being dramatic, it's biology.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  header: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  subheader: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 20, marginTop: -10 },
  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardLabel: { fontSize: 12, color: '#6366F1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  cardBody: { fontSize: 16, color: '#4B5563', lineHeight: 24 },
  tipBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginTop: 16 },
  tipLabel: { fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 6 },
  tipText: { fontSize: 15, color: '#065F46', lineHeight: 22 },
  // Day Chart
  dayChart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, height: 80 },
  dayBar: { alignItems: 'center', flex: 1 },
  dayFill: { width: 20, backgroundColor: '#C7D2FE', borderRadius: 10, marginBottom: 8 },
  dayFillLow: { backgroundColor: '#FCA5A5' },
  dayLabel: { fontSize: 11, color: '#6B7280' },
  // Section
  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  sectionSub: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  // Emotion Cards
  emotionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#8B5CF6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emotionHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  emotionEmoji: { fontSize: 32, marginRight: 14 },
  emotionInfo: { flex: 1 },
  emotionName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4, textTransform: 'capitalize' },
  emotionSigns: { fontSize: 13, color: '#6B7280' },
  // Brain Card
  brainCard: {
    backgroundColor: '#EEF2FF', borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 8,
  },
  brainEmoji: { fontSize: 48, marginBottom: 12 },
  brainTitle: { fontSize: 18, fontWeight: '700', color: '#4338CA', marginBottom: 12 },
  brainFact: { fontSize: 15, color: '#6366F1', lineHeight: 24, textAlign: 'center' },
  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statBig: { fontSize: 28, fontWeight: '800', color: '#6366F1', width: 80 },
  statContext: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  // Links
  linksSection: { marginTop: 8, marginBottom: 16 },
  linkCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 18, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  linkIcon: { fontSize: 28, marginRight: 14 },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  linkDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
