import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getEmotionGuide, EmotionGuide } from '../../data/emotions';

const { width } = Dimensions.get('window');

export function EmotionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { emotionId } = route.params as { emotionId: string };
  const emotion = getEmotionGuide(emotionId);
  
  const [expandedSection, setExpandedSection] = useState<string | null>('meet');

  if (!emotion) {
    return (
      <View style={styles.container}>
        <Text>Emotion not found</Text>
      </View>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const Section = ({ 
    id, 
    icon, 
    title, 
    children 
  }: { 
    id: string; 
    icon: string; 
    title: string; 
    children: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.section}
      onPress={() => toggleSection(id)}
      activeOpacity={0.8}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons 
          name={expandedSection === id ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#6B7280" 
        />
      </View>
      {expandedSection === id && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={emotion.gradient} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.emoji}>{emotion.emoji}</Text>
        <Text style={styles.name}>{emotion.name}</Text>
        <Text style={styles.tagline}>"{emotion.tagline}"</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meet the Feeling */}
        <Section id="meet" icon="👋" title="meet the feeling">
          <Text style={styles.bodyText}>{emotion.whatItIs}</Text>
          <View style={styles.divider} />
          <Text style={styles.subHeader}>why it exists</Text>
          <Text style={styles.bodyText}>{emotion.whyItExists}</Text>
        </Section>

        {/* Brain Science */}
        <Section id="brain" icon="🧠" title="what's happening in your brain">
          <Text style={styles.bodyText}>{emotion.brainScience.whatsHappening}</Text>
          <View style={styles.funFactBox}>
            <Text style={styles.funFactLabel}>🤓 fun fact</Text>
            <Text style={styles.funFactText}>{emotion.brainScience.funFact}</Text>
          </View>
        </Section>

        {/* Superpower */}
        <Section id="superpower" icon="💪" title="its superpower">
          <Text style={styles.bodyText}>{emotion.superpower}</Text>
        </Section>

        {/* Body Signals */}
        <Section id="body" icon="📍" title="how it shows up in your body">
          {emotion.bodySignals.map((signal, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{signal}</Text>
            </View>
          ))}
        </Section>

        {/* Warning Signs */}
        <Section id="warning" icon="⚠️" title="when it's too much">
          {emotion.warningSignals.map((signal, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{signal}</Text>
            </View>
          ))}
          <View style={styles.helpBox}>
            <Text style={styles.helpText}>
              if these sound like you, talking to someone can help 💜
            </Text>
          </View>
        </Section>

        {/* What Helps */}
        <Section id="coping" icon="🛠️" title="what helps">
          {emotion.copingTips.map((tip, i) => (
            <View key={i} style={styles.tipItem}>
              <Text style={styles.tipNumber}>{i + 1}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Section>

        {/* Inside Out Moment */}
        <Section id="insideout" icon="🎬" title="inside out moment">
          <Text style={styles.bodyText}>{emotion.insideOutMoment}</Text>
        </Section>

        {/* Quick Technique */}
        <View style={[styles.section, styles.techniqueSection]}>
          <LinearGradient 
            colors={emotion.gradient} 
            style={styles.techniqueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.techniqueLabel}>try this rn</Text>
            <Text style={styles.techniqueName}>{emotion.quickTechnique.name}</Text>
            <Text style={styles.techniqueDuration}>⏱️ {emotion.quickTechnique.duration}</Text>
            
            {emotion.quickTechnique.steps.map((step, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    padding: 18,
    paddingTop: 0,
  },
  bodyText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  funFactBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  funFactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  funFactText: {
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#6366F1',
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  helpBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  techniqueSection: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  techniqueGradient: {
    borderRadius: 16,
    padding: 24,
  },
  techniqueLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  techniqueName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  techniqueDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
  },
});
