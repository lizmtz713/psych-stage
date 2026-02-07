import React, { useState } from 'react';
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
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface Article {
  id: string;
  title: string;
  emoji: string;
  category: 'brain-science' | 'emotions' | 'communication' | 'warning-signs' | 'self-care';
  readTime: string;
  content: ArticleSection[];
  keyTakeaways: string[];
}

interface ArticleSection {
  heading?: string;
  text: string;
}

// ============================================
// ARTICLES DATA
// ============================================

const ARTICLES: Article[] = [
  {
    id: 'teen-brain',
    title: 'Why Teens Act Like Teens',
    emoji: '🧠',
    category: 'brain-science',
    readTime: '4 min',
    content: [
      {
        heading: 'The Teenage Brain is Under Construction',
        text: "Your teen's brain is undergoing massive renovation. The prefrontal cortex — responsible for decision-making, impulse control, and understanding consequences — isn't fully developed until around age 25."
      },
      {
        heading: 'Emotions Run the Show',
        text: "The amygdala (emotion center) is fully active in teens, but the prefrontal cortex (logical thinking) is still catching up. This means teens FEEL things intensely but may struggle to regulate those feelings."
      },
      {
        heading: 'Risk-Taking is Biological',
        text: "The reward system in a teen's brain is hyperactive. Exciting or risky activities produce more dopamine for them than for adults. This isn't defiance — it's brain chemistry."
      },
      {
        heading: 'Sleep Patterns Shift',
        text: "Melatonin release shifts later during adolescence. Your teen genuinely can't fall asleep as early as they used to. They need 8-10 hours of sleep but often get far less."
      },
    ],
    keyTakeaways: [
      "Emotional reactions aren't personal attacks",
      "Patience is key — their brain is literally still developing",
      "Risk-taking is normal (but still needs boundaries)",
      "Sleep schedules aren't just laziness",
    ],
  },
  {
    id: 'mood-swings',
    title: 'Mood Swings vs. Warning Signs',
    emoji: '🎭',
    category: 'emotions',
    readTime: '5 min',
    content: [
      {
        heading: 'Normal Teen Emotions',
        text: "Mood swings are developmentally appropriate. Hormonal changes, brain development, and social pressures all contribute. A bad day, a fight with a friend, or a poor grade can feel catastrophic to them — and that's actually normal."
      },
      {
        heading: "What's Concerning",
        text: "Watch for PATTERNS, not single incidents. Concerning signs include: persistent sadness (2+ weeks), withdrawal from ALL activities they used to enjoy, changes in sleep/appetite, talk of hopelessness, or giving away possessions."
      },
      {
        heading: 'The Difference',
        text: "Normal: Mood changes day to day, still engages in some activities, bounce-back happens.\n\nConcerning: Persistent low mood, complete withdrawal, no bounce-back, changes seem dramatic and sustained."
      },
      {
        heading: 'When to Seek Help',
        text: "Trust your gut. You know your teen. If something feels different — really different — it's worth talking to a professional. A therapist can assess whether what you're seeing is typical or needs support."
      },
    ],
    keyTakeaways: [
      "Mood swings alone aren't cause for alarm",
      "Look for PATTERNS over time, not single bad days",
      "Trust your instincts as a parent",
      "Getting help early is always better",
    ],
  },
  {
    id: 'talking-to-teens',
    title: 'How to Talk So Teens Listen',
    emoji: '💬',
    category: 'communication',
    readTime: '4 min',
    content: [
      {
        heading: "Don't Start with Questions",
        text: "Instead of interrogating ('How was school?'), try sharing first ('My day was crazy because...'). This takes pressure off and models opening up."
      },
      {
        heading: 'Timing Matters',
        text: "Don't corner them after school when they're depleted. Car rides, late evenings, and while doing activities together are often better times. Side-by-side is less intimidating than face-to-face."
      },
      {
        heading: 'Listen More Than You Talk',
        text: "When they do open up, resist the urge to fix, lecture, or share your opinion. Use phrases like 'Tell me more' and 'That sounds hard.' They need to feel heard before they can hear you."
      },
      {
        heading: "Ask Permission Before Advising",
        text: "'Do you want my thoughts or do you just need to vent?' This shows respect and often they'll actually ask for advice when they're ready."
      },
    ],
    keyTakeaways: [
      "Share first, ask questions second",
      "Time and place matter a lot",
      "Listen 80%, talk 20%",
      "Ask before giving advice",
    ],
  },
  {
    id: 'social-media',
    title: 'Social Media & Teen Mental Health',
    emoji: '📱',
    category: 'warning-signs',
    readTime: '5 min',
    content: [
      {
        heading: "It's Complicated",
        text: "Social media isn't all bad. It helps teens maintain friendships, find communities, and express themselves. But it can also contribute to comparison, FOMO, cyberbullying, and sleep disruption."
      },
      {
        heading: 'Warning Signs',
        text: "Watch for: mood drops after phone use, constant checking, distress about likes/comments, hiding their phone when you approach, or significantly less in-person socializing."
      },
      {
        heading: 'Approach with Curiosity',
        text: "Instead of banning outright (which often backfires), have conversations. Ask what they like about their favorite apps. Follow some of the same accounts. Understand their world."
      },
      {
        heading: 'Set Boundaries Together',
        text: "Co-create rules rather than imposing them. Discuss: screens out of bedrooms at night, phone-free meals, earning screen time. They're more likely to follow rules they helped make."
      },
    ],
    keyTakeaways: [
      "Social media has pros AND cons",
      "Watch for mood changes tied to phone use",
      "Be curious, not judgmental",
      "Collaborative rules work better",
    ],
  },
  {
    id: 'parent-selfcare',
    title: "Taking Care of You, Too",
    emoji: '💚',
    category: 'self-care',
    readTime: '3 min',
    content: [
      {
        heading: "You Can't Pour from an Empty Cup",
        text: "Parenting a teen is exhausting. The worry, the conflicts, the uncertainty. You need support too. Your emotional health directly impacts your ability to show up for your teen."
      },
      {
        heading: 'Common Parent Feelings',
        text: "It's normal to feel: rejected, confused, scared, nostalgic for when they were little, uncertain if you're doing it right. You are not alone in any of this."
      },
      {
        heading: 'What Helps',
        text: "Talk to other parents of teens. Consider therapy for yourself. Maintain your own friendships and interests. Remember that their pulling away is developmentally appropriate, not personal rejection."
      },
      {
        heading: 'The Long Game',
        text: "Your relationship with your teen will evolve. The closeness often comes back in their 20s. What you're building now is the foundation for that adult relationship. It's worth the work."
      },
    ],
    keyTakeaways: [
      "Your feelings are valid",
      "Get support — you need it too",
      "Their distance isn't rejection",
      "The relationship evolves; stay patient",
    ],
  },
  {
    id: 'crisis-signs',
    title: 'When to Get Help Immediately',
    emoji: '🚨',
    category: 'warning-signs',
    readTime: '3 min',
    content: [
      {
        heading: 'Take These Seriously',
        text: "ANY mention of suicide or self-harm should be taken seriously, even if it seems like a 'joke.' Other urgent signs: giving away meaningful possessions, saying goodbye in unusual ways, sudden calmness after depression."
      },
      {
        heading: 'How to Ask',
        text: "It's okay to ask directly: 'Are you thinking about hurting yourself?' Asking does NOT put the idea in their head. It shows you care and opens the door for honest conversation."
      },
      {
        heading: 'What to Do',
        text: "Stay calm. Listen without judgment. Don't leave them alone if you're concerned about immediate safety. Remove access to means if possible. Call a crisis line or go to an ER if needed."
      },
      {
        heading: 'Crisis Resources',
        text: "988 Suicide & Crisis Lifeline (call or text 988)\nCrisis Text Line (text HOME to 741741)\nThese are available 24/7 for you OR your teen."
      },
    ],
    keyTakeaways: [
      "Take all mentions of suicide seriously",
      "It's okay to ask directly",
      "Stay calm, stay present",
      "988 is available 24/7",
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics', emoji: '📚' },
  { id: 'brain-science', label: 'Brain Science', emoji: '🧠' },
  { id: 'emotions', label: 'Emotions', emoji: '🎭' },
  { id: 'communication', label: 'Communication', emoji: '💬' },
  { id: 'warning-signs', label: 'Warning Signs', emoji: '⚠️' },
  { id: 'self-care', label: 'Self-Care', emoji: '💚' },
];

// ============================================
// COMPONENT
// ============================================

export function LearnScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredArticles = selectedCategory === 'all'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCategory);

  const toggleArticle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Understanding your teen better</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat.id);
              }}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Fact Box */}
        <View style={styles.factBox}>
          <Text style={styles.factIcon}>💡</Text>
          <View style={styles.factContent}>
            <Text style={styles.factTitle}>Did You Know?</Text>
            <Text style={styles.factText}>
              The teenage brain produces more dopamine during risk-taking than adult brains. 
              It's not bad behavior — it's biology.
            </Text>
          </View>
        </View>

        {/* Articles */}
        {filteredArticles.map(article => (
          <View key={article.id} style={styles.articleCard}>
            <TouchableOpacity
              style={styles.articleHeader}
              onPress={() => toggleArticle(article.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.articleEmoji}>{article.emoji}</Text>
              <View style={styles.articleMeta}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleReadTime}>{article.readTime} read</Text>
              </View>
              <Ionicons
                name={expandedArticle === article.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {expandedArticle === article.id && (
              <View style={styles.articleBody}>
                {article.content.map((section, i) => (
                  <View key={i} style={styles.section}>
                    {section.heading && (
                      <Text style={styles.sectionHeading}>{section.heading}</Text>
                    )}
                    <Text style={styles.sectionText}>{section.text}</Text>
                  </View>
                ))}

                {/* Key Takeaways */}
                <View style={styles.takeawaysBox}>
                  <Text style={styles.takeawaysTitle}>📌 Key Takeaways</Text>
                  {article.keyTakeaways.map((takeaway, i) => (
                    <View key={i} style={styles.takeawayRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.takeawayText}>{takeaway}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Expert Resources */}
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>📖 Recommended Reading</Text>
          <View style={styles.resourceCard}>
            <Text style={styles.resourceName}>"The Teenage Brain"</Text>
            <Text style={styles.resourceAuthor}>by Frances E. Jensen, MD</Text>
          </View>
          <View style={styles.resourceCard}>
            <Text style={styles.resourceName}>"Untangled"</Text>
            <Text style={styles.resourceAuthor}>by Lisa Damour, PhD</Text>
          </View>
          <View style={styles.resourceCard}>
            <Text style={styles.resourceName}>"How to Talk So Teens Will Listen"</Text>
            <Text style={styles.resourceAuthor}>by Adele Faber & Elaine Mazlish</Text>
          </View>
        </View>

        {/* Crisis Resources */}
        <View style={styles.crisisBox}>
          <View style={styles.crisisHeader}>
            <Ionicons name="call" size={24} color="#EF4444" />
            <Text style={styles.crisisTitle}>Crisis Resources</Text>
          </View>
          <View style={styles.crisisRow}>
            <Text style={styles.crisisLabel}>Suicide & Crisis Lifeline</Text>
            <Text style={styles.crisisNumber}>988</Text>
          </View>
          <View style={styles.crisisRow}>
            <Text style={styles.crisisLabel}>Crisis Text Line</Text>
            <Text style={styles.crisisNumber}>Text HOME to 741741</Text>
          </View>
          <Text style={styles.crisisNote}>Available 24/7 — for you or your teen</Text>
        </View>

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
  content: { flex: 1 },
  scrollContent: { padding: 16 },
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
  factBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  factIcon: { fontSize: 28 },
  factContent: { flex: 1 },
  factTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 4,
  },
  factText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  articleCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  articleEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  articleMeta: { flex: 1 },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  articleReadTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  articleBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  takeawaysBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  takeawaysTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 10,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  takeawayText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  resourcesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  resourceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resourceAuthor: {
    fontSize: 12,
    color: '#6B7280',
  },
  crisisBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  crisisTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
  },
  crisisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  crisisLabel: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  crisisNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  crisisNote: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 8,
  },
});
