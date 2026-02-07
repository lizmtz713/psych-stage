import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SPECIALIZED_TRACKS, getSpecializedScenariosByTrack, SpecializedTrack } from '../../data/specialized-tracks';
import { RoleplayScenario } from '../../data/roleplay-scenarios';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export function SpecializedTracksScreen({ navigation }: any) {
  const { user } = useAuth();
  const userAge = user?.age || 16;
  const [selectedTrack, setSelectedTrack] = useState<SpecializedTrack | null>(null);
  const [trackScenarios, setTrackScenarios] = useState<RoleplayScenario[]>([]);

  const handleTrackSelect = (track: SpecializedTrack) => {
    if (track.scenarioCount === 0) {
      // Coming soon
      return;
    }
    setSelectedTrack(track);
    const scenarios = getSpecializedScenariosByTrack(track.id, userAge);
    setTrackScenarios(scenarios);
  };

  const handleScenarioSelect = (scenario: RoleplayScenario) => {
    navigation.navigate('Roleplay', { scenarioId: scenario.id });
  };

  const renderTrackList = () => (
    <View style={styles.trackListContainer}>
      <Text style={styles.sectionTitle}>choose your track</Text>
      <Text style={styles.sectionSubtitle}>
        specialized scenarios for specific experiences
      </Text>
      
      <View style={styles.tracksGrid}>
        {SPECIALIZED_TRACKS.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackCard,
              track.scenarioCount === 0 && styles.trackCardDisabled
            ]}
            onPress={() => handleTrackSelect(track)}
            activeOpacity={track.scenarioCount === 0 ? 1 : 0.7}
          >
            <Text style={styles.trackEmoji}>{track.emoji}</Text>
            <Text style={styles.trackName}>{track.name}</Text>
            <Text style={styles.trackDesc} numberOfLines={2}>
              {track.description}
            </Text>
            {track.scenarioCount > 0 ? (
              <View style={styles.trackMeta}>
                <Text style={styles.trackCount}>
                  {track.scenarioCount} scenarios
                </Text>
              </View>
            ) : (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>coming soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderScenarioList = () => (
    <View style={styles.scenarioListContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setSelectedTrack(null)}
      >
        <Ionicons name="arrow-back" size={20} color="#6366F1" />
        <Text style={styles.backButtonText}>all tracks</Text>
      </TouchableOpacity>
      
      <View style={styles.trackHeader}>
        <Text style={styles.trackHeaderEmoji}>{selectedTrack?.emoji}</Text>
        <View>
          <Text style={styles.trackHeaderName}>{selectedTrack?.name}</Text>
          <Text style={styles.trackHeaderCount}>
            {trackScenarios.length} scenarios for your age
          </Text>
        </View>
      </View>

      {trackScenarios.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No scenarios available for your age range yet.
          </Text>
        </View>
      ) : (
        <View style={styles.scenariosList}>
          {trackScenarios.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.scenarioCard}
              onPress={() => handleScenarioSelect(scenario)}
              activeOpacity={0.7}
            >
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                <View style={[
                  styles.difficultyBadge,
                  scenario.difficulty === 'beginner' && styles.difficultyBeginner,
                  scenario.difficulty === 'intermediate' && styles.difficultyIntermediate,
                  scenario.difficulty === 'advanced' && styles.difficultyAdvanced,
                ]}>
                  <Text style={styles.difficultyText}>{scenario.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.scenarioDesc} numberOfLines={2}>
                {scenario.description}
              </Text>
              <View style={styles.scenarioMeta}>
                <Text style={styles.scenarioPersona}>
                  Practice with: {scenario.persona}
                </Text>
                <View style={styles.skillsPreview}>
                  {scenario.skillsTargeted.slice(0, 2).map((skill, i) => (
                    <View key={i} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                  {scenario.skillsTargeted.length > 2 && (
                    <Text style={styles.moreSkills}>
                      +{scenario.skillsTargeted.length - 2}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>specialized tracks</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSub}>
          roleplay scenarios for specific life experiences
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTrack ? renderScenarioList() : renderTrackList()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  
  // Content
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  
  // Track List
  trackListContainer: {},
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  
  tracksGrid: { gap: 12 },
  trackCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  trackCardDisabled: { opacity: 0.6 },
  trackEmoji: { fontSize: 32, marginBottom: 8 },
  trackName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  trackDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  trackMeta: { flexDirection: 'row', alignItems: 'center' },
  trackCount: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  comingSoonBadge: { 
    alignSelf: 'flex-start', backgroundColor: '#F3F4F6', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 
  },
  comingSoonText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  
  // Scenario List
  scenarioListContainer: {},
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  backButtonText: { fontSize: 15, color: '#6366F1', fontWeight: '500' },
  
  trackHeader: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  trackHeaderEmoji: { fontSize: 40, marginRight: 16 },
  trackHeaderName: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  trackHeaderCount: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  
  scenariosList: { gap: 12 },
  scenarioCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  scenarioTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 10 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  difficultyBeginner: { backgroundColor: '#D1FAE5' },
  difficultyIntermediate: { backgroundColor: '#FEF3C7' },
  difficultyAdvanced: { backgroundColor: '#FEE2E2' },
  difficultyText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  scenarioDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  scenarioMeta: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  scenarioPersona: { fontSize: 13, color: '#6366F1', fontWeight: '500', marginBottom: 8 },
  skillsPreview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  skillChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillChipText: { fontSize: 11, color: '#6366F1', fontWeight: '500' },
  moreSkills: { fontSize: 11, color: '#9CA3AF' },
  
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});
