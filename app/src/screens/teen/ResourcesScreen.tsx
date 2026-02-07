import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CRISIS_RESOURCES = [
  {
    name: '988 crisis line',
    description: 'call or text 988 — free & 24/7',
    action: 'tel:988',
    icon: '📞',
  },
  {
    name: 'crisis text line',
    description: 'text HOME to 741741',
    action: 'sms:741741&body=HOME',
    icon: '💬',
  },
  {
    name: 'trevor project',
    description: 'lgbtq+ support — 1-866-488-7386',
    action: 'tel:18664887386',
    icon: '🏳️‍🌈',
  },
  {
    name: 'teen line',
    description: 'teens helping teens — text TEEN to 839863',
    action: 'sms:839863&body=TEEN',
    icon: '💜',
  },
];

const COPING_TOOLS = [
  {
    title: 'box breathing',
    description: 'breathe in 4s, hold 4s, out 4s, hold 4s — actually works fr',
    icon: '🫁',
    interactive: true,
    action: 'breathing',
  },
  {
    title: '5-4-3-2-1 grounding',
    description: '5 things you see, 4 hear, 3 touch, 2 smell, 1 taste',
    icon: '🌿',
    interactive: true,
    action: 'grounding',
  },
  {
    title: 'ice cube reset',
    description: 'hold ice — sounds weird but it snaps you out of spiraling',
    icon: '🧊',
    interactive: true,
    action: 'ice',
  },
  {
    title: 'brain dump',
    description: 'write everything in your head. don\'t think, just write.',
    icon: '✍️',
    interactive: true,
    action: 'journal',
  },
  {
    title: 'move your body',
    description: 'dance it out, stretch, walk — get out of your head',
    icon: '🏃',
    interactive: true,
    action: 'move',
  },
];

const REAL_TALK = [
  "it's okay to not be okay",
  "your feelings are valid. all of them.",
  "you don't owe anyone an explanation",
  "taking space isn't selfish, it's self-care",
  "bad days don't mean bad life",
  "asking for help is lowkey brave",
];

const AFFIRMATIONS = [
  "you're doing better than you think",
  "this feeling? temporary. you? built different.",
  "it's giving... survivor energy",
  "you've gotten through 100% of your worst days",
  "main character vibes only ✨",
];

