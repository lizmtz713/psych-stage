// Teen Navigator - Main navigation for teen users
// Includes all roleplay, serious topics, and specialized tracks

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { CheckInScreen } from '../screens/teen/CheckInScreen';
import { JournalScreen } from '../screens/teen/JournalScreen';
import { ResourcesScreen } from '../screens/teen/ResourcesScreen';
import { SkillsScreen } from '../screens/teen/SkillsScreen';
import { InsightsScreen } from '../screens/teen/InsightsScreen';
import { SafetyPlanScreen } from '../screens/teen/SafetyPlanScreen';
import { BreathingScreen } from '../screens/teen/BreathingScreen';
import { GroundingScreen } from '../screens/teen/GroundingScreen';
import { EmotionDetailScreen } from '../screens/teen/EmotionDetailScreen';
import { LearnScreen } from '../screens/teen/LearnScreen';

// New Roleplay Screens
import { SeriousTopicsScreen } from '../screens/teen/SeriousTopicsScreen';
import { RoleplayScreen } from '../screens/teen/RoleplayScreen';
import { SpecializedTracksScreen } from '../screens/teen/SpecializedTracksScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function TeenTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 90,
          paddingTop: 10,
          paddingBottom: 30,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          switch (route.name) {
            case 'CheckIn':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Skills':
              iconName = focused ? 'sparkles' : 'sparkles-outline';
              break;
            case 'Journal':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Practice':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Resources':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="CheckIn" 
        component={CheckInScreen} 
        options={{ tabBarLabel: 'check in' }}
      />
      <Tab.Screen 
        name="Skills" 
        component={SkillsScreen} 
        options={{ tabBarLabel: 'skills' }}
      />
      <Tab.Screen 
        name="Practice" 
        component={RoleplayHomeScreen} 
        options={{ tabBarLabel: 'practice' }}
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen} 
        options={{ tabBarLabel: 'journal' }}
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen} 
        options={{ tabBarLabel: 'help' }}
      />
    </Tab.Navigator>
  );
}

// Practice/Roleplay Home Screen (shows options)
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function RoleplayHomeScreen({ navigation }: any) {
  const menuItems = [
    {
      id: 'learn',
      title: 'learn',
      emoji: '🧠',
      description: 'understand your brain, improve your life',
      color: '#10B981',
      onPress: () => navigation.navigate('Learn'),
    },
    {
      id: 'quick-practice',
      title: 'quick practice',
      emoji: '⚡',
      description: 'roleplay scenarios for your age',
      color: '#6366F1',
      onPress: () => navigation.navigate('Roleplay'),
    },
    {
      id: 'serious-topics',
      title: 'tough stuff',
      emoji: '💜',
      description: 'substance use, self-harm, eating disorders & more',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('SeriousTopics'),
    },
    {
      id: 'specialized',
      title: 'specialized tracks',
      emoji: '🎯',
      description: 'LGBTQ+, neurodivergent, cultural, grief & more',
      color: '#A855F7',
      onPress: () => navigation.navigate('SpecializedTracks'),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>practice</Text>
        <Text style={styles.headerSub}>
          safe space to rehearse hard conversations
        </Text>
      </LinearGradient>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuEmoji, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.menuEmojiText}>{item.emoji}</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
        
        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>your practice</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>scenarios</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>skills learned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>streak</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 18, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  menuEmoji: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuEmojiText: { fontSize: 24 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  menuDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statsTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#6366F1' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});

// Main Teen Navigator with all screens
export function TeenNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TeenTabs" component={TeenTabNavigator} />
      
      {/* Roleplay & Practice Screens */}
      <Stack.Screen name="Roleplay" component={RoleplayScreen} />
      <Stack.Screen name="SeriousTopics" component={SeriousTopicsScreen} />
      <Stack.Screen name="SpecializedTracks" component={SpecializedTracksScreen} />
      
      {/* Existing Screens */}
      <Stack.Screen name="Breathing" component={BreathingScreen} />
      <Stack.Screen name="Grounding" component={GroundingScreen} />
      <Stack.Screen name="EmotionDetail" component={EmotionDetailScreen} />
      <Stack.Screen name="SafetyPlan" component={SafetyPlanScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      
      {/* Learn/Brain Health */}
      <Stack.Screen name="Learn" component={LearnScreen} />
    </Stack.Navigator>
  );
}

export default TeenNavigator;
