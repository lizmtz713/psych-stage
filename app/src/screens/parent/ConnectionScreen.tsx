import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface Activity {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'thoughtful';
  category: 'quick' | 'quality-time' | 'deep-talk' | 'fun';
  emoji: string;
  tips?: string[];
}

interface WeeklyChallenge {
  id: string;
  week: number;
  title: string;
  description: string;
  tasks: string[];
  reward: string;
  emoji: string;
}

interface ConversationStarter {
  id: string;
  question: string;
  category: 'light' | 'medium' | 'deep';
  followUps: string[];
}

// ============================================
// DATA
// ============================================

const ACTIVITIES: Activity[] = [
  // Quick Connections (5-15 min)
  {
    id: 'morning-text',
    title: 'Good Morning Text',
    description: 'Send a simple encouraging text before they start their day.',
    duration: '1 min',
    difficulty: 'easy',
    category: 'quick',
    emoji: '📱',
    tips: [
      'Keep it light — no pressure',
      'A funny meme works great',
      '"Thinking of you" is enough',
    ],
  },
  {
    id: 'car-chat',
    title: 'Car Time Connection',
    description: 'Use drive time for casual conversation without eye contact pressure.',
    duration: '10-20 min',
    difficulty: 'easy',
    category: 'quick',
    emoji: '🚗',
    tips: [
      'No heavy topics — keep it casual',
      'Let them pick the music sometimes',
      'Silence is okay too',
    ],
  },
  {
    id: 'snack-share',
    title: 'Snack & Share',
    description: 'Grab their favorite snack and sit together for a few minutes.',
    duration: '10 min',
    difficulty: 'easy',
    category: 'quick',
    emoji: '🍿',
    tips: [
      'Don\'t interrogate — just be present',
      'Ask about their day casually',
      'Share something about YOUR day',
    ],
  },
  {
    id: 'meme-exchange',
    title: 'Meme Exchange',
    description: 'Send each other funny memes or videos throughout the day.',
    duration: '5 min',
    difficulty: 'easy',
    category: 'fun',
    emoji: '😂',
    tips: [
      'Follow accounts they find funny',
      'Don\'t try too hard to be cool',
      'Laugh at theirs genuinely',
    ],
  },
  
  // Quality Time (30 min - 2 hrs)
  {
    id: 'cook-together',
    title: 'Cook Together',
    description: 'Make a meal together — their choice of recipe.',
    duration: '45-60 min',
    difficulty: 'medium',
    category: 'quality-time',
    emoji: '👨‍🍳',
    tips: [
      'Let them lead if they want',
      'Focus on the process, not perfection',
      'Chat while you chop',
    ],
  },
  {
    id: 'show-marathon',
    title: 'Watch Their Show',
    description: 'Watch something THEY like, not what you\'d choose.',
    duration: '1-2 hrs',
    difficulty: 'easy',
    category: 'quality-time',
    emoji: '📺',
    tips: [
      'Actually pay attention',
      'Ask questions (but not too many)',
      'Don\'t judge what they like',
    ],
  },
  {
    id: 'game-night',
    title: 'Game Night',
    description: 'Play video games, board games, or card games together.',
    duration: '1-2 hrs',
    difficulty: 'easy',
    category: 'fun',
    emoji: '🎮',
    tips: [
      'Let them teach you',
      'Don\'t get frustrated if you lose',
      'This is about connection, not winning',
    ],
  },
  {
    id: 'walk-talk',
    title: 'Walk & Talk',
    description: 'Take a walk together — movement makes talking easier.',
    duration: '20-40 min',
    difficulty: 'easy',
    category: 'quality-time',
    emoji: '🚶',
    tips: [
      'Side-by-side reduces pressure',
      'Let conversation flow naturally',
      'Appreciate nature together',
    ],
  },
  {
    id: 'learn-together',
    title: 'Learn Something New',
    description: 'Take a class or tutorial together — pottery, coding, language.',
    duration: '1-2 hrs',
    difficulty: 'medium',
    category: 'quality-time',
    emoji: '🎨',
    tips: [
      'Pick something you\'re BOTH new at',
      'Being a beginner together is bonding',
      'Laugh at your mistakes',
    ],
  },
  
  // Deep Connection
  {
    id: 'life-interview',
    title: 'Life Interview',
    description: 'Ask about their dreams, fears, and what matters to them.',
    duration: '30-60 min',
    difficulty: 'thoughtful',
    category: 'deep-talk',
    emoji: '💬',
    tips: [
      'Pick a relaxed moment',
      'Share your own answers too',
      'Listen more than you talk',
      'No advice unless asked',
    ],
  },
  {
    id: 'memory-share',
    title: 'Memory Lane',
    description: 'Look through old photos or videos together and share stories.',
    duration: '30 min',
    difficulty: 'easy',
    category: 'deep-talk',
    emoji: '📸',
    tips: [
      'Let them pick the memories too',
      'Share how you felt at those times',
      'It\'s okay to get emotional',
    ],
  },
  {
    id: 'letter-write',
    title: 'Write Them a Letter',
    description: 'Write a heartfelt letter about what you appreciate about them.',
    duration: '20 min',
    difficulty: 'thoughtful',
    category: 'deep-talk',
    emoji: '✉️',
    tips: [
      'Be specific about what you love',
      'Acknowledge their struggles',
      'No expectations for a response',
    ],
  },
];

