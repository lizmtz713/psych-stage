import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const STEPS = [
  { count: 5, sense: 'SEE', emoji: '👀', prompt: 'things you can see right now', color: '#8B5CF6' },
  { count: 4, sense: 'HEAR', emoji: '👂', prompt: 'things you can hear', color: '#6366F1' },
  { count: 3, sense: 'TOUCH', emoji: '✋', prompt: 'things you can physically feel', color: '#3B82F6' },
  { count: 2, sense: 'SMELL', emoji: '👃', prompt: 'things you can smell', color: '#10B981' },
  { count: 1, sense: 'TASTE', emoji: '👅', prompt: 'thing you can taste', color: '#F59E0B' },
];

export function GroundingScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([[], [], [], [], []]);
  const [currentInput, setCurrentInput] = useState('');
  const [completed, setCompleted] = useState(false);

  const step = STEPS[currentStep];
  const currentAnswers = answers[currentStep];
  const remainingCount = step.count - currentAnswers.length;

  const addAnswer = () => {
    if (!currentInput.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newAnswers = [...answers];
    newAnswers[currentStep] = [...currentAnswers, currentInput.trim()];
    setAnswers(newAnswers);
    setCurrentInput('');

    // Check if step is complete
    if (newAnswers[currentStep].length >= step.count) {
      setTimeout(() => {
        if (currentStep < 4) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCurrentStep(currentStep + 1);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCompleted(true);
        }
      }, 300);
    }
  };

  if (completed) {
    return (
      <LinearGradient colors={['#10B981', '#059669']} style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedEmoji}>🌿</Text>
          <Text style={styles.completedTitle}>you're grounded</Text>
          <Text style={styles.completedSubtitle}>
            take a deep breath. you're here, you're present, you're okay.
          </Text>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>what you noticed:</Text>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>{s.emoji}</Text>
                <Text style={styles.summaryText}>
                  {answers[i].join(', ')}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>i feel better 💜</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[step.color, step.color + 'CC']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            {STEPS.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.progressDot,
                  i < currentStep && styles.progressDotComplete,
                  i === currentStep && styles.progressDotCurrent,
                ]} 
              />
            ))}
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Step */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>{step.emoji}</Text>
            <Text style={styles.stepCount}>{step.count}</Text>
            <Text style={styles.stepSense}>{step.sense}</Text>
          </View>

          <Text style={styles.prompt}>
            name {remainingCount} {step.prompt}
          </Text>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentAnswers.map((answer, i) => (
              <View key={i} style={styles.answerChip}>
                <Text style={styles.answerText}>{answer}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              </View>
            ))}
          </View>

          {/* Input */}
          {remainingCount > 0 && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={`what do you ${step.sense.toLowerCase()}?`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={currentInput}
                onChangeText={setCurrentInput}
                onSubmitEditing={addAnswer}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.addButton, !currentInput.trim() && styles.addButtonDisabled]}
                onPress={addAnswer}
                disabled={!currentInput.trim()}
              >
                <Ionicons name="add" size={24} color={step.color} />
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 stuck?</Text>
            {step.sense === 'SEE' && (
              <Text style={styles.tipsText}>look around slowly — colors, shapes, movement, light</Text>
            )}
            {step.sense === 'HEAR' && (
              <Text style={styles.tipsText}>close your eyes — distant sounds, close sounds, your breathing</Text>
            )}
            {step.sense === 'TOUCH' && (
              <Text style={styles.tipsText}>your feet on the ground, clothes on skin, phone in hand</Text>
            )}
            {step.sense === 'SMELL' && (
              <Text style={styles.tipsText}>air, your shampoo, food nearby, anything faint</Text>
            )}
            {step.sense === 'TASTE' && (
              <Text style={styles.tipsText}>coffee, gum, toothpaste, even just your mouth</Text>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotComplete: {
    backgroundColor: '#FFF',
  },
  progressDotCurrent: {
    backgroundColor: '#FFF',
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepCount: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 80,
  },
  stepSense: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 4,
  },
  prompt: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  answersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    justifyContent: 'center',
  },
  answerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  answerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 8,
    marginBottom: 32,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#FFF',
    fontSize: 18,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  tipsContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  tipsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
  },
  // Completed
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  summaryTitle: {
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  summaryText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '700',
  },
});
