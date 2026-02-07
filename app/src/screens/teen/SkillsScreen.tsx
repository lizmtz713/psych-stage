import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DidYouKnowInline } from '../../components/DidYouKnow';

const { width } = Dimensions.get('window');

interface Skill {
  id: string;
  name: string;
  duration: string;
  category: 'calm' | 'mood' | 'thoughts' | 'connect';
  icon: string;
  description: string;
  steps: string[];
  science: string;
}

const SKILLS: Skill[] = [
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    duration: '2 min',
    category: 'calm',
    icon: '🫁',
    description: 'calm your nervous system fast',
    steps: [
      'Breathe in for 4 seconds',
      'Hold for 4 seconds',
      'Breathe out for 4 seconds',
      'Hold for 4 seconds',
      'Repeat 4 times'
    ],
    science: 'Slows your heart rate and activates your parasympathetic nervous system (rest & digest mode)'
  },
  {
    id: '54321-grounding',
    name: '5-4-3-2-1 Grounding',
    duration: '2 min',
    category: 'calm',
    icon: '🌿',
    description: 'get out of your head and into the present',
    steps: [
      'Name 5 things you can SEE',
      'Name 4 things you can TOUCH',
      'Name 3 things you can HEAR',
      'Name 2 things you can SMELL',
      'Name 1 thing you can TASTE'
    ],
    science: 'Redirects your brain from anxious thoughts to sensory input, breaking the anxiety loop'
  },
  {
    id: 'opposite-action',
    name: 'Opposite Action',
    duration: '5 min',
    category: 'mood',
    icon: '🔄',
    description: 'when emotions tell you to do something unhelpful',
    steps: [
      'Notice the urge (e.g., "I want to isolate")',
      'Ask: "Is this helpful right now?"',
      'If no, do the OPPOSITE (e.g., text a friend)',
      'Notice how you feel after'
    ],
    science: 'DBT skill — emotions come with action urges, but we can choose different actions that change how we feel'
  },
  {
    id: 'thought-defusion',
    name: 'Thought Defusion',
    duration: '2 min',
    category: 'thoughts',
    icon: '💭',
    description: 'create distance from negative thoughts',
    steps: [
      'Notice the thought (e.g., "I\'m a failure")',
      'Add "I\'m having the thought that..." in front',
      'Say it out loud: "I\'m having the thought that I\'m a failure"',
      'Notice: the thought is just words, not facts'
    ],
    science: 'ACT technique — helps you see thoughts as mental events, not truths you have to believe'
  },
  {
    id: 'self-compassion',
    name: 'Self-Compassion Break',
    duration: '3 min',
    category: 'mood',
    icon: '💜',
    description: 'treat yourself like you\'d treat a friend',
    steps: [
      'Say: "This is a moment of struggle" (acknowledge it)',
      'Say: "Struggle is part of being human" (you\'re not alone)',
      'Put hand on heart, say: "May I be kind to myself"',
      'Ask: "What do I need right now?"'
    ],
    science: 'Self-compassion reduces cortisol (stress hormone) and increases oxytocin (connection hormone)'
  },
  {
    id: 'behavioral-activation',
    name: 'Tiny Action',
    duration: '5 min',
    category: 'mood',
    icon: '⚡',
    description: 'when you don\'t feel like doing anything',
    steps: [
      'Pick ONE tiny thing (make bed, drink water, step outside)',
      'Don\'t think, just do it for 2 minutes',
      'Notice any shift in energy',
      'Optional: do one more tiny thing'
    ],
    science: 'Behavioral activation — action creates motivation, not the other way around'
  },
  {
    id: 'worry-time',
    name: 'Worry Dump',
    duration: '5 min',
    category: 'thoughts',
    icon: '📝',
    description: 'get the anxious thoughts out of your head',
    steps: [
      'Set a 5-minute timer',
      'Write down EVERY worry (don\'t censor)',
      'When timer ends, close the note',
      'Tell yourself: "I\'ve acknowledged these. I can come back later."'
    ],
    science: 'Externalizing worries reduces rumination and frees up mental space'
  },
  {
    id: 'social-connection',
    name: 'Micro-Connection',
    duration: '2 min',
    category: 'connect',
    icon: '👋',
    description: 'when loneliness hits',
    steps: [
      'Pick ONE person (friend, family, anyone)',
      'Send a simple message: "hey, thinking of you" or a meme',
      'Don\'t expect a response — you did your part',
      'Notice: you reached out. That took courage.'
    ],
    science: 'Even small social connections release oxytocin and reduce feelings of isolation'
  },
];

