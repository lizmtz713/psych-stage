// Progress Tracking Service
// Tracks user progress through roleplay scenarios, skills learned, and achievements

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// TYPES
// ============================================

export interface ScenarioProgress {
  scenarioId: string;
  completedAt: number;
  score: number;
  turnsUsed: number;
  hintsUsed: number;
  skillsTargeted: string[];
  feedback?: string[];
}

export interface SkillProgress {
  skillId: string;
  timesUsed: number;
  averageScore: number;
  lastUsed: number;
  mastered: boolean;
}

export interface UserProgress {
  userId: string;
  
  // Overall stats
  totalScenariosCompleted: number;
  totalTurnsPlayed: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  
  // Detailed tracking
  completedScenarios: ScenarioProgress[];
  skillProgress: Record<string, SkillProgress>;
  topicsExplored: string[];
  
  // Achievements
  achievements: Achievement[];
  
  // Preferences learned
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  avoidedTopics: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt: number;
}

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

const ACHIEVEMENTS: Record<string, Omit<Achievement, 'unlockedAt'>> = {
  'first-scenario': {
    id: 'first-scenario',
    name: 'First Steps',
    description: 'Completed your first roleplay scenario',
    emoji: '🌱',
  },
  'five-scenarios': {
    id: 'five-scenarios',
    name: 'Getting the Hang of It',
    description: 'Completed 5 roleplay scenarios',
    emoji: '⭐',
  },
  'ten-scenarios': {
    id: 'ten-scenarios',
    name: 'Conversation Pro',
    description: 'Completed 10 roleplay scenarios',
    emoji: '🌟',
  },
  'perfect-score': {
    id: 'perfect-score',
    name: 'Nailed It',
    description: 'Got a perfect score on a scenario',
    emoji: '💯',
  },
  'three-day-streak': {
    id: 'three-day-streak',
    name: 'Consistency',
    description: 'Practiced 3 days in a row',
    emoji: '🔥',
  },
  'week-streak': {
    id: 'week-streak',
    name: 'Dedicated',
    description: 'Practiced 7 days in a row',
    emoji: '💪',
  },
  'boundary-master': {
    id: 'boundary-master',
    name: 'Boundary Master',
    description: 'Completed 3 boundary-setting scenarios',
    emoji: '🛡️',
  },
  'assertive-communicator': {
    id: 'assertive-communicator',
    name: 'Assertive Communicator',
    description: 'Used "I" statements in 5 scenarios',
    emoji: '🗣️',
  },
  'explorer': {
    id: 'explorer',
    name: 'Explorer',
    description: 'Tried scenarios from 3 different tracks',
    emoji: '🧭',
  },
  'brave-topics': {
    id: 'brave-topics',
    name: 'Brave',
    description: 'Practiced a scenario from Tough Stuff',
    emoji: '💜',
  },
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  LOCAL_PROGRESS: 'roleplay_progress',
  LAST_SYNC: 'roleplay_last_sync',
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeProgress = async (userId: string): Promise<UserProgress> => {
  const defaultProgress: UserProgress = {
    userId,
    totalScenariosCompleted: 0,
    totalTurnsPlayed: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    completedScenarios: [],
    skillProgress: {},
    topicsExplored: [],
    achievements: [],
    preferredDifficulty: 'beginner',
    avoidedTopics: [],
  };

  try {
    // Try to load from Firebase
    const docRef = doc(db, 'roleplayProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...defaultProgress, ...docSnap.data() } as UserProgress;
    }
    
    // Try local storage as fallback
    const localData = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_PROGRESS);
    if (localData) {
      return { ...defaultProgress, ...JSON.parse(localData) };
    }
    
    // Create new progress
    await setDoc(docRef, defaultProgress);
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_PROGRESS, JSON.stringify(defaultProgress));
    
    return defaultProgress;
  } catch (error) {
    console.error('Error initializing progress:', error);
    return defaultProgress;
  }
};

// ============================================
// PROGRESS UPDATES
// ============================================

