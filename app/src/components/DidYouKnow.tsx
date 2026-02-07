import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BRAIN_CARDS, BrainCard } from '../data/brain-health';

interface DidYouKnowProps {
  // Optional: filter by relevant categories
  categories?: string[];
  // Called when user dismisses
  onDismiss?: () => void;
  // Auto-show after delay (ms)
  showAfter?: number;
}

// Map skill categories to relevant brain health categories
const SKILL_TO_BRAIN_MAP: Record<string, string[]> = {
  calm: ['stress', 'basics'],
  mood: ['mood', 'movement'],
  thoughts: ['basics', 'focus'],
  connect: ['mood', 'basics'],
};

export function DidYouKnow({ 
  categories, 
  onDismiss,
  showAfter = 0,
}: DidYouKnowProps) {
  const [visible, setVisible] = useState(showAfter === 0);
  const [card, setCard] = useState<BrainCard | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Pick a random card with a funFact
    const relevantCards = BRAIN_CARDS.filter(c => {
      if (!c.funFact) return false;
      if (!categories || categories.length === 0) return true;
      return categories.includes(c.category);
    });
    
    if (relevantCards.length > 0) {
      setCard(relevantCards[Math.floor(Math.random() * relevantCards.length)]);
    }
  }, [categories]);

  useEffect(() => {
    if (showAfter > 0) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, showAfter);
      return () => clearTimeout(timer);
    }
  }, [showAfter]);

  useEffect(() => {
    if (visible && card) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, card]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible || !card) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>💡 did you know?</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>{card.emoji} {card.title}</Text>
        <Text style={styles.fact}>{card.funFact}</Text>
        
        <TouchableOpacity style={styles.gotItButton} onPress={handleDismiss}>
          <Text style={styles.gotItText}>got it</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Simpler inline version for embedding in other screens
export function DidYouKnowInline({ 
  skillCategory 
}: { 
  skillCategory?: 'calm' | 'mood' | 'thoughts' | 'connect' 
}) {
  const [card] = useState<BrainCard | null>(() => {
    const brainCategories = skillCategory 
      ? SKILL_TO_BRAIN_MAP[skillCategory] || []
      : [];
    
    const relevantCards = BRAIN_CARDS.filter(c => {
      if (!c.funFact) return false;
      if (brainCategories.length === 0) return true;
      return brainCategories.includes(c.category);
    });
    
    if (relevantCards.length === 0) return null;
    return relevantCards[Math.floor(Math.random() * relevantCards.length)];
  });

  if (!card) return null;

  return (
    <View style={styles.inlineCard}>
      <Text style={styles.inlineLabel}>💡 did you know?</Text>
      <Text style={styles.inlineFact}>{card.funFact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  fact: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
  },
  gotItButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  gotItText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Inline styles
  inlineCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 6,
  },
  inlineFact: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
});
