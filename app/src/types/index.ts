export type UserRole = 'parent' | 'teen';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  familyId?: string;
  createdAt: Date;
}

export interface Family {
  id: string;
  name: string;
  parentId: string;
  inviteCode: string;
  createdAt: Date;
}

export interface MoodCheckin {
  id: string;
  userId: string;
  familyId: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  aiAnalysis?: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'concerning';
    themes: string[];
    needsAttention: boolean;
  };
  createdAt: Date;
}

export interface Alert {
  id: string;
  familyId: string;
  teenId: string;
  level: 'green' | 'yellow' | 'red';
  message: string;
  guidance: string;
  read: boolean;
  createdAt: Date;
}

export const MOOD_EMOJIS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😢', label: 'Really Low', color: '#EF4444' },
  2: { emoji: '😔', label: 'Not Great', color: '#F97316' },
  3: { emoji: '😐', label: 'Okay', color: '#EAB308' },
  4: { emoji: '🙂', label: 'Good', color: '#22C55E' },
  5: { emoji: '😄', label: 'Great!', color: '#10B981' },
};