export const recordScenarioCompletion = async (
  userId: string,
  scenarioId: string,
  score: number,
  turnsUsed: number,
  hintsUsed: number,
  skillsTargeted: string[],
  topicId?: string
): Promise<{ newAchievements: Achievement[] }> => {
  const progress = await initializeProgress(userId);
  const today = new Date().toISOString().split('T')[0];
  const newAchievements: Achievement[] = [];
  
  // Create scenario record
  const scenarioProgress: ScenarioProgress = {
    scenarioId,
    completedAt: Date.now(),
    score,
    turnsUsed,
    hintsUsed,
    skillsTargeted,
  };
  
  // Update stats
  progress.completedScenarios.push(scenarioProgress);
  progress.totalScenariosCompleted += 1;
  progress.totalTurnsPlayed += turnsUsed;
  
  // Update streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (progress.lastActiveDate === yesterday) {
    progress.currentStreak += 1;
  } else if (progress.lastActiveDate !== today) {
    progress.currentStreak = 1;
  }
  progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
  progress.lastActiveDate = today;
  
  // Update topics explored
  if (topicId && !progress.topicsExplored.includes(topicId)) {
    progress.topicsExplored.push(topicId);
  }
  
  // Update skill progress
  skillsTargeted.forEach(skill => {
    const skillKey = skill.toLowerCase().replace(/\s+/g, '-');
    if (!progress.skillProgress[skillKey]) {
      progress.skillProgress[skillKey] = {
        skillId: skillKey,
        timesUsed: 0,
        averageScore: 0,
        lastUsed: 0,
        mastered: false,
      };
    }
    const sp = progress.skillProgress[skillKey];
    sp.averageScore = (sp.averageScore * sp.timesUsed + score) / (sp.timesUsed + 1);
    sp.timesUsed += 1;
    sp.lastUsed = Date.now();
    if (sp.timesUsed >= 5 && sp.averageScore >= 4) {
      sp.mastered = true;
    }
  });
  
  // Check for achievements
  const achievementsToCheck = [
    { id: 'first-scenario', check: () => progress.totalScenariosCompleted === 1 },
    { id: 'five-scenarios', check: () => progress.totalScenariosCompleted === 5 },
    { id: 'ten-scenarios', check: () => progress.totalScenariosCompleted === 10 },
    { id: 'perfect-score', check: () => score === 5 },
    { id: 'three-day-streak', check: () => progress.currentStreak >= 3 },
    { id: 'week-streak', check: () => progress.currentStreak >= 7 },
    { id: 'explorer', check: () => progress.topicsExplored.length >= 3 },
    { id: 'brave-topics', check: () => topicId && ['substance-abuse', 'self-harm', 'eating-disorders', 'domestic-violence', 'trafficking-awareness', 'anxiety-disorders'].includes(topicId) },
  ];
  
  achievementsToCheck.forEach(({ id, check }) => {
    if (check() && !progress.achievements.some(a => a.id === id)) {
      const achievement: Achievement = {
        ...ACHIEVEMENTS[id],
        unlockedAt: Date.now(),
      };
      progress.achievements.push(achievement);
      newAchievements.push(achievement);
    }
  });
  
  // Save progress
  await saveProgress(userId, progress);
  
  return { newAchievements };
};

// ============================================
// PROGRESS QUERIES
// ============================================

export const getProgress = async (userId: string): Promise<UserProgress> => {
  return initializeProgress(userId);
};

export const getCompletedScenarioIds = async (userId: string): Promise<string[]> => {
  const progress = await getProgress(userId);
  return progress.completedScenarios.map(s => s.scenarioId);
};

export const getSkillProgress = async (userId: string): Promise<SkillProgress[]> => {
  const progress = await getProgress(userId);
  return Object.values(progress.skillProgress);
};

export const getMasteredSkills = async (userId: string): Promise<string[]> => {
  const progress = await getProgress(userId);
  return Object.values(progress.skillProgress)
    .filter(s => s.mastered)
    .map(s => s.skillId);
};

export const getRecentAchievements = async (
  userId: string,
  limit: number = 5
): Promise<Achievement[]> => {
  const progress = await getProgress(userId);
  return progress.achievements
    .sort((a, b) => b.unlockedAt - a.unlockedAt)
    .slice(0, limit);
};

export const getStats = async (userId: string): Promise<{
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  topSkill: string | null;
  achievementCount: number;
}> => {
  const progress = await getProgress(userId);
  
  // Find top skill
  const skills = Object.values(progress.skillProgress);
  const topSkill = skills.length > 0
    ? skills.reduce((max, s) => s.timesUsed > max.timesUsed ? s : max).skillId
    : null;
  
  return {
    totalCompleted: progress.totalScenariosCompleted,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    topSkill,
    achievementCount: progress.achievements.length,
  };
};

// ============================================
// RECOMMENDATIONS
// ============================================

export const getRecommendedNextScenarios = async (
  userId: string,
  allScenarioIds: string[],
  limit: number = 5
): Promise<string[]> => {
  const completedIds = await getCompletedScenarioIds(userId);
  const incompleteIds = allScenarioIds.filter(id => !completedIds.includes(id));
  
  // For now, just return random incomplete scenarios
  // Could be enhanced with ML/smarter recommendations
  return incompleteIds.slice(0, limit);
};

// ============================================
// PERSISTENCE
// ============================================

const saveProgress = async (userId: string, progress: UserProgress): Promise<void> => {
  try {
    // Save to Firebase
    const docRef = doc(db, 'roleplayProgress', userId);
    await setDoc(docRef, progress, { merge: true });
    
    // Save to local storage as backup
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_PROGRESS, JSON.stringify(progress));
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error saving progress:', error);
    // Still save locally if Firebase fails
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_PROGRESS, JSON.stringify(progress));
  }
};

export const syncProgress = async (userId: string): Promise<void> => {
  try {
    const localData = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_PROGRESS);
    if (localData) {
      const localProgress = JSON.parse(localData);
      const docRef = doc(db, 'roleplayProgress', userId);
      await setDoc(docRef, localProgress, { merge: true });
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    }
  } catch (error) {
    console.error('Error syncing progress:', error);
  }
};

// ============================================
// EXPORTS FOR COMPONENTS
// ============================================

export const ProgressService = {
  initialize: initializeProgress,
  recordCompletion: recordScenarioCompletion,
  getProgress,
  getCompletedIds: getCompletedScenarioIds,
  getSkillProgress,
  getMasteredSkills,
  getRecentAchievements,
  getStats,
  getRecommendations: getRecommendedNextScenarios,
  sync: syncProgress,
};

export default ProgressService;
