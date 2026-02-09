import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, 
  Dimensions, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MoodCheckin, MOOD_EMOJIS } from '../../types';
import { format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import ParentAIService, { 
  ParentAlert, 
  ConversationStarter, 
  MoodSummary 
} from '../../services/ParentAIService';

const { width } = Dimensions.get('window');

export function DashboardScreen() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // AI-powered state
  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
  const [alert, setAlert] = useState<ParentAlert | null>(null);
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [currentStarterIndex, setCurrentStarterIndex] = useState(0);
  const [loadingStarters, setLoadingStarters] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.familyId) return;
    
    try {
      const fourteenDaysAgo = subDays(new Date(), 14);
      const q = query(
        collection(db, 'checkins'),
        where('familyId', '==', user.familyId),
        where('createdAt', '>=', fourteenDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MoodCheckin[];
      
      setCheckins(data);
      
      // Analyze mood data
      const summary = ParentAIService.analyzeMoodData(data);
      setMoodSummary(summary);
      
      // Generate alert based on summary
      const alertData = ParentAIService.generateAlert(summary);
      setAlert(alertData);
      
      // Generate AI-powered conversation starters (async)
      setLoadingStarters(true);
      const teenAge = 15; // TODO: Get from family data
      ParentAIService.generateConversationStarters(summary, data, teenAge)
        .then(setStarters)
        .catch(console.error)
        .finally(() => setLoadingStarters(false));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.familyId]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchData(); 
  };

  const nextStarter = () => {
    setCurrentStarterIndex((prev) => (prev + 1) % Math.max(starters.length, 1));
  };

  const getAlertConfig = () => {
    if (!alert) return {
      gradient: ['#D1FAE5', '#A7F3D0'],
      icon: '💚',
      title: 'Loading...',
      message: 'Analyzing mood patterns...',
      color: '#059669',
      actionItems: [],
    };

    switch (alert.level) {
      case 'red': return {
        gradient: ['#FEE2E2', '#FECACA'],
        icon: '❤️',
        title: alert.title,
        message: alert.message,
        color: '#DC2626',
        actionItems: alert.actionItems || [],
      };
      case 'yellow': return {
        gradient: ['#FEF3C7', '#FDE68A'],
        icon: '💛',
        title: alert.title,
        message: alert.message,
        color: '#D97706',
        actionItems: alert.actionItems || [],
      };
      default: return {
        gradient: ['#D1FAE5', '#A7F3D0'],
        icon: '💚',
        title: alert.title,
        message: alert.message,
        color: '#059669',
        actionItems: alert.actionItems || [],
      };
    }
  };

  const alertConfig = getAlertConfig();
  const currentStarter = starters[currentStarterIndex];

  // Week overview calculation
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

  // Trend indicator
  const getTrendIndicator = () => {
    if (!moodSummary) return null;
    switch (moodSummary.trend) {
      case 'improving': return { icon: '📈', text: 'Improving', color: '#10B981' };
      case 'declining': return { icon: '📉', text: 'Worth watching', color: '#F59E0B' };
      case 'volatile': return { icon: '🎢', text: 'Up and down', color: '#8B5CF6' };
      default: return { icon: '➡️', text: 'Stable', color: '#6B7280' };
    }
  };
  const trend = getTrendIndicator();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

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
          
          {alertConfig.actionItems.length > 0 && (
            <View style={styles.actionItems}>
              {alertConfig.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <Text style={[styles.actionBullet, { color: alertConfig.color }]}>•</Text>
                  <Text style={[styles.actionText, { color: alertConfig.color }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Week Overview with Trend */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            {trend && (
              <View style={[styles.trendBadge, { backgroundColor: trend.color + '20' }]}>
                <Text style={styles.trendIcon}>{trend.icon}</Text>
                <Text style={[styles.trendText, { color: trend.color }]}>{trend.text}</Text>
              </View>
            )}
          </View>
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
          
          {/* Quick Stats */}
          {moodSummary && (
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moodSummary.averageMood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moodSummary.checkInStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{checkins.length}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
            </View>
          )}
        </View>

        {/* AI-Powered Conversation Starter */}
        <TouchableOpacity 
          style={styles.starterCard} 
          activeOpacity={0.9}
          onPress={nextStarter}
        >
          <View style={styles.starterHeader}>
            <View style={styles.starterTitleRow}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#6366F1" />
              <Text style={styles.starterLabel}>Conversation Starter</Text>
            </View>
            {starters.length > 1 && (
              <TouchableOpacity onPress={nextStarter} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="refresh" size={18} color="#6366F1" />
              </TouchableOpacity>
            )}
          </View>
          
          {loadingStarters ? (
            <View style={styles.starterLoading}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.starterLoadingText}>Personalizing for your teen...</Text>
            </View>
          ) : currentStarter ? (
            <>
              <Text style={styles.starterText}>"{currentStarter.question}"</Text>
              <Text style={styles.starterContext}>{currentStarter.context}</Text>
              
              {currentStarter.followUps.length > 0 && (
                <View style={styles.followUps}>
                  <Text style={styles.followUpLabel}>Follow-ups:</Text>
                  {currentStarter.followUps.map((followUp, i) => (
                    <Text key={i} style={styles.followUpText}>• {followUp}</Text>
                  ))}
                </View>
              )}
              
              <View style={styles.starterMeta}>
                <View style={[
                  styles.toneBadge,
                  currentStarter.tone === 'supportive' && styles.toneBadgeSupportive,
                  currentStarter.tone === 'celebratory' && styles.toneBadgeCelebratory,
                ]}>
                  <Text style={styles.toneBadgeText}>
                    {currentStarter.tone === 'casual' ? '💬 Casual' : 
                     currentStarter.tone === 'supportive' ? '💜 Supportive' : '🎉 Celebratory'}
                  </Text>
                </View>
                <Text style={styles.starterIndex}>
                  {currentStarterIndex + 1}/{starters.length}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.starterText}>"What was the best part of your day?"</Text>
          )}
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Check-ins</Text>
          {checkins.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💜</Text>
              <Text style={styles.emptyText}>No check-ins yet</Text>
              <Text style={styles.emptySubtext}>
                Insights will appear once your teen starts checking in
              </Text>
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
                  {c.note && (
                    <Text style={styles.checkinNote} numberOfLines={1}>
                      "{c.note}"
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          <Text style={styles.privacyText}>
            You see patterns and trends — never private journal entries
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
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
  actionItems: { marginTop: 12 },
  actionItem: { flexDirection: 'row', marginTop: 6 },
  actionBullet: { fontSize: 14, marginRight: 8 },
  actionText: { fontSize: 14, flex: 1, lineHeight: 20 },
  
  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  
  // Trend Badge
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trendIcon: { fontSize: 12, marginRight: 4 },
  trendText: { fontSize: 12, fontWeight: '600' },
  
  // Week Overview
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center' },
  moodDot: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  moodDotEmoji: { fontSize: 22 },
  dayLabel: { fontSize: 12, color: '#6B7280' },
  
  // Quick Stats
  quickStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  
  // Conversation Starter
  starterCard: {
    backgroundColor: '#EEF2FF', borderRadius: 20, padding: 20, marginBottom: 16,
  },
  starterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  starterTitleRow: { flexDirection: 'row', alignItems: 'center' },
  starterLabel: { fontSize: 14, fontWeight: '600', color: '#6366F1', marginLeft: 8 },
  starterText: { fontSize: 18, color: '#4338CA', fontStyle: 'italic', lineHeight: 26 },
  starterContext: { fontSize: 13, color: '#6366F1', marginTop: 8, opacity: 0.8 },
  starterLoading: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  starterLoadingText: { fontSize: 14, color: '#6366F1', marginLeft: 10 },
  followUps: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(99, 102, 241, 0.2)' },
  followUpLabel: { fontSize: 12, fontWeight: '600', color: '#6366F1', marginBottom: 6 },
  followUpText: { fontSize: 13, color: '#4338CA', marginBottom: 4 },
  starterMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  toneBadge: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  toneBadgeSupportive: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  toneBadgeCelebratory: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  toneBadgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA' },
  starterIndex: { fontSize: 12, color: '#6366F1' },
  
  // Checkins
  checkinRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  checkinDot: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  checkinEmoji: { fontSize: 22 },
  checkinInfo: { marginLeft: 14, flex: 1 },
  checkinMood: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  checkinTime: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  checkinNote: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  
  // Privacy
  privacyNote: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  privacyText: { fontSize: 13, color: '#6B7280', marginLeft: 8, flex: 1 },
});