const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'no-phone-dinner',
    week: 1,
    title: 'Phone-Free Dinners',
    description: 'Have at least 3 dinners this week where everyone puts phones away.',
    tasks: [
      'Set a "phone basket" for dinner time',
      'Ask one genuine question each meal',
      'Share a highlight from your day',
    ],
    reward: 'Family movie night with their choice of movie',
    emoji: '🍽️',
  },
  {
    id: 'compliment-week',
    week: 2,
    title: 'Compliment Challenge',
    description: 'Give your teen one genuine, specific compliment each day.',
    tasks: [
      'Focus on character, not just achievements',
      'Notice small things they do',
      'Be specific, not generic',
    ],
    reward: 'They pick dinner one night',
    emoji: '💪',
  },
  {
    id: 'listen-week',
    week: 3,
    title: 'Active Listening Week',
    description: 'Practice truly listening without offering advice.',
    tasks: [
      'Ask "Do you want advice or just to vent?"',
      'Repeat back what you heard',
      'Resist the urge to fix',
    ],
    reward: 'Extra screen time on weekend',
    emoji: '👂',
  },
  {
    id: 'adventure-week',
    week: 4,
    title: 'New Experience Week',
    description: 'Try something new together that neither of you has done.',
    tasks: [
      'Brainstorm ideas together',
      'Let them have veto power',
      'Document it with photos',
    ],
    reward: 'Frame a photo from the adventure',
    emoji: '🎯',
  },
];

const CONVERSATION_STARTERS: ConversationStarter[] = [
  // Light
  {
    id: 'best-worst',
    question: "What was the best and worst part of your day?",
    category: 'light',
    followUps: [
      "What made it good/bad?",
      "Did anything surprise you today?",
    ],
  },
  {
    id: 'laugh',
    question: "What made you laugh recently?",
    category: 'light',
    followUps: [
      "Who's the funniest person you know?",
      "What kind of humor do you like?",
    ],
  },
  {
    id: 'weekend',
    question: "If you had this weekend all to yourself, what would you do?",
    category: 'light',
    followUps: [
      "What sounds relaxing right now?",
      "Is there something you wish we did more?",
    ],
  },
  // Medium
  {
    id: 'friends',
    question: "How are things with your friends lately?",
    category: 'medium',
    followUps: [
      "Anyone new you've been hanging out with?",
      "Is there any drama going on?",
      "Who do you feel most yourself around?",
    ],
  },
  {
    id: 'stress',
    question: "What's stressing you out most right now?",
    category: 'medium',
    followUps: [
      "Is there anything I can do to help?",
      "How are you coping with it?",
    ],
  },
  {
    id: 'future',
    question: "What are you excited about coming up?",
    category: 'medium',
    followUps: [
      "What are you nervous about?",
      "Any goals you're working toward?",
    ],
  },
  // Deep
  {
    id: 'change',
    question: "If you could change one thing about your life right now, what would it be?",
    category: 'deep',
    followUps: [
      "What's stopping that from happening?",
      "How can I support you?",
    ],
  },
  {
    id: 'understood',
    question: "Do you feel like people really understand you?",
    category: 'deep',
    followUps: [
      "What do you wish people knew about you?",
      "Is there something I don't understand about you?",
    ],
  },
  {
    id: 'support',
    question: "What's something I do that makes you feel supported? Or not supported?",
    category: 'deep',
    followUps: [
      "How can I be a better parent to you?",
      "What do you need more of from me?",
    ],
  },
];

