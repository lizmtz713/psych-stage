import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, Animated, 
  Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SERIOUS_TOPICS } from '../../data/serious-topics';
import { ROLEPLAY_SCENARIOS, getScenariosByAge, getScenariosByTopic, RoleplayScenario } from '../../data/roleplay-scenarios';
import { AIService, ConversationMessage } from '../../services/AIProviderService';
import { generateFeedback as generateLocalFeedback } from '../../services/RoleplayAIService';
import { ProgressService } from '../../services/ProgressTrackingService';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

// Use imported RoleplayScenario type from data file
type Scenario = RoleplayScenario;

type RoleplayState = 'select' | 'setup' | 'active' | 'feedback';

export function RoleplayScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const topicId = route?.params?.topicId;
  
  const [state, setState] = useState<RoleplayState>('select');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get scenarios based on topic or age
  const scenarios = topicId 
    ? getScenariosByTopic(topicId)
    : getScenariosByAge(user?.age || 15);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state]);

  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setState('setup');
  };

  const beginRoleplay = () => {
    if (!selectedScenario) return;
    
    setState('active');
    setMessages([
      {
        id: '0',
        role: 'system',
        content: `You're talking to: ${selectedScenario.persona}\n${selectedScenario.personaDescription}`,
        timestamp: new Date(),
      },
      {
        id: '1',
        role: 'ai',
        content: selectedScenario.firstMessage,
        timestamp: new Date(),
      },
    ]);
    setTurnCount(0);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedScenario) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputText.trim();
    setInputText('');
    setIsTyping(true);
    const currentTurn = turnCount;
    setTurnCount(prev => prev + 1);

    try {
      // Build conversation history for AI (excluding system messages)
      const conversationHistory: ConversationMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'ai',
          content: m.content,
        }));

      // Call AI Service
      const aiResponse = await AIService.generateResponse({
        scenario: selectedScenario,
        conversationHistory,
        userMessage: messageContent,
        userAge: user?.age || 15,
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      // Check for safety triggers
      if (aiResponse.safetyTriggered) {
        handleSafetyPause();
      }

      // Check if scenario should end (after 6 turns or natural ending)
      if (currentTurn >= 5) {
        setTimeout(() => {
          generateFeedback();
        }, 1500);
      }

      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('AI response error:', error);
      setIsTyping(false);
      
      // Fallback to local response generation
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getFallbackResponse(currentTurn, selectedScenario),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackResponse]);
    }

    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  
  // Fallback when AI service unavailable
  const getFallbackResponse = (turn: number, scenario: Scenario): string => {
    const fallbacks = [
      "I hear what you're saying...",
      "That's a lot to think about.",
      "Can you tell me more?",
      "I appreciate you sharing that.",
      "Let me think about that for a second.",
    ];
    return fallbacks[turn % fallbacks.length];
  };

  const handleSafetyPause = () => {
    Alert.alert(
      "Hey, checking in 💜",
      "What you shared sounds heavy. Want to:\n\n• Keep practicing (it's just roleplay)\n• Get some real resources\n• Take a break",
      [
        { text: "Keep practicing", onPress: () => {} },
        { text: "Show resources", onPress: () => navigation.navigate('Resources') },
        { text: "Take a break", onPress: () => navigation.goBack() },
      ]
    );
  };

  const generateFeedback = async () => {
    if (!selectedScenario) return;

    // Build conversation history
    const conversationHistory: ConversationMessage[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'ai',
        content: m.content,
      }));

    try {
      // Try AI-powered feedback first
      const aiFeedback = await AIService.generateFeedback({
        scenario: selectedScenario,
        conversationHistory,
        userAge: user?.age || 15,
      });

      setFeedbackData({
        strengths: aiFeedback.strengths,
        growthAreas: aiFeedback.growthAreas,
        skillsUsed: selectedScenario.skillsTargeted,
        overallScore: aiFeedback.overallScore,
        suggestion: aiFeedback.suggestion,
        detailedFeedback: aiFeedback.detailedFeedback,
      });
    } catch (error) {
      console.error('AI feedback error:', error);
      
      // Fallback to local feedback generation
      const localFeedback = generateLocalFeedback({
        scenario: selectedScenario,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        turnCount,
        userAge: user?.age || 15,
        hintsUsed: currentHintIndex,
      });

      setFeedbackData({
        strengths: localFeedback.strengths,
        growthAreas: localFeedback.growthAreas,
        skillsUsed: localFeedback.skillsUsed,
        overallScore: localFeedback.overallScore,
        suggestion: localFeedback.suggestion,
      });
    }

    // Record progress and check for achievements
    if (user?.uid && selectedScenario) {
      try {
        const result = await ProgressService.recordCompletion(
          user.uid,
          selectedScenario.id,
          feedbackData?.overallScore || 3,
          turnCount,
          currentHintIndex,
          selectedScenario.skillsTargeted,
          selectedScenario.topicId
        );
        
        if (result.newAchievements.length > 0) {
          setNewAchievements(result.newAchievements);
        }
      } catch (error) {
        console.error('Error recording progress:', error);
      }
    }

    setState('feedback');
  };

  const showHintMessage = async () => {
    if (!selectedScenario) return;
    
    setShowHint(true);
    
    // Build conversation history for contextual hint
    const conversationHistory: ConversationMessage[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'ai',
        content: m.content,
      }));
    
    // Get hint (uses scenario hints with optional AI enhancement)
    const hint = await AIService.generateHint(
      selectedScenario,
      conversationHistory,
      user?.age || 15
    );
    
    const hintMessage: Message = {
      id: `hint-${Date.now()}`,
      role: 'system',
      content: hint,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, hintMessage]);
    setCurrentHintIndex(prev => prev + 1);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // RENDER: Scenario Selection
  const renderScenarioSelection = () => (
    <Animated.View style={[styles.selectionContainer, { opacity: fadeAnim }]}>
      <Text style={styles.selectionTitle}>what do you want to practice?</Text>
      <Text style={styles.selectionSubtitle}>
        {topicId 
          ? `scenarios for ${SERIOUS_TOPICS.find(t => t.id === topicId)?.name.toLowerCase()}`
          : 'popular scenarios for your age'
        }
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {scenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={styles.scenarioCard}
            onPress={() => startScenario(scenario)}
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
            <Text style={styles.scenarioDesc}>{scenario.description}</Text>
            <View style={styles.scenarioMeta}>
              <Text style={styles.scenarioPersona}>
                You'll talk to: {scenario.persona}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </Animated.View>
  );

  // RENDER: Setup Screen
  const renderSetup = () => (
    <Animated.View style={[styles.setupContainer, { opacity: fadeAnim }]}>
      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>{selectedScenario?.title}</Text>
        <Text style={styles.setupDesc}>{selectedScenario?.description}</Text>
        
        <View style={styles.setupSection}>
          <Text style={styles.setupLabel}>you're practicing with:</Text>
          <View style={styles.personaBox}>
            <Ionicons name="person-circle" size={40} color="#6366F1" />
            <View style={styles.personaInfo}>
              <Text style={styles.personaName}>{selectedScenario?.persona}</Text>
              <Text style={styles.personaDesc}>{selectedScenario?.personaDescription}</Text>
            </View>
          </View>
        </View>

        <View style={styles.setupSection}>
          <Text style={styles.setupLabel}>skills you'll practice:</Text>
          <View style={styles.skillsRow}>
            {selectedScenario?.skillsTargeted.map((skill, i) => (
              <View key={i} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.setupTips}>
          <Text style={styles.tipsTitle}>💡 tips:</Text>
          <Text style={styles.tipsText}>
            • respond naturally, like you actually would{'\n'}
            • it's okay to mess up — that's why we practice{'\n'}
            • tap the hint button if you get stuck{'\n'}
            • you can end anytime
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={beginRoleplay}>
        <Text style={styles.startButtonText}>start practicing</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setState('select')}>
        <Text style={styles.backLinkText}>← choose different scenario</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // RENDER: Active Chat
  const renderActiveChat = () => (
    <KeyboardAvoidingView 
      style={styles.chatContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "End practice?",
            "You can get feedback on what you've practiced so far.",
            [
              { text: "Keep going", style: "cancel" },
              { text: "Get feedback", onPress: generateFeedback },
              { text: "Exit", onPress: () => navigation.goBack(), style: "destructive" },
            ]
          );
        }}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <Text style={styles.chatHeaderName}>{selectedScenario?.persona}</Text>
          <Text style={styles.chatHeaderSub}>roleplay • {turnCount} turns</Text>
        </View>
        <TouchableOpacity onPress={showHintMessage}>
          <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageBubble,
              msg.role === 'user' && styles.userBubble,
              msg.role === 'ai' && styles.aiBubble,
              msg.role === 'system' && styles.systemBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.role === 'user' && styles.userText,
              msg.role === 'system' && styles.systemText,
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { animationDelay: '0s' }]} />
              <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
              <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="what would you say?"
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? '#FFF' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // RENDER: Feedback
  const renderFeedback = () => (
    <Animated.View style={[styles.feedbackContainer, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackEmoji}>
            {feedbackData?.overallScore >= 4 ? '🌟' : feedbackData?.overallScore >= 3 ? '👍' : '💪'}
          </Text>
          <Text style={styles.feedbackTitle}>
            {feedbackData?.overallScore >= 4 ? 'great job!' : feedbackData?.overallScore >= 3 ? 'nice work!' : 'good practice!'}
          </Text>
          <Text style={styles.feedbackSubtitle}>here's what I noticed</Text>
        </View>

        {/* Strengths */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>✨ what you did well</Text>
          {feedbackData?.strengths.map((strength: string, i: number) => (
            <View key={i} style={styles.feedbackItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.feedbackItemText}>{strength}</Text>
            </View>
          ))}
        </View>

        {/* Growth Areas */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>🌱 something to try</Text>
          {feedbackData?.growthAreas.map((area: string, i: number) => (
            <View key={i} style={styles.feedbackItem}>
              <Ionicons name="arrow-forward-circle" size={18} color="#F59E0B" />
              <Text style={styles.feedbackItemText}>{area}</Text>
            </View>
          ))}
        </View>

        {/* Suggestion */}
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionLabel}>💡 next time, try:</Text>
          <Text style={styles.suggestionText}>{feedbackData?.suggestion}</Text>
        </View>

        {/* Skills */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>skills practiced</Text>
          <View style={styles.skillsRow}>
            {feedbackData?.skillsUsed.map((skill: string, i: number) => (
              <View key={i} style={styles.skillTagGreen}>
                <Text style={styles.skillTagGreenText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* New Achievements */}
        {newAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.achievementsTitle}>🎉 new achievement{newAchievements.length > 1 ? 's' : ''}!</Text>
            {newAchievements.map((achievement, i) => (
              <View key={i} style={styles.achievementCard}>
                <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.feedbackActions}>
          <TouchableOpacity 
            style={styles.tryAgainButton}
            onPress={() => {
              setMessages([]);
              setTurnCount(0);
              setNewAchievements([]);
              setState('setup');
            }}
          >
            <Ionicons name="refresh" size={20} color="#6366F1" />
            <Text style={styles.tryAgainText}>try again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.newScenarioButton}
            onPress={() => {
              setSelectedScenario(null);
              setMessages([]);
              setTurnCount(0);
              setFeedbackData(null);
              setNewAchievements([]);
              setState('select');
            }}
          >
            <Text style={styles.newScenarioText}>new scenario</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>done for now</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {state === 'select' && 'practice'}
            {state === 'setup' && 'get ready'}
            {state === 'active' && 'roleplay'}
            {state === 'feedback' && 'feedback'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Content */}
      {state === 'select' && renderScenarioSelection()}
      {state === 'setup' && renderSetup()}
      {state === 'active' && renderActiveChat()}
      {state === 'feedback' && renderFeedback()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  
  // Selection
  selectionContainer: { flex: 1, padding: 20 },
  selectionTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  selectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  
  // Scenario Card
  scenarioCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  scenarioTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 10 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  difficultyBeginner: { backgroundColor: '#D1FAE5' },
  difficultyIntermediate: { backgroundColor: '#FEF3C7' },
  difficultyAdvanced: { backgroundColor: '#FEE2E2' },
  difficultyText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  scenarioDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  scenarioMeta: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  scenarioPersona: { fontSize: 13, color: '#6366F1', fontWeight: '500' },
  
  // Setup
  setupContainer: { flex: 1, padding: 20 },
  setupCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 20 },
  setupTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  setupDesc: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 20 },
  setupSection: { marginBottom: 20 },
  setupLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  personaBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12 },
  personaInfo: { marginLeft: 12, flex: 1 },
  personaName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  personaDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  skillTagText: { fontSize: 13, color: '#6366F1', fontWeight: '500' },
  setupTips: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  tipsText: { fontSize: 14, color: '#78350F', lineHeight: 22 },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1', borderRadius: 14, padding: 16, gap: 8,
  },
  startButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  backLink: { alignItems: 'center', marginTop: 16 },
  backLinkText: { fontSize: 14, color: '#6B7280' },
  
  // Chat
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  chatHeaderCenter: { alignItems: 'center' },
  chatHeaderName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  chatHeaderSub: { fontSize: 12, color: '#6B7280' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '80%', borderRadius: 18, padding: 14, marginBottom: 10 },
  userBubble: { backgroundColor: '#6366F1', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  systemBubble: { backgroundColor: '#FEF3C7', alignSelf: 'center', maxWidth: '90%', borderRadius: 12 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#1F2937' },
  userText: { color: '#FFF' },
  systemText: { color: '#92400E', fontSize: 13, fontStyle: 'italic' },
  typingIndicator: { flexDirection: 'row', gap: 4, padding: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100, marginRight: 10,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#E5E7EB' },
  
  // Feedback
  feedbackContainer: { flex: 1, padding: 20 },
  feedbackHeader: { alignItems: 'center', marginBottom: 24 },
  feedbackEmoji: { fontSize: 48, marginBottom: 8 },
  feedbackTitle: { fontSize: 26, fontWeight: '700', color: '#1F2937' },
  feedbackSubtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  feedbackSection: { marginBottom: 20 },
  feedbackSectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  feedbackItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  feedbackItemText: { flex: 1, fontSize: 15, color: '#4B5563', lineHeight: 22 },
  suggestionBox: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 18, marginBottom: 20 },
  suggestionLabel: { fontSize: 14, fontWeight: '600', color: '#4338CA', marginBottom: 8 },
  suggestionText: { fontSize: 15, color: '#3730A3', lineHeight: 22 },
  skillTagGreen: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  skillTagGreenText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  feedbackActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  tryAgainButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, gap: 8,
  },
  tryAgainText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
  newScenarioButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1', borderRadius: 12, padding: 14, gap: 8,
  },
  newScenarioText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  doneButton: { alignItems: 'center', marginTop: 20 },
  doneButtonText: { fontSize: 15, color: '#6B7280' },
  
  // Achievements
  achievementsSection: { 
    backgroundColor: '#FEF3C7', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  achievementsTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#92400E', 
    marginBottom: 12,
    textAlign: 'center',
  },
  achievementCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFBEB', 
    padding: 12, 
    borderRadius: 12,
    marginBottom: 8,
  },
  achievementEmoji: { fontSize: 32, marginRight: 12 },
  achievementInfo: { flex: 1 },
  achievementName: { fontSize: 16, fontWeight: '600', color: '#78350F' },
  achievementDesc: { fontSize: 13, color: '#92400E', marginTop: 2 },
});