const CATEGORIES = [
  { id: 'all', label: 'all', icon: '✨' },
  { id: 'calm', label: 'calm down', icon: '😌' },
  { id: 'mood', label: 'lift mood', icon: '🌈' },
  { id: 'thoughts', label: 'manage thoughts', icon: '💭' },
  { id: 'connect', label: 'feel less alone', icon: '💜' },
];

export function SkillsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [skillUsage, setSkillUsage] = useState<Record<string, number>>({});
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [justTriedSkill, setJustTriedSkill] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'skillUsage', user.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSkillUsage(docSnap.data() as Record<string, number>);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const trackUsage = async (skillId: string, category: Skill['category']) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'skillUsage', user.id);
      await setDoc(docRef, { [skillId]: increment(1) }, { merge: true });
      setSkillUsage(prev => ({ ...prev, [skillId]: (prev[skillId] || 0) + 1 }));
      setJustTriedSkill(skillId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredSkills = selectedCategory === 'all' 
    ? SKILLS 
    : SKILLS.filter(s => s.category === selectedCategory);

  const totalUsage = Object.values(skillUsage).reduce((a, b) => a + b, 0);
  const favoriteSkill = Object.entries(skillUsage).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>coping skills</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSub}>2-5 minute exercises that actually work</Text>
        
        {totalUsage > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{totalUsage}</Text>
              <Text style={styles.statLabel}>times used</Text>
            </View>
            {favoriteSkill && (
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{SKILLS.find(s => s.id === favoriteSkill[0])?.icon}</Text>
                <Text style={styles.statLabel}>your go-to</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSkills.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            style={styles.skillCard}
            onPress={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
            activeOpacity={0.8}
          >
            <View style={styles.skillHeader}>
              <Text style={styles.skillIcon}>{skill.icon}</Text>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillDesc}>{skill.description}</Text>
              </View>
              <View style={styles.skillMeta}>
                <Text style={styles.skillDuration}>{skill.duration}</Text>
                {skillUsage[skill.id] > 0 && (
                  <Text style={styles.skillUsed}>used {skillUsage[skill.id]}x</Text>
                )}
              </View>
            </View>

            {expandedSkill === skill.id && (
              <View style={styles.skillExpanded}>
                <Text style={styles.stepsTitle}>how to do it:</Text>
                {skill.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

                <View style={styles.scienceBox}>
                  <Text style={styles.scienceLabel}>🧠 why it works:</Text>
                  <Text style={styles.scienceText}>{skill.science}</Text>
                </View>

                {justTriedSkill === skill.id ? (
                  <>
                    <View style={styles.triedConfirm}>
                      <Text style={styles.triedConfirmText}>✓ nice work!</Text>
                    </View>
                    <DidYouKnowInline skillCategory={skill.category} />
                  </>
                ) : (
                  <TouchableOpacity 
                    style={styles.tryButton}
                    onPress={() => trackUsage(skill.id, skill.category)}
                  >
                    <Text style={styles.tryButtonText}>i tried this ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  categoryScroll: { maxHeight: 56 },
  categoryContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  categoryChipSelected: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  categoryLabelSelected: { color: '#FFF' },
  content: { flex: 1, padding: 16 },
  skillCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  skillHeader: { flexDirection: 'row', alignItems: 'center' },
  skillIcon: { fontSize: 32, marginRight: 14 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  skillDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  skillMeta: { alignItems: 'flex-end' },
  skillDuration: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  skillUsed: { fontSize: 11, color: '#10B981', marginTop: 2 },
  skillExpanded: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  stepsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumberText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  stepText: { flex: 1, fontSize: 15, color: '#1F2937', lineHeight: 22 },
  scienceBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginTop: 12 },
  scienceLabel: { fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 4 },
  scienceText: { fontSize: 13, color: '#065F46', lineHeight: 18 },
  tryButton: { backgroundColor: '#6366F1', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  tryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  triedConfirm: { backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  triedConfirmText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
