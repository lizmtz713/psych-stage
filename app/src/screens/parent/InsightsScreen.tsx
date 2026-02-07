import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MoodCheckin, MOOD_EMOJIS } from '../../types';
import { format, subDays, startOfWeek, getDay, getHours } from 'date-fns';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface Pattern {
  type: 'time' | 'day' | 'trend' | 'streak' | 'concern';
  title: string;
  description: string;
  icon: string;
  color: string;
  actionable?: string;
}

interface TimeSlot {
  hour: number;
  avgMood: number | null;
  count: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function InsightsScreen() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const fetchData = async () => {
    if (!user?.familyId) return;

    try {
      const daysBack = selectedPeriod === 'week' ? 7 : 30;
      const startDate = subDays(new Date(), daysBack);

      const q = query(
        collection(db, 'checkins'),
        where('familyId', '==', user.familyId),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc'),
        limit(200)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MoodCheckin[];

      setCheckins(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.familyId, selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ============================================
  // PATTERN DETECTION
  // ============================================

  const detectPatterns = (): Pattern[] => {
    if (checkins.length < 3) return [];

    const patterns: Pattern[] = [];

    // 1. TIME OF DAY PATTERNS
    const morningMoods = checkins.filter(c => {
      const hour = getHours(new Date(c.createdAt));
      return hour >= 6 && hour < 12;
    });
    const eveningMoods = checkins.filter(c => {
      const hour = getHours(new Date(c.createdAt));
      return hour >= 18 && hour < 23;
    });

    const avgMorning = morningMoods.length > 0
      ? morningMoods.reduce((s, c) => s + c.mood, 0) / morningMoods.length
      : 0;
    const avgEvening = eveningMoods.length > 0
      ? eveningMoods.reduce((s, c) => s + c.mood, 0) / eveningMoods.length
      : 0;

    if (morningMoods.length > 2 && eveningMoods.length > 2) {
      if (avgMorning - avgEvening > 0.8) {
        patterns.push({
          type: 'time',
          title: 'Morning Person',
          description: 'They tend to feel better in the mornings. Evenings might be when stress builds up.',
          icon: '🌅',
          color: '#F59E0B',
          actionable: 'Try connecting in the morning when they\'re in a better headspace.',
        });
      } else if (avgEvening - avgMorning > 0.8) {
        patterns.push({
          type: 'time',
          title: 'Night Owl Energy',
          description: 'They feel better as the day goes on. Mornings might be tough.',
          icon: '🌙',
          color: '#8B5CF6',
          actionable: 'Give them space in the mornings. Connect after school or in the evening.',
        });
      }
    }

    // 2. DAY OF WEEK PATTERNS
    const dayMoods: number[][] = [[], [], [], [], [], [], []];
    checkins.forEach(c => {
      const day = getDay(new Date(c.createdAt));
      dayMoods[day].push(c.mood);
    });

    const dayAvgs = dayMoods.map(moods =>
      moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null
    );

    const lowestDayIdx = dayAvgs.reduce((min, avg, idx) =>
      avg !== null && (min === -1 || (dayAvgs[min] !== null && avg < (dayAvgs[min] || 99)))
        ? idx : min,
      -1
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (lowestDayIdx !== -1 && dayAvgs[lowestDayIdx] !== null && dayAvgs[lowestDayIdx]! < 2.5) {
      patterns.push({
        type: 'day',
        title: `${dayNames[lowestDayIdx]} Blues`,
        description: `${dayNames[lowestDayIdx]}s tend to be harder for them. Average mood is lower than other days.`,
        icon: '📅',
        color: '#3B82F6',
        actionable: `Plan something positive for ${dayNames[lowestDayIdx]}s — even a small treat or activity.`,
      });
    }

    // 3. TREND ANALYSIS
    const recentAvg = checkins.slice(0, 7).reduce((s, c) => s + c.mood, 0) / Math.min(checkins.length, 7);
    const olderCheckins = checkins.slice(7, 14);
    const olderAvg = olderCheckins.length > 0
      ? olderCheckins.reduce((s, c) => s + c.mood, 0) / olderCheckins.length
      : recentAvg;

    if (recentAvg - olderAvg > 0.5) {
      patterns.push({
        type: 'trend',
        title: 'Improving! 📈',
        description: 'Mood has been trending up compared to last week. Something is going right!',
        icon: '✨',
        color: '#10B981',
        actionable: 'Ask what\'s been going well! Celebrate the positive.',
      });
    } else if (olderAvg - recentAvg > 0.5) {
      patterns.push({
        type: 'trend',
        title: 'Worth Watching',
        description: 'Mood has dipped compared to last week. Might be temporary, but worth a gentle check-in.',
        icon: '📉',
        color: '#F59E0B',
        actionable: 'Create a low-pressure opportunity to talk. "How are things going for you lately?"',
      });
    }

    // 4. CHECK-IN STREAKS
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDay = subDays(today, i);
      const hasCheckin = checkins.some(c =>
        format(new Date(c.createdAt), 'yyyy-MM-dd') === format(checkDay, 'yyyy-MM-dd')
      );
      if (hasCheckin) streak++;
      else break;
    }

    if (streak >= 7) {
      patterns.push({
        type: 'streak',
        title: `${streak} Day Streak! 🔥`,
        description: 'They\'ve been checking in consistently. This shows engagement and self-awareness.',
        icon: '🎯',
        color: '#10B981',
      });
    } else if (streak === 0 && checkins.length > 0) {
      const lastCheckin = checkins[0];
      const daysSince = Math.floor((today.getTime() - new Date(lastCheckin.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 3) {
        patterns.push({
          type: 'concern',
          title: 'Radio Silence',
          description: `No check-in in ${daysSince} days. This could be nothing, or they might be going through something.`,
          icon: '📵',
          color: '#EF4444',
          actionable: 'Reach out casually. "Hey, just thinking of you. How\'s your week been?"',
        });
      }
    }

    // 5. LOW MOOD FREQUENCY
    const lowMoodCount = checkins.filter(c => c.mood <= 2).length;
    const lowMoodPercent = (lowMoodCount / checkins.length) * 100;

    if (lowMoodPercent > 40 && checkins.length >= 5) {
      patterns.push({
        type: 'concern',
        title: 'Frequent Low Moods',
        description: `${Math.round(lowMoodPercent)}% of check-ins show low mood. This pattern deserves attention.`,
        icon: '💙',
        color: '#6366F1',
        actionable: 'Consider a deeper conversation or consulting a professional. See the Resources section.',
      });
    }

    return patterns;
  };

  const patterns = detectPatterns();

  // ============================================
  // MOOD BY TIME OF DAY
  // ============================================

  const getMoodByTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [
      { hour: 6, avgMood: null, count: 0 },  // Morning
      { hour: 12, avgMood: null, count: 0 }, // Afternoon
      { hour: 18, avgMood: null, count: 0 }, // Evening
      { hour: 22, avgMood: null, count: 0 }, // Night
    ];

    slots.forEach((slot, idx) => {
      const nextHour = idx < slots.length - 1 ? slots[idx + 1].hour : 24;
      const slotCheckins = checkins.filter(c => {
        const hour = getHours(new Date(c.createdAt));
        return hour >= slot.hour && hour < nextHour;
      });

      if (slotCheckins.length > 0) {
        slot.avgMood = slotCheckins.reduce((s, c) => s + c.mood, 0) / slotCheckins.length;
        slot.count = slotCheckins.length;
      }
    });

    return slots;
  };

  const timeSlots = getMoodByTimeSlots();
  const timeLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const timeEmojis = ['🌅', '☀️', '🌆', '🌙'];

  // ============================================
  // MOOD BREAKDOWN
  // ============================================

  const getMoodBreakdown = () => {
    const counts = [0, 0, 0, 0, 0];
    checkins.forEach(c => {
      if (c.mood >= 1 && c.mood <= 5) {
        counts[c.mood - 1]++;
      }
    });
    return counts;
  };

  const moodCounts = getMoodBreakdown();
  const totalCheckins = moodCounts.reduce((a, b) => a + b, 0);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analyzing patterns...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSubtitle}>Understanding your teen's patterns</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {checkins.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>Not enough data yet</Text>
            <Text style={styles.emptyText}>
              Insights will appear after your teen starts checking in regularly.
            </Text>
          </View>
        ) : (
          <>
            {/* Patterns */}
            {patterns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Patterns Detected</Text>
                {patterns.map((pattern, i) => (
                  <View key={i} style={[styles.patternCard, { borderLeftColor: pattern.color }]}>
                    <View style={styles.patternHeader}>
                      <Text style={styles.patternIcon}>{pattern.icon}</Text>
                      <Text style={[styles.patternTitle, { color: pattern.color }]}>{pattern.title}</Text>
                    </View>
                    <Text style={styles.patternDesc}>{pattern.description}</Text>
                    {pattern.actionable && (
                      <View style={styles.actionableBox}>
                        <Ionicons name="bulb-outline" size={16} color="#6366F1" />
                        <Text style={styles.actionableText}>{pattern.actionable}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Mood by Time of Day */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Mood by Time of Day</Text>
              <View style={styles.card}>
                <View style={styles.timeGrid}>
                  {timeSlots.map((slot, i) => (
                    <View key={i} style={styles.timeSlot}>
                      <Text style={styles.timeEmoji}>{timeEmojis[i]}</Text>
                      <Text style={styles.timeLabel}>{timeLabels[i]}</Text>
                      {slot.avgMood !== null ? (
                        <>
                          <View style={[
                            styles.timeMoodDot,
                            { backgroundColor: MOOD_EMOJIS[Math.round(slot.avgMood)].color }
                          ]}>
                            <Text style={styles.timeMoodEmoji}>
                              {MOOD_EMOJIS[Math.round(slot.avgMood)].emoji}
                            </Text>
                          </View>
                          <Text style={styles.timeCount}>{slot.count} check-ins</Text>
                        </>
                      ) : (
                        <Text style={styles.timeNoData}>No data</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Mood Distribution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Mood Distribution</Text>
              <View style={styles.card}>
                {[5, 4, 3, 2, 1].map(mood => {
                  const count = moodCounts[mood - 1];
                  const percent = totalCheckins > 0 ? (count / totalCheckins) * 100 : 0;
                  return (
                    <View key={mood} style={styles.moodRow}>
                      <View style={styles.moodLabel}>
                        <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood].emoji}</Text>
                        <Text style={styles.moodName}>{MOOD_EMOJIS[mood].label}</Text>
                      </View>
                      <View style={styles.moodBarContainer}>
                        <View
                          style={[
                            styles.moodBar,
                            {
                              width: `${percent}%`,
                              backgroundColor: MOOD_EMOJIS[mood].color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.moodPercent}>{Math.round(percent)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* What This Means */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 What This Means</Text>
              <View style={styles.card}>
                <View style={styles.tipRow}>
                  <Ionicons name="information-circle" size={20} color="#6366F1" />
                  <Text style={styles.tipText}>
                    <Text style={styles.tipBold}>Normal variation</Text> in mood is healthy. 
                    Teens naturally have more emotional ups and downs than adults — their brains are still developing.
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                  <Text style={styles.tipText}>
                    <Text style={styles.tipBold}>Watch for patterns</Text>, not single bad days. 
                    A rough day is normal. A rough week might need attention.
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons name="heart" size={20} color="#EF4444" />
                  <Text style={styles.tipText}>
                    <Text style={styles.tipBold}>Your awareness matters</Text>. 
                    Just by checking this app, you're showing up for your teen.
                  </Text>
                </View>
              </View>
            </View>

            {/* Privacy Reminder */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={styles.privacyText}>
                You see patterns and trends — never private journal entries or messages.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginTop: -12,
  },
  scrollContent: {
    padding: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#6366F1',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patternCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  patternDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionableBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  actionableText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeSlot: {
    alignItems: 'center',
    flex: 1,
  },
  timeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeMoodDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeMoodEmoji: {
    fontSize: 20,
  },
  timeCount: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  timeNoData: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  moodEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  moodName: {
    fontSize: 12,
    color: '#6B7280',
  },
  moodBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  moodBar: {
    height: '100%',
    borderRadius: 6,
  },
  moodPercent: {
    fontSize: 12,
    color: '#6B7280',
    width: 36,
    textAlign: 'right',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  privacyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