// ============================================
// COMPONENT
// ============================================

export function ConnectionScreen() {
  const [activeTab, setActiveTab] = useState<'activities' | 'challenges' | 'starters'>('activities');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [currentStarter, setCurrentStarter] = useState<ConversationStarter | null>(null);

  useEffect(() => {
    loadCompletedChallenges();
    shuffleStarter();
  }, []);

  const loadCompletedChallenges = async () => {
    try {
      const saved = await AsyncStorage.getItem('completedChallenges');
      if (saved) setCompletedChallenges(JSON.parse(saved));
    } catch (e) {}
  };

  const toggleChallenge = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = completedChallenges.includes(id)
      ? completedChallenges.filter(c => c !== id)
      : [...completedChallenges, id];
    setCompletedChallenges(updated);
    await AsyncStorage.setItem('completedChallenges', JSON.stringify(updated));
  };

  const shuffleStarter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const random = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
    setCurrentStarter(random);
  };

  const filteredActivities = selectedCategory === 'all'
    ? ACTIVITIES
    : ACTIVITIES.filter(a => a.category === selectedCategory);

  const categoryColors: Record<string, string> = {
    quick: '#10B981',
    'quality-time': '#6366F1',
    'deep-talk': '#EC4899',
    fun: '#F59E0B',
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Connection Hub</Text>
        <Text style={styles.headerSubtitle}>Tools to strengthen your bond</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { id: 'activities', label: 'Activities', icon: 'heart' },
          { id: 'challenges', label: 'Challenges', icon: 'trophy' },
          { id: 'starters', label: 'Talk Ideas', icon: 'chatbubbles' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id as any);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#6366F1' : '#9CA3AF'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ACTIVITIES TAB */}
        {activeTab === 'activities' && (
          <>
            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {[
                { id: 'all', label: 'All', emoji: '✨' },
                { id: 'quick', label: 'Quick', emoji: '⚡' },
                { id: 'quality-time', label: 'Quality Time', emoji: '💜' },
                { id: 'deep-talk', label: 'Deep Talk', emoji: '💬' },
                { id: 'fun', label: 'Fun', emoji: '🎉' },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Activity Cards */}
            {filteredActivities.map(activity => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <View style={styles.activityTags}>
                      <View style={[styles.tag, { backgroundColor: categoryColors[activity.category] + '20' }]}>
                        <Text style={[styles.tagText, { color: categoryColors[activity.category] }]}>
                          {activity.duration}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{activity.difficulty}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.activityDesc}>{activity.description}</Text>
                {activity.tips && (
                  <View style={styles.tipsBox}>
                    <Text style={styles.tipsTitle}>💡 Tips</Text>
                    {activity.tips.map((tip, i) => (
                      <Text key={i} style={styles.tipItem}>• {tip}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <>
            <Text style={styles.sectionIntro}>
              Weekly challenges to build connection habits. Complete tasks, earn rewards! 🎯
            </Text>
            {WEEKLY_CHALLENGES.map(challenge => {
              const isCompleted = completedChallenges.includes(challenge.id);
              return (
                <TouchableOpacity
                  key={challenge.id}
                  style={[styles.challengeCard, isCompleted && styles.challengeCardCompleted]}
                  onPress={() => toggleChallenge(challenge.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                    <View style={styles.challengeMeta}>
                      <Text style={styles.challengeWeek}>Week {challenge.week}</Text>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    </View>
                    <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                      {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                  </View>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  <View style={styles.tasksList}>
                    {challenge.tasks.map((task, i) => (
                      <View key={i} style={styles.taskRow}>
                        <View style={styles.taskBullet} />
                        <Text style={styles.taskText}>{task}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.rewardBox}>
                    <Ionicons name="gift" size={16} color="#F59E0B" />
                    <Text style={styles.rewardText}>Reward: {challenge.reward}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* CONVERSATION STARTERS TAB */}
        {activeTab === 'starters' && (
          <>
            <Text style={styles.sectionIntro}>
              Need help starting a conversation? Swipe for ideas — from light to deep.
            </Text>
            
            {/* Random Starter Card */}
            {currentStarter && (
              <View style={styles.starterCard}>
                <View style={[
                  styles.starterBadge,
                  {
                    backgroundColor:
                      currentStarter.category === 'light' ? '#D1FAE5' :
                      currentStarter.category === 'medium' ? '#FEF3C7' : '#FCE7F3',
                  },
                ]}>
                  <Text style={[
                    styles.starterBadgeText,
                    {
                      color:
                        currentStarter.category === 'light' ? '#059669' :
                        currentStarter.category === 'medium' ? '#D97706' : '#DB2777',
                    },
                  ]}>
                    {currentStarter.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.starterQuestion}>"{currentStarter.question}"</Text>
                <View style={styles.followUps}>
                  <Text style={styles.followUpsTitle}>Follow-up questions:</Text>
                  {currentStarter.followUps.map((f, i) => (
                    <Text key={i} style={styles.followUpItem}>• {f}</Text>
                  ))}
                </View>
                <TouchableOpacity style={styles.shuffleButton} onPress={shuffleStarter}>
                  <Ionicons name="shuffle" size={20} color="#6366F1" />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* All Starters by Category */}
            {(['light', 'medium', 'deep'] as const).map(cat => (
              <View key={cat} style={styles.starterSection}>
                <Text style={styles.starterSectionTitle}>
                  {cat === 'light' ? '🌤️ Light' : cat === 'medium' ? '🌥️ Medium' : '🌧️ Deep'} Questions
                </Text>
                {CONVERSATION_STARTERS.filter(s => s.category === cat).map(starter => (
                  <View key={starter.id} style={styles.miniStarterCard}>
                    <Text style={styles.miniStarterText}>{starter.question}</Text>
                  </View>
                ))}
              </View>
            ))}

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsCardTitle}>💡 Conversation Tips</Text>
              <Text style={styles.tipCardItem}>• Ask when they're relaxed (not right after school)</Text>
              <Text style={styles.tipCardItem}>• Share your own answer first to open up</Text>
              <Text style={styles.tipCardItem}>• Don't jump to advice — just listen</Text>
              <Text style={styles.tipCardItem}>• Accept "I don't know" as a valid answer</Text>
              <Text style={styles.tipCardItem}>• Silence is okay — give them space to think</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#6366F1',
  },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionIntro: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryLabelActive: { color: '#FFF' },
  activityCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  activityMeta: { flex: 1 },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  activityTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  activityDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tipsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  tipItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  challengeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  challengeCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  challengeMeta: { flex: 1 },
  challengeWeek: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  challengeDesc: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  tasksList: { marginBottom: 12 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginRight: 10,
  },
  taskText: {
    fontSize: 13,
    color: '#374151',
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  rewardText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '500',
  },
  starterCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  starterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  starterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  starterQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  followUps: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  followUpsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  followUpItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  shuffleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  starterSection: { marginBottom: 20 },
  starterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  miniStarterCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  miniStarterText: {
    fontSize: 14,
    color: '#374151',
  },
  tipsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  tipsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 12,
  },
  tipCardItem: {
    fontSize: 13,
    color: '#4338CA',
    marginBottom: 6,
  },
});
