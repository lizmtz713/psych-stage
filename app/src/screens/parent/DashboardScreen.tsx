import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MoodCheckin, MOOD_EMOJIS } from '../../types';
import { format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CONVERSATION_STARTERS = [
  "What was the best part of your day?",
  "Anything exciting happening this week?",
  "How are things with your friends?",
  "What's something that made you laugh recently?",
  "Is there anything on your mind lately?",
  "What are you looking forward to?",
  "How can I support you this week?",
];

export function DashboardScreen() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alertLevel, setAlertLevel] = useState<'green' | 'yellow' | 'red'>('green');

  const fetchData = async () => {
    if (!user?.familyId) return;
    
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      const q = query(
        collection(db, 'checkins'),
        where('familyId', '==', user.familyId),
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MoodCheckin[];
      
      setCheckins(data);
      
      // Calculate alert level
      const recentMoods = data.slice(0, 7).map(c => c.mood);
      const avgMood = recentMoods.length > 0 
        ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length 
        : 3;
      
      if (avgMood < 2) setAlertLevel('red');
      else if (avgMood < 3) setAlertLevel('yellow');
      else setAlertLevel('green');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.familyId]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getAlertConfig = () => {
    switch (alertLevel) {
      case 'red': return {
        gradient: ['#FEE2E2', '#FECACA'],
        icon: '❤️', title: 'Needs Attention',
        message: "Your teen has been feeling low. This might be a good time to connect.",
        color: '#DC2626',
      };
      case 'yellow': return {
        gradient: ['#FEF3C7', '#FDE68A'],
        icon: '💛', title: 'Check In',
        message: "Some lower moments this week. A casual check-in could help.",
        color: '#D97706',
      };
      default: return {
        gradient: ['#D1FAE5', '#A7F3D0'],
        icon: '💚', title: 'All Good',
        message: "Your teen seems to be doing well! Keep up the connection.",
        color: '#059669',
      };
    }
  };

  const alertConfig = getAlertConfig();
  const randomStarter = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];

  // Calculate week's mood visual
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayCheckins = checkins.filter(c => 
      format(new Date(c.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const avgMood = dayCheckins.length > 0
      ? Math.round(dayCheckins.reduce((sum, c) => sum + c.mood, 0) / dayCheckins.length)
      : null;
    return { day: format(date, 'EEE'), mood: avgMood };
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.title}>Family Dashboard</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Card */}
        <LinearGradient colors={alertConfig.gradient} style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>{alertConfig.icon}</Text>
            <Text style={[styles.alertTitle, { color: alertConfig.color }]}>{alertConfig.title}</Text>
          </View>
          <Text style={[styles.alertMessage, { color: alertConfig.color }]}>{alertConfig.message}</Text>
        </LinearGradient>

        {/* Week Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {weekDays.map((day, i) => (
              <View key={i} style={styles.dayColumn}>
                <View style={[
                  styles.moodDot,
                  day.mood && { backgroundColor: MOOD_EMOJIS[day.mood].color }
                ]}>
                  {day.mood && <Text style={styles.moodDotEmoji}>{MOOD_EMOJIS[day.mood].emoji}</Text>}
                </View>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conversation Starter */}
        <TouchableOpacity style={styles.starterCard} activeOpacity={0.9}>
          <View style={styles.starterHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#6366F1" />
            <Text style={styles.starterLabel}>Conversation Starter</Text>
          </View>
          <Text style={styles.starterText}>"{randomStarter}"</Text>
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Check-ins</Text>
          {checkins.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💜</Text>
              <Text style={styles.emptyText}>No check-ins yet this week</Text>
            </View>
          ) : (
            checkins.slice(0, 5).map((c) => (
              <View key={c.id} style={styles.checkinRow}>
                <View style={[styles.checkinDot, { backgroundColor: MOOD_EMOJIS[c.mood].color + '30' }]}>
                  <Text style={styles.checkinEmoji}>{MOOD_EMOJIS[c.mood].emoji}</Text>
                </View>
                <View style={styles.checkinInfo}>
                  <Text style={styles.checkinMood}>{MOOD_EMOJIS[c.mood].label}</Text>
                  <Text style={styles.checkinTime}>{format(new Date(c.createdAt), 'EEE, MMM d · h:mm a')}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          <Text style={styles.privacyText}>
            You see trends only — never journal entries or private notes
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24 },
  header: {},
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 4 },
  content: { flex: 1, marginTop: -20 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  // Alert Card
  alertCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  alertIcon: { fontSize: 24, marginRight: 10 },
  alertTitle: { fontSize: 18, fontWeight: '700' },
  alertMessage: { fontSize: 15, lineHeight: 22 },
  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  // Week Overview
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center' },
  moodDot: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  moodDotEmoji: { fontSize: 22 },
  dayLabel: { fontSize: 12, color: '#6B7280' },
  // Starter
  starterCard: {
    backgroundColor: '#EEF2FF', borderRadius: 20, padding: 20, marginBottom: 16,
  },
  starterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  starterLabel: { fontSize: 14, fontWeight: '600', color: '#6366F1', marginLeft: 8 },
  starterText: { fontSize: 17, color: '#4338CA', fontStyle: 'italic', lineHeight: 24 },
  // Checkins
  checkinRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkinDot: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  checkinEmoji: { fontSize: 22 },
  checkinInfo: { marginLeft: 14, flex: 1 },
  checkinMood: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  checkinTime: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  // Privacy
  privacyNote: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  privacyText: { fontSize: 13, color: '#6B7280', marginLeft: 8, flex: 1 },
});
