import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface SafetyPlan {
  warningSigns: string[];
  copingStrategies: string[];
  distractions: string[];
  peopleToCall: { name: string; phone: string }[];
  professionalHelp: { name: string; phone: string }[];
  safeEnvironment: string[];
  reasonsToLive: string[];
}

const DEFAULT_PLAN: SafetyPlan = {
  warningSigns: [],
  copingStrategies: [],
  distractions: [],
  peopleToCall: [],
  professionalHelp: [{ name: '988 Crisis Line', phone: '988' }],
  safeEnvironment: [],
  reasonsToLive: [],
};

const PROMPTS = {
  warningSigns: {
    title: "my warning signs",
    subtitle: "how do you know when you're starting to spiral?",
    placeholder: "e.g., can't sleep, isolating, negative thoughts loop",
    examples: ["racing thoughts", "wanting to be alone", "not eating", "feeling numb", "snapping at people"],
  },
  copingStrategies: {
    title: "things that help me",
    subtitle: "what's worked before when you felt low?",
    placeholder: "e.g., going for a walk, listening to music",
    examples: ["breathing exercises", "cold shower", "journaling", "going outside", "watching comfort show"],
  },
  distractions: {
    title: "healthy distractions",
    subtitle: "things that take your mind off it",
    placeholder: "e.g., playing guitar, drawing, gaming",
    examples: ["playing with pet", "cooking", "cleaning room", "calling a friend", "watching videos"],
  },
  peopleToCall: {
    title: "people i can reach out to",
    subtitle: "who can you text or call when you need support?",
    placeholder: "Name",
    examples: [],
  },
  safeEnvironment: {
    title: "making my space safe",
    subtitle: "things to remove or change when you're struggling",
    placeholder: "e.g., put away sharp objects, stay with someone",
    examples: ["stay in common areas", "give meds to parent", "remove triggers from room"],
  },
  reasonsToLive: {
    title: "reasons to keep going",
    subtitle: "what matters to you? what are you looking forward to?",
    placeholder: "e.g., my dog, graduation, seeing my friends",
    examples: ["my pet", "future goals", "people who love me", "things I want to experience", "music/art I want to create"],
  },
};

export function SafetyPlanScreen({ navigation }: any) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SafetyPlan>(DEFAULT_PLAN);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [user]);

  const loadPlan = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'safetyPlans', user.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPlan({ ...DEFAULT_PLAN, ...docSnap.data() as SafetyPlan });
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const savePlan = async (updatedPlan: SafetyPlan) => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'safetyPlans', user.id), updatedPlan);
      setPlan(updatedPlan);
    } catch (error) {
      Alert.alert('oops', 'couldn\'t save. try again?');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (section: keyof SafetyPlan) => {
    if (!newItem.trim()) return;
    const updated = { ...plan, [section]: [...(plan[section] as string[]), newItem.trim()] };
    savePlan(updated);
    setNewItem('');
  };

  const addContact = (section: 'peopleToCall' | 'professionalHelp') => {
    if (!newContact.name.trim()) return;
    const updated = { ...plan, [section]: [...plan[section], { ...newContact }] };
    savePlan(updated);
    setNewContact({ name: '', phone: '' });
  };

  const removeItem = (section: keyof SafetyPlan, index: number) => {
    const arr = plan[section] as any[];
    const updated = { ...plan, [section]: arr.filter((_, i) => i !== index) };
    savePlan(updated);
  };

  const renderSection = (key: keyof SafetyPlan, isContact = false) => {
    const prompt = PROMPTS[key as keyof typeof PROMPTS];
    if (!prompt) return null;
    
    const items = plan[key];
    const isExpanded = activeSection === key;

    return (
      <View style={styles.section} key={key}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setActiveSection(isExpanded ? null : key)}
        >
          <View>
            <Text style={styles.sectionTitle}>{prompt.title}</Text>
            <Text style={styles.sectionSubtitle}>{prompt.subtitle}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{Array.isArray(items) ? items.length : 0}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {/* Existing Items */}
            {(items as any[]).map((item, i) => (
              <View key={i} style={styles.itemRow}>
                {isContact ? (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </View>
                ) : (
                  <Text style={styles.itemText}>{item}</Text>
                )}
                <TouchableOpacity onPress={() => removeItem(key, i)} style={styles.removeButton}>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add New */}
            {isContact ? (
              <View style={styles.addContactRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Name"
                  placeholderTextColor="#9CA3AF"
                  value={newContact.name}
                  onChangeText={(t) => setNewContact({ ...newContact, name: t })}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Phone"
                  placeholderTextColor="#9CA3AF"
                  value={newContact.phone}
                  onChangeText={(t) => setNewContact({ ...newContact, phone: t })}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addContact(key as 'peopleToCall' | 'professionalHelp')}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={prompt.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={() => addItem(key)}
                />
                <TouchableOpacity style={styles.addButton} onPress={() => addItem(key)}>
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Examples */}
            {prompt.examples.length > 0 && (
              <View style={styles.examples}>
                <Text style={styles.examplesLabel}>ideas:</Text>
                <View style={styles.exampleTags}>
                  {prompt.examples.map((ex, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.exampleTag}
                      onPress={() => {
                        if (!isContact) {
                          setNewItem(ex);
                        }
                      }}
                    >
                      <Text style={styles.exampleText}>{ex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>my safety plan</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSub}>
          your personal guide for tough moments. fill this out when you're calm so it's ready when you need it.
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSection('warningSigns')}
        {renderSection('copingStrategies')}
        {renderSection('distractions')}
        {renderSection('peopleToCall', true)}
        {renderSection('professionalHelp', true)}
        {renderSection('safeEnvironment')}
        {renderSection('reasonsToLive')}

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>🆘 in an emergency</Text>
          <Text style={styles.emergencyText}>
            if you're thinking about hurting yourself, please reach out:
          </Text>
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>Call/Text 988</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyNote}>free, confidential, 24/7</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  countBadge: { backgroundColor: '#EEF2FF', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  countText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  sectionContent: { padding: 18, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 8 },
  itemText: { flex: 1, fontSize: 15, color: '#1F2937' },
  contactItem: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  contactPhone: { fontSize: 13, color: '#6366F1', marginTop: 2 },
  removeButton: { padding: 4 },
  addRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  addContactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937' },
  addButton: { backgroundColor: '#6366F1', width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  examples: { marginTop: 16 },
  examplesLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  exampleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exampleTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  exampleText: { fontSize: 13, color: '#6366F1' },
  emergencyCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 8 },
  emergencyTitle: { fontSize: 18, fontWeight: '700', color: '#DC2626', marginBottom: 8 },
  emergencyText: { fontSize: 14, color: '#991B1B', textAlign: 'center', marginBottom: 16 },
  emergencyButton: { backgroundColor: '#DC2626', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  emergencyButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emergencyNote: { fontSize: 12, color: '#991B1B', marginTop: 8 },
});
