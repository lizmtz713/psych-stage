import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, Linking, Alert, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SERIOUS_TOPICS, TopicGuide } from '../../data/serious-topics';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'itsme' | 'itsfriend' | 'resources';

export function SeriousTopicsScreen({ navigation }: any) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleResourcePress = (contact: string, type: string) => {
    let url = contact;
    if (type === 'call') {
      url = `tel:${contact.replace(/[^0-9]/g, '')}`;
    } else if (type === 'text') {
      // Extract number and body from "Text X to Y" format
      const match = contact.match(/text\s+(\w+)\s+to\s+(\d+)/i);
      if (match) {
        url = `sms:${match[2]}&body=${match[1]}`;
      }
    } else if (type === 'website') {
      url = contact.startsWith('http') ? contact : `https://${contact}`;
    }
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Hmm', "Couldn't open that. Try again?");
    });
  };

  const renderTopicCard = (topic: TopicGuide) => {
    const isExpanded = expandedTopic === topic.id;

    return (
      <TouchableOpacity
        key={topic.id}
        style={[styles.topicCard, isExpanded && styles.topicCardExpanded]}
        onPress={() => {
          setExpandedTopic(isExpanded ? null : topic.id);
          setActiveTab('overview');
        }}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.topicHeader}>
          <View style={[styles.topicIconBg, { backgroundColor: topic.color + '20' }]}>
            <Text style={styles.topicIcon}>{topic.emoji}</Text>
          </View>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic.name}</Text>
            <Text style={styles.topicTagline}>{topic.tagline}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9CA3AF" 
          />
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Tab Navigation */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
              contentContainerStyle={styles.tabContainer}
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                  overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'itsme' && styles.tabActive]}
                onPress={() => setActiveTab('itsme')}
              >
                <Text style={[styles.tabText, activeTab === 'itsme' && styles.tabTextActive]}>
                  if it's me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'itsfriend' && styles.tabActive]}
                onPress={() => setActiveTab('itsfriend')}
              >
                <Text style={[styles.tabText, activeTab === 'itsfriend' && styles.tabTextActive]}>
                  if it's a friend
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'resources' && styles.tabActive]}
                onPress={() => setActiveTab('resources')}
              >
                <Text style={[styles.tabText, activeTab === 'resources' && styles.tabTextActive]}>
                  get help
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {activeTab === 'overview' && renderOverviewTab(topic)}
              {activeTab === 'itsme' && renderItsMeTab(topic)}
              {activeTab === 'itsfriend' && renderItsFriendTab(topic)}
              {activeTab === 'resources' && renderResourcesTab(topic)}
            </View>

            {/* Quick Coping Technique */}
            <View style={[styles.copingBox, { borderColor: topic.color }]}>
              <Text style={styles.copingTitle}>💡 {topic.copingMoment.name}</Text>
              {topic.copingMoment.steps.map((step, i) => (
                <View key={i} style={styles.copingStep}>
                  <Text style={styles.copingStepNumber}>{i + 1}</Text>
                  <Text style={styles.copingStepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Practice Button */}
            <TouchableOpacity
              style={[styles.practiceButton, { backgroundColor: topic.color }]}
              onPress={() => {
                // Navigate to roleplay with this topic
                navigation.navigate('Roleplay', { topicId: topic.id });
              }}
            >
              <Ionicons name="chatbubbles" size={20} color="#FFF" />
              <Text style={styles.practiceButtonText}>practice conversations</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOverviewTab = (topic: TopicGuide) => (
    <View>
      {/* What It Is */}
      <Text style={styles.sectionTitle}>what it is</Text>
      <Text style={styles.sectionText}>{topic.whatItIs}</Text>

      {/* Warning Signs */}
      <Text style={styles.sectionTitle}>signs to notice</Text>
      <View style={styles.signsList}>
        {topic.warningSigns.slice(0, 6).map((sign, i) => (
          <View key={i} style={styles.signItem}>
            <View style={styles.signBullet} />
            <Text style={styles.signText}>{sign}</Text>
          </View>
        ))}
        {topic.warningSigns.length > 6 && (
          <Text style={styles.moreText}>+ {topic.warningSigns.length - 6} more signs</Text>
        )}
      </View>

      {/* Real Talk */}
      <View style={styles.realTalkBox}>
        <Text style={styles.realTalkLabel}>💬 real talk</Text>
        <Text style={styles.realTalkText}>{topic.realTalk}</Text>
      </View>

      {/* When to Get Help */}
      <Text style={styles.sectionTitle}>when to get help</Text>
      <View style={styles.helpList}>
        {topic.whenToGetHelp.map((item, i) => (
          <View key={i} style={styles.helpItem}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.helpText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderItsMeTab = (topic: TopicGuide) => (
    <View>
      {/* First Steps */}
      <Text style={styles.sectionTitle}>first steps</Text>
      {topic.ifItsYou.firstSteps.map((step, i) => (
        <View key={i} style={styles.numberedItem}>
          <View style={styles.numberCircle}>
            <Text style={styles.numberText}>{i + 1}</Text>
          </View>
          <Text style={styles.numberedText}>{step}</Text>
        </View>
      ))}

      {/* What Helps */}
      <Text style={styles.sectionTitle}>what actually helps</Text>
      <View style={styles.helpfulList}>
        {topic.ifItsYou.whatHelps.map((item, i) => (
          <View key={i} style={styles.helpfulItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.helpfulText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* What Doesn't Help */}
      <Text style={styles.sectionTitle}>what doesn't help</Text>
      <View style={styles.unhelpfulList}>
        {topic.ifItsYou.whatDoesntHelp.map((item, i) => (
          <View key={i} style={styles.unhelpfulItem}>
            <Text style={styles.xmark}>✗</Text>
            <Text style={styles.unhelpfulText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderItsFriendTab = (topic: TopicGuide) => (
    <View>
      {/* How to Help */}
      <Text style={styles.sectionTitle}>how to actually help</Text>
      {topic.ifItsAFriend.howToHelp.map((item, i) => (
        <View key={i} style={styles.helpfulItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.helpfulText}>{item}</Text>
        </View>
      ))}

      {/* What to Say */}
      <Text style={styles.sectionTitle}>things you can say</Text>
      <View style={styles.scriptBox}>
        {topic.ifItsAFriend.whatToSay.map((line, i) => (
          <View key={i} style={styles.scriptItem}>
            <Text style={styles.scriptQuote}>"{line}"</Text>
          </View>
        ))}
      </View>

      {/* What NOT to Say */}
      <Text style={styles.sectionTitle}>don't say this</Text>
      <View style={styles.dontSayBox}>
        {topic.ifItsAFriend.whatNotToSay.map((line, i) => (
          <View key={i} style={styles.dontSayItem}>
            <Ionicons name="close-circle" size={16} color="#DC2626" />
            <Text style={styles.dontSayText}>"{line}"</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderResourcesTab = (topic: TopicGuide) => (
    <View>
      <Text style={styles.resourcesIntro}>
        these are free, confidential, and actually helpful
      </Text>
      {topic.resources.map((resource, i) => (
        <TouchableOpacity
          key={i}
          style={styles.resourceCard}
          onPress={() => handleResourcePress(resource.contact, resource.type)}
          activeOpacity={0.7}
        >
          <View style={styles.resourceIcon}>
            <Ionicons 
              name={resource.type === 'call' ? 'call' : resource.type === 'text' ? 'chatbubble' : 'globe'} 
              size={24} 
              color="#6366F1" 
            />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceName}>{resource.name}</Text>
            <Text style={styles.resourceDesc}>{resource.description}</Text>
            <Text style={styles.resourceContact}>{resource.contact}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>tough stuff</Text>
          <TouchableOpacity onPress={() => setShowSafetyModal(true)}>
            <Ionicons name="shield-checkmark" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>
          real talk about real issues — no judgment, just help
        </Text>
      </LinearGradient>

      {/* Crisis Banner */}
      <TouchableOpacity 
        style={styles.crisisBanner}
        onPress={() => Linking.openURL('tel:988')}
      >
        <Ionicons name="warning" size={18} color="#DC2626" />
        <Text style={styles.crisisText}>
          in crisis right now? <Text style={styles.crisisLink}>call or text 988</Text>
        </Text>
      </TouchableOpacity>

      {/* Topics List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {SERIOUS_TOPICS.map(topic => renderTopicCard(topic))}
        
        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>more coming soon</Text>
          <Text style={styles.comingSoonText}>
            grief & loss • bullying • lgbtq+ • academic pressure • consent
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating SOS */}
      <TouchableOpacity 
        style={styles.floatingSOS}
        onPress={() => Linking.openURL('tel:988')}
      >
        <Text style={styles.floatingSOSText}>SOS</Text>
      </TouchableOpacity>

      {/* Safety Modal */}
      <Modal
        visible={showSafetyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#10B981" />
              <Text style={styles.modalTitle}>your privacy matters</Text>
            </View>
            <Text style={styles.modalText}>
              • no one can see that you looked at this{'\n'}
              • nothing is shared with parents or school{'\n'}
              • your data stays on your device{'\n'}
              • hotlines are confidential{'\n'}
              • you can clear your history anytime
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSafetyModal(false)}
            >
              <Text style={styles.modalButtonText}>got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  // Crisis Banner
  crisisBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#FECACA',
  },
  crisisText: { fontSize: 14, color: '#991B1B' },
  crisisLink: { fontWeight: '700', textDecorationLine: 'underline' },
  
  // Content
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  
  // Topic Card
  topicCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  topicCardExpanded: { paddingBottom: 20 },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  topicIcon: { fontSize: 24 },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  topicTagline: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  // Expanded Content
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  
  // Tabs
  tabScroll: { marginBottom: 16 },
  tabContainer: { gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#FFF' },
  
  // Tab Content
  tabContent: { marginBottom: 16 },
  
  // Section Styles
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 10 },
  sectionText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  
  // Signs List
  signsList: { gap: 8 },
  signItem: { flexDirection: 'row', alignItems: 'flex-start' },
  signBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366F1', marginRight: 10, marginTop: 7 },
  signText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  moreText: { fontSize: 13, color: '#6366F1', fontWeight: '500', marginTop: 4 },
  
  // Real Talk Box
  realTalkBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginTop: 16 },
  realTalkLabel: { fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 8 },
  realTalkText: { fontSize: 14, color: '#065F46', lineHeight: 20 },
  
  // Help List
  helpList: { gap: 10 },
  helpItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  helpText: { flex: 1, fontSize: 14, color: '#DC2626', lineHeight: 20 },
  
  // Numbered Items
  numberedItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  numberCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  numberedText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  
  // Helpful/Unhelpful Lists
  helpfulList: { gap: 8 },
  helpfulItem: { flexDirection: 'row', alignItems: 'flex-start' },
  checkmark: { fontSize: 16, color: '#10B981', marginRight: 10, fontWeight: 'bold' },
  helpfulText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  
  unhelpfulList: { gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14 },
  unhelpfulItem: { flexDirection: 'row', alignItems: 'flex-start' },
  xmark: { fontSize: 16, color: '#DC2626', marginRight: 10, fontWeight: 'bold' },
  unhelpfulText: { flex: 1, fontSize: 14, color: '#7F1D1D', lineHeight: 20 },
  
  // Script Box
  scriptBox: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, gap: 10 },
  scriptItem: {},
  scriptQuote: { fontSize: 14, color: '#4338CA', fontStyle: 'italic', lineHeight: 20 },
  
  // Don't Say Box
  dontSayBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, gap: 10 },
  dontSayItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dontSayText: { flex: 1, fontSize: 14, color: '#7F1D1D', lineHeight: 20 },
  
  // Resources
  resourcesIntro: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  resourceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  resourceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  resourceDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  resourceContact: { fontSize: 13, color: '#6366F1', fontWeight: '500', marginTop: 4 },
  
  // Coping Box
  copingBox: { backgroundColor: '#FEFCE8', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 2 },
  copingTitle: { fontSize: 15, fontWeight: '700', color: '#713F12', marginBottom: 12 },
  copingStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  copingStepNumber: { fontSize: 12, fontWeight: '700', color: '#A16207', backgroundColor: '#FEF9C3', width: 20, height: 20, borderRadius: 10, textAlign: 'center', lineHeight: 20, marginRight: 10 },
  copingStepText: { flex: 1, fontSize: 14, color: '#713F12', lineHeight: 20 },
  
  // Practice Button
  practiceButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 12, marginTop: 16, gap: 8,
  },
  practiceButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Coming Soon
  comingSoon: { alignItems: 'center', paddingVertical: 24 },
  comingSoonTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  comingSoonText: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  
  // Floating SOS
  floatingSOS: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  floatingSOSText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 12 },
  modalText: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
  modalButton: { backgroundColor: '#6366F1', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