export function ResourcesScreen({ navigation }: any) {
  const handleCrisisLink = (action: string) => {
    Linking.openURL(action).catch(() => {
      Alert.alert('hmm', 'couldn\'t open that. try again?');
    });
  };

  const handleToolPress = (tool: any) => {
    if (!tool.interactive) return;
    
    switch (tool.action) {
      case 'breathing':
        navigation.navigate('Breathing');
        break;
      case 'grounding':
        navigation.navigate('Grounding');
        break;
      case 'ice':
        Alert.alert(
          '🧊 ice cube reset',
          'Grab an ice cube and hold it in your hand.\n\n' +
          'Focus on the cold sensation. Notice how it feels as it melts.\n\n' +
          'This activates your nervous system and helps break the spiral.\n\n' +
          'Hold it for 30-60 seconds or until you feel more grounded.',
          [{ text: 'i\'ll try it', style: 'default' }]
        );
        break;
      case 'journal':
        navigation.navigate('Journal');
        break;
      case 'move':
        Alert.alert(
          '🏃 move your body',
          'Pick one:\n\n' +
          '💃 Dance to ONE song (no skipping)\n' +
          '🚶 Walk around the block\n' +
          '🧘 Stretch for 2 minutes\n' +
          '🦘 10 jumping jacks\n' +
          '🤸 Shake your whole body for 30 sec\n\n' +
          'Movement releases stuck energy. Trust the process.',
          [{ text: 'let\'s go', style: 'default' }]
        );
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <Text style={styles.header}>resources 💜</Text>
        <Text style={styles.subheader}>you're not alone in this</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SOS Section */}
        <View style={styles.sosSection}>
          <Text style={styles.sosTitle}>🆘 need help rn?</Text>
          <Text style={styles.sosSubtitle}>these are free, confidential, and actually helpful</Text>
          {CRISIS_RESOURCES.map((resource, i) => (
            <TouchableOpacity
              key={i}
              style={styles.crisisCard}
              onPress={() => handleCrisisLink(resource.action)}
              activeOpacity={0.7}
            >
              <Text style={styles.crisisIcon}>{resource.icon}</Text>
              <View style={styles.crisisInfo}>
                <Text style={styles.crisisName}>{resource.name}</Text>
                <Text style={styles.crisisDesc}>{resource.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#DC2626" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Affirmation */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationLabel}>✨ daily reminder</Text>
          <Text style={styles.affirmationText}>
            "{AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length]}"
          </Text>
        </View>

        {/* Coping Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>when you're struggling</Text>
          {COPING_TOOLS.map((tool, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.toolCard, tool.interactive && styles.toolCardInteractive]}
              onPress={() => handleToolPress(tool)}
              disabled={!tool.interactive}
              activeOpacity={tool.interactive ? 0.7 : 1}
            >
              <Text style={styles.toolIcon}>{tool.icon}</Text>
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDesc}>{tool.description}</Text>
              </View>
              {tool.interactive && (
                <View style={styles.tryBadge}>
                  <Text style={styles.tryBadgeText}>try it</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Real Talk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>real talk</Text>
          <View style={styles.realTalkCard}>
            {REAL_TALK.map((tip, i) => (
              <View key={i} style={styles.realTalkRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.realTalkText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          <Text style={styles.safetyText}>
            btw — no one can see that you looked at this. your privacy matters.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating SOS Button */}
      <TouchableOpacity 
        style={styles.floatingSOS}
        onPress={() => handleCrisisLink('tel:988')}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingSOSText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  header: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  subheader: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 20, marginTop: -10 },
  // SOS
  sosSection: {
    backgroundColor: '#FEF2F2', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  sosTitle: { fontSize: 20, fontWeight: '700', color: '#DC2626', marginBottom: 4 },
  sosSubtitle: { fontSize: 14, color: '#991B1B', marginBottom: 16 },
  crisisCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 14, borderRadius: 14, marginBottom: 10,
  },
  crisisIcon: { fontSize: 24, marginRight: 14 },
  crisisInfo: { flex: 1 },
  crisisName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  crisisDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  // Affirmation
  affirmationCard: {
    backgroundColor: '#EEF2FF', borderRadius: 20, padding: 24, marginBottom: 24, alignItems: 'center',
  },
  affirmationLabel: { fontSize: 13, color: '#6366F1', fontWeight: '600', marginBottom: 8 },
  affirmationText: { fontSize: 20, color: '#4338CA', fontStyle: 'italic', textAlign: 'center', lineHeight: 28 },
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  // Tools
  toolCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  toolCardInteractive: { borderWidth: 2, borderColor: '#6366F1', backgroundColor: '#F5F3FF' },
  toolIcon: { fontSize: 28, marginRight: 14 },
  toolInfo: { flex: 1 },
  toolTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  toolDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  tryBadge: { backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tryBadgeText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  // Real Talk
  realTalkCard: { backgroundColor: '#ECFDF5', padding: 20, borderRadius: 16 },
  realTalkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkmark: { fontSize: 16, color: '#10B981', marginRight: 12, fontWeight: 'bold', marginTop: 1 },
  realTalkText: { fontSize: 15, color: '#065F46', flex: 1, lineHeight: 22 },
  // Safety
  safetyNote: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  safetyText: { fontSize: 13, color: '#6B7280', marginLeft: 10, flex: 1 },
  // Floating SOS
  floatingSOS: {
    position: 'absolute', bottom: 100, right: 20,
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  floatingSOSText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
