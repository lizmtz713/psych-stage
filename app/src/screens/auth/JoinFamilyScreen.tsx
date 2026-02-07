import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export function JoinFamilyScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter your family code');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // Find family by invite code
      const q = query(
        collection(db, 'families'),
        where('inviteCode', '==', code.trim().toUpperCase())
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        Alert.alert('Not Found', 'No family found with that code. Check with your parent!');
        setLoading(false);
        return;
      }

      const family = snap.docs[0];
      const familyData = family.data();

      // Update user with family ID
      await updateUser({ familyId: family.id });

      Alert.alert(
        'Welcome! 💜',
        `You've joined ${familyData.name}!`,
        [{ text: 'Let\'s Go!' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not join family. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>👨‍👩‍👧</Text>
          <Text style={styles.title}>Join Your Family</Text>
          <Text style={styles.subtitle}>
            Ask your parent for the family invite code
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Family Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-letter code"
            placeholderTextColor="#9CA3AF"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Joining...' : 'Join Family'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why join a family?</Text>
          <Text style={styles.infoText}>
            When you join, your parent can see how you're doing (just the vibes, not your private notes). 
            It helps them know when you might need support.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 24 },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: '#6366F1', fontWeight: '500' },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  form: { backgroundColor: '#FFF', borderRadius: 16, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16,
    fontSize: 24, fontWeight: '600', color: '#1F2937', textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#6366F1', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  buttonDisabled: { backgroundColor: '#C7D2FE' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginTop: 24,
  },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#4338CA', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6366F1', lineHeight: 20 },
});
