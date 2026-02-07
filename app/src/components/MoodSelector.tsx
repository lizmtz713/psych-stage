import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MOOD_EMOJIS } from '../types';

interface MoodSelectorProps {
  selected: number | null;
  onSelect: (mood: number) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((mood) => {
          const { emoji, label, color } = MOOD_EMOJIS[mood];
          const isSelected = selected === mood;
          return (
            <TouchableOpacity
              key={mood}
              style={[
                styles.moodButton,
                isSelected && { backgroundColor: color, transform: [{ scale: 1.1 }] }
              ]}
              onPress={() => onSelect(mood)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    minWidth: 64,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
