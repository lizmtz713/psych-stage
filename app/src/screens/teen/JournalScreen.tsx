import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const JOURNAL_PROMPTS = [
  "what's living in your head rent free?",
  "anything making you smile lately?",
  "what's draining your energy rn?",
  "who's been there for you this week?",
  "what do you wish people understood about you?",
  "what would make tomorrow better?",
  "what's something you're proud of?",
  "any tea you need to spill?",
];

export function JournalScreen() {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prompt] = useState(() => 
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  );

  const handleSave = async () => {
    if (!entry.trim() || !user) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'journals'), {
        userId: user.id,
        text: entry.trim(),
        createdAt: serverTimestamp(),
      });
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setEntry('');
      }, 2000);
    } catch (error) {
      Alert.alert('oop', 'couldn\'t save that. try again?');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.container}>
        <View style={styles.savedContainer}>
          <Text style={styles.savedEmoji}>✨</Text>
          <Text style={styles.savedTitle}>saved!</Text>
          <Text style={styles.savedSub}>your thoughts are safe with us</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>your space 📔</Text>
          <Text style={styles.subheader}>write whatever. no judgment.</Text>
          
          {/* Prompt Card */}
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>try this prompt:</Text>
            <Text style={styles.promptText}>"{prompt}"</Text>
          </View>

          {/* Journal Input */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.journalInput}
              placeholder="let it out..."
              placeholderTextColor="rgba(0,0,0,0.3)"
              multiline
              value={entry}
              onChangeText={setEntry}
              maxLength={2000}
            />
            <Text style={styles.charCount}>{entry.length}/2000</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, !entry.trim() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!entry.trim() || saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveText}>
              {saving ? 'saving...' : 'save entry ✓'}
            </Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <View style={styles.privacyBox}>
            <Text style={styles.privacyIcon}>🔐</Text>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>this is just for you</Text>
              <Text style={styles.privacyText}>
                fr fr — parents will NEVER see what you write here. not the words, not the vibes, nothing. this is your space.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  header: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subheader: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 24 },
  promptCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  promptLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 18, color: '#FFF', fontStyle: 'italic', lineHeight: 26 },
  inputCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  journalInput: {
    fontSize: 17, color: '#1F2937', minHeight: 180, textAlignVertical: 'top', lineHeight: 26,
  },
  charCount: { textAlign: 'right', color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  saveButton: {
    backgroundColor: '#FFF', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  saveButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.3)' },
  saveText: { fontSize: 18, fontWeight: '700', color: '#6366F1' },
  privacyBox: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    padding: 16, marginTop: 24,
  },
  privacyIcon: { fontSize: 28, marginRight: 14 },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  privacyText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  // Saved state
  savedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  savedEmoji: { fontSize: 80 },
  savedTitle: { fontSize: 32, fontWeight: '700', color: '#FFF', marginTop: 20 },
  savedSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
});
