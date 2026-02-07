import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Evidence-based developmental psychology content
const AGE_GUIDES: Record<string, { title: string; normal: string[]; watchFor: string[]; tip: string }> = {
  '12-14': {
    title: 'Early Adolescence (12-14)',
    normal: [
      'Mood swings and emotional intensity — their brain is rewiring',
      'Pulling away from parents — this is healthy individuation',
      'Caring intensely about peer opinions',
      'Testing boundaries and rules',
      'Increased privacy needs',
      'Sleep pattern changes (wanting to stay up late)',
    ],
    watchFor: [
      'Complete social withdrawal (no friends at all)',
      'Giving away prized possessions',
      'Talking about being a burden',
      'Dramatic changes in eating or sleeping',
      'Self-harm marks or references',
    ],
    tip: "At this age, they need you to be a steady presence. Don't take rejection personally — they're practicing independence while still needing your safety net."
  },
  '15-17': {
    title: 'Middle Adolescence (15-17)',
    normal: [
      'Identity exploration (changing styles, interests, friend groups)',
      'Questioning family values and beliefs',
      'Intense romantic feelings',
      'Risk-taking behavior (their brain literally can\'t assess risk like adults)',
      'Strong emotional reactions that seem disproportionate',
      'Wanting more independence in decisions',
    ],
    watchFor: [
      'Persistent sadness lasting more than 2 weeks',
      'Loss of interest in ALL activities they used to enjoy',
      'Expressing hopelessness about the future',
      'Substance use beyond experimentation',
      'Risky behavior that endangers their life',
    ],
    tip: "They need you to listen more than advise. When they share, resist the urge to fix — often they just need to feel heard."
  },
  '18-19': {
    title: 'Late Adolescence (18-19)',
    normal: [
      'Reconsidering career and life goals',
      'Re-approaching parents as more of equals',
      'Concern about the future and their place in the world',
      'Deeper, more stable friendships',
      'Better impulse control (but still developing)',
      'May still need more support than they admit',
    ],
    watchFor: [
      'Inability to function in daily life',
      'Severe anxiety about normal activities',
      'Complete avoidance of future planning',
      'Isolation from all relationships',
    ],
    tip: "Support their autonomy while staying available. They're almost adults but still benefit from knowing you're there when needed."
  }
};

const RESPONSE_GUIDES = [
  {
    situation: "They're withdrawn and won't talk",
    wrong: "Why won't you talk to me? What's wrong with you?",
    better: "I'm here whenever you're ready. No pressure.",
    why: "Pressure to talk often backfires. Teens open up when they feel safe, not cornered."
  },
  {
    situation: "They're angry or snapping at you",
    wrong: "Don't talk to me like that! Show some respect!",
    better: "I can see you're upset. I'm going to give you some space, and we can talk when things are calmer.",
    why: "Their prefrontal cortex (logic center) goes offline when emotions are high. Wait for calm."
  },
  {
    situation: "They seem sad or low",
    wrong: "You have nothing to be sad about. Other kids have it worse.",
    better: "It seems like you're going through something hard. Want to talk, or just want company?",
    why: "Dismissing feelings teaches them to hide emotions. Validation opens doors."
  },
  {
    situation: "They made a mistake",
    wrong: "I told you this would happen! You never listen!",
    better: "That sounds really hard. What do you think you might do differently next time?",
    why: "They already feel bad. Shaming doesn't teach — it just damages trust."
  },
  {
    situation: "They're anxious about something",
    wrong: "Just calm down, it's not a big deal.",
    better: "That sounds stressful. What's the worst case scenario? Let's think through it together.",
    why: "Anxiety can't be reasoned away, but feeling heard and problem-solving together helps."
  },
  {
    situation: "They're spending too much time alone",
    wrong: "You need to get out more! This isn't healthy!",
    better: "I've noticed you've been spending more time in your room. Everything okay?",
    why: "Some alone time is normal. Gentle curiosity works better than criticism."
  },
];

const WARNING_SIGNS = {
  immediate: [
    'Talking about wanting to die or kill themselves',
    'Looking for ways to harm themselves',
    'Talking about feeling hopeless or having no reason to live',
    'Talking about being a burden to others',
    'Giving away important possessions',
  ],
  concerning: [
    'Withdrawal from friends and activities',
    'Changes in eating or sleeping patterns',
    'Increased anger or irritability',
    'Reckless or risky behavior',
    'Increased substance use',
    'Declining school performance',
    'Loss of interest in things they used to enjoy',
  ]
};

export function GuidanceScreen() {
  const [selectedAge, setSelectedAge] = useState('15-17');
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);

  const ageGuide = AGE_GUIDES[selectedAge];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <Text style={styles.header}>Parent Guide</Text>
        <Text style={styles.subheader}>Understanding your teen</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Age Selector */}
        <View style={styles.ageSelector}>
          {Object.keys(AGE_GUIDES).map((age) => (
            <TouchableOpacity
              key={age}
              style={[styles.ageButton, selectedAge === age && styles.ageButtonSelected]}
              onPress={() => setSelectedAge(age)}
            >
              <Text style={[styles.ageButtonText, selectedAge === age && styles.ageButtonTextSelected]}>
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age Guide */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{ageGuide.title}</Text>
          
          <Text style={styles.sectionLabel}>✅ What's Normal</Text>
          {ageGuide.normal.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}

          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color="#059669" />
            <Text style={styles.tipText}>{ageGuide.tip}</Text>
          </View>
        </View>

        {/* Response Guide */}
        <Text style={styles.sectionTitle}>How to Respond</Text>
        <Text style={styles.sectionSub}>Tap for better approaches</Text>

        {RESPONSE_GUIDES.map((guide, i) => (
          <TouchableOpacity
            key={i}
            style={styles.responseCard}
            onPress={() => setExpandedResponse(expandedResponse === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.responseHeader}>
              <Text style={styles.responseSituation}>{guide.situation}</Text>
              <Ionicons 
                name={expandedResponse === i ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#6B7280" 
              />
            </View>
            
            {expandedResponse === i && (
              <View style={styles.responseExpanded}>
                <View style={styles.responseRow}>
                  <Text style={styles.responseLabel}>❌ Avoid:</Text>
                  <Text style={styles.responseWrong}>"{guide.wrong}"</Text>
                </View>
                <View style={styles.responseRow}>
                  <Text style={styles.responseLabel}>✅ Try:</Text>
                  <Text style={styles.responseBetter}>"{guide.better}"</Text>
                </View>
                <Text style={styles.responseWhy}>💡 {guide.why}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Warning Signs */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ When to Seek Help</Text>
          
          <Text style={styles.warningSection}>Get help immediately if they:</Text>
          {WARNING_SIGNS.immediate.map((sign, i) => (
            <View key={i} style={styles.warningRow}>
              <Text style={styles.warningDot}>🔴</Text>
              <Text style={styles.warningText}>{sign}</Text>
            </View>
          ))}

          <Text style={[styles.warningSection, { marginTop: 16 }]}>Watch for these patterns:</Text>
          {WARNING_SIGNS.concerning.map((sign, i) => (
            <View key={i} style={styles.warningRow}>
              <Text style={styles.warningDot}>🟡</Text>
              <Text style={styles.warningText}>{sign}</Text>
            </View>
          ))}

          <View style={styles.crisisBox}>
            <Text style={styles.crisisText}>
              If you're concerned, trust your instincts. Call 988 (Suicide & Crisis Lifeline) for guidance — they help parents too.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  header: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subheader: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 20, marginTop: -10 },
  // Age Selector
  ageSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  ageButton: {
    flex: 1, backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  ageButtonSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  ageButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  ageButtonTextSelected: { color: '#6366F1' },
  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#059669', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { fontSize: 16, color: '#6B7280', marginRight: 10, marginTop: 2 },
  bulletText: { fontSize: 15, color: '#4B5563', flex: 1, lineHeight: 22 },
  tipBox: {
    flexDirection: 'row', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginTop: 16,
  },
  tipText: { fontSize: 14, color: '#065F46', flex: 1, marginLeft: 12, lineHeight: 20 },
  // Section
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  sectionSub: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  // Response Cards
  responseCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  responseSituation: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  responseExpanded: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  responseRow: { marginBottom: 12 },
  responseLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  responseWrong: { fontSize: 15, color: '#DC2626', fontStyle: 'italic' },
  responseBetter: { fontSize: 15, color: '#059669', fontStyle: 'italic' },
  responseWhy: { fontSize: 14, color: '#6366F1', marginTop: 8, lineHeight: 20 },
  // Warning Card
  warningCard: {
    backgroundColor: '#FEF2F2', borderRadius: 20, padding: 24, marginTop: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  warningTitle: { fontSize: 18, fontWeight: '700', color: '#DC2626', marginBottom: 16 },
  warningSection: { fontSize: 14, fontWeight: '600', color: '#991B1B', marginBottom: 10 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  warningDot: { fontSize: 12, marginRight: 10, marginTop: 2 },
  warningText: { fontSize: 14, color: '#7F1D1D', flex: 1, lineHeight: 20 },
  crisisBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 16 },
  crisisText: { fontSize: 14, color: '#991B1B', lineHeight: 20 },
});
